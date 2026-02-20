const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// ─── Perlin Noise ─────────────────────────────────────────────────────────────
function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s += 0x6D2B79F5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createNoise(seed) {
  const rand = mulberry32(seed);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  const perm = [...p, ...p];

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + t * (b - a); }
  function grad(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }
  function noise(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const a = perm[X] + Y, b = perm[X + 1] + Y;
    return lerp(
      lerp(grad(perm[a], x, y), grad(perm[b], x - 1, y), u),
      lerp(grad(perm[a + 1], x, y - 1), grad(perm[b + 1], x - 1, y - 1), u), v
    );
  }
  function octave(x, y, octs, persistence, scale) {
    let val = 0, amp = 1, freq = 1, max = 0;
    for (let i = 0; i < octs; i++) {
      val += noise(x * freq / scale, y * freq / scale) * amp;
      max += amp; amp *= persistence; freq *= 2;
    }
    return val / max;
  }
  return { noise, octave };
}

// ─── Block Types ──────────────────────────────────────────────────────────────
const B = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, SAND: 4, GRAVEL: 5,
  WOOD: 6, LEAVES: 7, WATER: 8, LAVA: 9, COAL_ORE: 10,
  IRON_ORE: 11, GOLD_ORE: 12, DIAMOND_ORE: 13, BEDROCK: 14,
  PLANKS: 15, COBBLESTONE: 16, GLASS: 17, BRICK: 18,
  TORCH: 19, CHEST: 20, CRAFTING_TABLE: 21, FURNACE: 22,
  BED: 23, DOOR: 24, LADDER: 25, TNT: 26, OBSIDIAN: 27,
  SNOW: 28, ICE: 29, CACTUS: 30, CLAY: 31, SANDSTONE: 32,
  MOSSY_COBBLE: 33, BOOKSHELF: 34, WOOL: 35,
};

const VALID_BLOCK_IDS = new Set(Object.values(B).filter(v => v !== B.AIR && v !== B.BEDROCK));

const CHUNK_SIZE = 16;
const WORLD_HEIGHT = 128;
const SEA_LEVEL = 64;

function isPassable(b) {
  return b === B.AIR || b === B.WATER || b === B.LAVA || b === B.TORCH || b === B.LADDER || b === B.LEAVES;
}

// ─── Chunk Generation ─────────────────────────────────────────────────────────
function generateChunk(cx, seed) {
  const { octave } = createNoise(seed);
  const blocks = {};

  // Pre-compute surface heights for neighbor awareness (trees crossing chunks)
  const surfaceMap = {};
  for (let lx = -2; lx < CHUNK_SIZE + 2; lx++) {
    const wx = cx * CHUNK_SIZE + lx;
    const heightN = octave(wx, 0, 4, 0.5, 60);
    surfaceMap[lx] = Math.floor(SEA_LEVEL + heightN * 18);
  }

  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    const wx = cx * CHUNK_SIZE + lx;
    const surfaceY = surfaceMap[lx];

    const biomeN = octave(wx * 0.25, 100, 2, 0.5, 80);
    const isDesert = biomeN > 0.35;
    const isSnowy = biomeN < -0.4;

    for (let y = 0; y < WORLD_HEIGHT; y++) {
      const key = `${lx},${y}`;
      let block = B.AIR;

      if (y >= WORLD_HEIGHT - 2) {
        block = B.BEDROCK;
      } else if (y > surfaceY) {
        const caveV = octave(wx * 0.09, y * 0.09, 3, 0.5, 1);
        if (caveV > 0.26) {
          block = B.AIR;
        } else {
          const fromBottom = WORLD_HEIGHT - y;
          const oreN = Math.abs(octave(wx * 3.1 + 17, y * 3.1 + 17, 2, 0.5, 4));
          if (fromBottom <= 16 && oreN > 0.30) block = B.DIAMOND_ORE;
          else if (fromBottom <= 32 && oreN > 0.28) block = B.GOLD_ORE;
          else if (oreN > 0.18) block = B.IRON_ORE;
          else if (oreN > 0.10) block = B.COAL_ORE;
          else block = B.STONE;
        }
      } else if (y === surfaceY) {
        block = isDesert ? B.SAND : isSnowy ? B.SNOW : B.GRASS;
      } else if (y > surfaceY - 4) {
        block = isDesert ? B.SAND : B.DIRT;
      } else if (surfaceY > SEA_LEVEL && y > SEA_LEVEL && y < surfaceY) {
        block = B.WATER;
      }

      if (block !== B.AIR) blocks[key] = block;
    }

    // Trees — only within this chunk (no cross-chunk leaf placement)
    if (!isDesert && !isSnowy && surfaceY < SEA_LEVEL) {
      const treeN = octave(wx * 5.7 + 300, 0, 1, 0.5, 4);
      if (treeN > 0.35) {
        const base = surfaceY - 1;
        for (let h = 0; h < 5; h++) {
          const tk = `${lx},${base - h}`;
          blocks[tk] = B.WOOD;
        }
        // Leaves — only place within this chunk's lx range
        for (let dy = 0; dy <= 3; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const tlx = lx + dx;
            if (tlx < 0 || tlx >= CHUNK_SIZE) continue; // skip cross-chunk
            if (Math.abs(dx) + dy <= 3) {
              const k = `${tlx},${base - 4 - dy}`;
              if (!blocks[k]) blocks[k] = B.LEAVES;
            }
          }
        }
      }
    }

    // Cactus
    if (isDesert && surfaceY < SEA_LEVEL) {
      const cacN = octave(wx * 8 + 500, 0, 1, 0.5, 3);
      if (cacN > 0.42) {
        for (let h = 1; h <= 3; h++) {
          const k = `${lx},${surfaceY - h}`;
          if (!blocks[k]) blocks[k] = B.CACTUS;
        }
      }
    }
  }
  return blocks;
}

// ─── Room State ───────────────────────────────────────────────────────────────
const rooms = new Map();
let mobIdCounter = 0;

function createRoom(code) {
  const seed = Math.floor(Math.random() * 999999);
  const room = {
    code, seed,
    chunks: new Map(),
    players: new Map(),
    mobs: new Map(),
    chat: [],
    dayTime: 6000,
  };
  room.tickInterval = setInterval(() => tickRoom(room), 50);
  rooms.set(code, room);
  return room;
}

function getOrGenChunk(room, cx) {
  if (!room.chunks.has(cx)) {
    room.chunks.set(cx, { blocks: generateChunk(cx, room.seed + cx * 7919), modified: {} });
  }
  return room.chunks.get(cx);
}

function getBlock(room, wx, wy) {
  if (wy < 0 || wy >= WORLD_HEIGHT) return B.AIR;
  const cx = Math.floor(wx / CHUNK_SIZE);
  const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  const chunk = getOrGenChunk(room, cx);
  const key = `${lx},${wy}`;
  return chunk.modified[key] !== undefined ? chunk.modified[key] : (chunk.blocks[key] || B.AIR);
}

function setBlock(room, wx, wy, blockId) {
  const cx = Math.floor(wx / CHUNK_SIZE);
  const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  const chunk = getOrGenChunk(room, cx);
  chunk.modified[`${lx},${wy}`] = blockId;
}

function findSurface(room, wx) {
  for (let y = 5; y < WORLD_HEIGHT - 5; y++) {
    if (!isPassable(getBlock(room, wx, y)) && isPassable(getBlock(room, wx, y - 1))) {
      return y - 2; // place player 2 above surface to avoid clipping
    }
  }
  return SEA_LEVEL - 5;
}

// ─── Mob AI ───────────────────────────────────────────────────────────────────
function spawnMob(room, x, y, type) {
  const id = ++mobIdCounter;
  room.mobs.set(id, {
    id, type, x, y, vx: 0, vy: 0,
    hp: type === 'zombie' ? 20 : 16,
    dir: 1, atkCD: 0, jumpCD: 0
  });
}

function tickRoom(room) {
  room.dayTime = (room.dayTime + 1) % 24000;
  const isNight = room.dayTime > 13000 && room.dayTime < 22000;

  if (isNight && room.players.size > 0 && room.mobs.size < 15) {
    for (const [, p] of room.players) {
      if (Math.random() < 0.003) {
        const sx = Math.floor(p.x + (Math.random() > 0.5 ? 1 : -1) * (15 + Math.random() * 15));
        const sy = findSurface(room, sx);
        spawnMob(room, sx, sy, Math.random() > 0.5 ? 'zombie' : 'spider');
      }
    }
  }

  if (!isNight && room.mobs.size > 0 && Math.random() < 0.01) {
    const ids = [...room.mobs.keys()];
    if (ids.length) room.mobs.delete(ids[0]);
  }

  for (const [id, mob] of room.mobs) {
    updateMob(room, mob);
    if (mob.hp <= 0) {
      room.mobs.delete(id);
      broadcast(room, JSON.stringify({ type: 'mob_die', id }));
    }
  }

  if (room.players.size === 0) return;

  const msg = JSON.stringify({
    type: 'tick',
    dayTime: room.dayTime,
    mobs: [...room.mobs.values()].map(m => ({ id: m.id, x: m.x, y: m.y, hp: m.hp, type: m.type, dir: m.dir })),
    players: [...room.players.values()].map(p => ({ id: p.id, x: p.x, y: p.y, name: p.name, dir: p.dir, hp: p.hp }))
  });

  for (const [, p] of room.players) {
    if (p.ws.readyState === WebSocket.OPEN) p.ws.send(msg);
  }
}

function updateMob(room, mob) {
  mob.vy = Math.min(mob.vy + 0.4, 8);
  mob.atkCD = Math.max(0, mob.atkCD - 1);
  mob.jumpCD = Math.max(0, mob.jumpCD - 1);

  let nearest = null, nd = Infinity;
  for (const [, p] of room.players) {
    const d = Math.hypot(p.x - mob.x, p.y - mob.y);
    if (d < nd) { nd = d; nearest = p; }
  }

  if (nearest && nd < 25) {
    mob.dir = nearest.x > mob.x ? 1 : -1;
    mob.vx = mob.dir * (mob.type === 'spider' ? 1.0 : 0.7);
    if (mob.jumpCD <= 0) {
      const frontX = Math.floor(mob.x + mob.dir * 0.6);
      const frontY = Math.floor(mob.y);
      if (!isPassable(getBlock(room, frontX, frontY))) {
        mob.vy = -7; mob.jumpCD = 25;
      }
    }
    if (nd < 1.5 && mob.atkCD <= 0) {
      nearest.hp = Math.max(0, nearest.hp - 3);
      mob.atkCD = 20;
      if (nearest.ws.readyState === WebSocket.OPEN) {
        nearest.ws.send(JSON.stringify({ type: 'damage', amount: 3, hp: nearest.hp }));
      }
    }
  } else {
    mob.vx = mob.dir * 0.2;
    if (Math.random() < 0.008) mob.dir *= -1;
  }

  // X collision
  const nx = mob.x + mob.vx * 0.05;
  if (isPassable(getBlock(room, Math.floor(nx + (mob.dir > 0 ? 0.9 : 0)), Math.floor(mob.y)))) mob.x = nx;
  else mob.dir *= -1;

  // Y collision (simple)
  const ny = mob.y + mob.vy * 0.05;
  const bBelow = getBlock(room, Math.floor(mob.x + 0.5), Math.floor(ny + 1.8));
  if (mob.vy > 0 && !isPassable(bBelow)) {
    mob.y = Math.floor(mob.y + 1) - 1.8;
    mob.vy = 0;
  } else if (mob.vy < 0 && !isPassable(getBlock(room, Math.floor(mob.x + 0.5), Math.floor(ny)))) {
    mob.vy = 0;
  } else {
    mob.y = ny;
  }
  mob.y = Math.max(0, Math.min(WORLD_HEIGHT - 2, mob.y));
}

// ─── HTTP + WebSocket ─────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    try {
      const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (e) {
      res.writeHead(500);
      res.end('index.html introuvable');
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const wss = new WebSocket.Server({ server });

function genCode() {
  let code;
  let attempts = 0;
  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
    attempts++;
    if (attempts > 100) break;
  } while (rooms.has(code));
  return code;
}

function broadcast(room, data, excludeId = null) {
  for (const [id, p] of room.players) {
    if (id !== excludeId && p.ws.readyState === WebSocket.OPEN) p.ws.send(data);
  }
}

// Rate limiting per player
const RATE_LIMIT_MS = 100; // min ms between chat messages

wss.on('connection', ws => {
  let player = null, room = null;
  let lastChatTime = 0;

  // Heartbeat / timeout detection
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', raw => {
    if (raw.length > 4096) return; // reject oversized messages
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'create_room': {
        if (player) return; // already in a room
        const code = genCode();
        room = createRoom(code);
        const pid = crypto.randomUUID();
        const sy = findSurface(room, 0);
        player = {
          id: pid,
          name: sanitizeName(msg.name),
          ws, x: 0, y: sy, dir: 1, hp: 20,
          bedX: null, bedY: null,
          lastMoveTime: 0,
        };
        room.players.set(pid, player);
        ws.send(JSON.stringify({ type: 'joined', roomCode: code, playerId: pid, seed: room.seed, x: 0, y: sy }));
        break;
      }

      case 'join_room': {
        if (player) return;
        const code = (msg.code || '').toUpperCase().substring(0, 8);
        room = rooms.get(code);
        if (!room) { ws.send(JSON.stringify({ type: 'error', msg: 'Salon introuvable' })); return; }
        const pid = crypto.randomUUID();
        const sy = findSurface(room, 0);
        player = {
          id: pid,
          name: sanitizeName(msg.name),
          ws, x: 0, y: sy, dir: 1, hp: 20,
          bedX: null, bedY: null,
          lastMoveTime: 0,
        };
        room.players.set(pid, player);
        broadcast(room, JSON.stringify({ type: 'player_join', id: pid, name: player.name }), pid);
        ws.send(JSON.stringify({ type: 'joined', roomCode: code, playerId: pid, seed: room.seed, x: 0, y: sy }));
        ws.send(JSON.stringify({ type: 'chat_history', messages: room.chat }));
        break;
      }

      case 'move': {
        if (!player) return;
        const now = Date.now();
        // Basic sanity: don't allow teleporting more than 20 blocks per tick
        const dx = Math.abs((msg.x || 0) - player.x);
        const dy = Math.abs((msg.y || 0) - player.y);
        const dt = now - player.lastMoveTime;
        const maxDist = dt * 0.02; // 20 blocks/sec max
        if (dx > maxDist + 2 || dy > maxDist + 5) break; // reject teleport
        if (!isFinite(msg.x) || !isFinite(msg.y)) break;
        player.x = msg.x;
        player.y = Math.max(0, Math.min(WORLD_HEIGHT - 2, msg.y));
        player.dir = msg.dir === -1 ? -1 : 1;
        player.lastMoveTime = now;
        break;
      }

      case 'request_chunk': {
        if (!room) return;
        const cx = parseInt(msg.cx);
        if (!isFinite(cx) || Math.abs(cx) > 10000) return;
        const chunk = getOrGenChunk(room, cx);
        ws.send(JSON.stringify({ type: 'chunk', cx, blocks: { ...chunk.blocks, ...chunk.modified } }));
        break;
      }

      case 'break_block': {
        if (!room || !player) return;
        const bx = Math.round(msg.x), by = Math.round(msg.y);
        if (!isFinite(bx) || !isFinite(by)) return;
        // Must be within reach
        const dist = Math.hypot(bx + 0.5 - (player.x + 0.4), by + 0.5 - (player.y + 0.925));
        if (dist > 8) return;
        // Can't break bedrock
        if (getBlock(room, bx, by) === B.BEDROCK) return;
        setBlock(room, bx, by, B.AIR);
        broadcast(room, JSON.stringify({ type: 'block_change', x: bx, y: by, block: B.AIR }));
        break;
      }

      case 'place_block': {
        if (!room || !player) return;
        const bx = Math.round(msg.x), by = Math.round(msg.y);
        const blockId = parseInt(msg.block);
        if (!isFinite(bx) || !isFinite(by)) return;
        if (!VALID_BLOCK_IDS.has(blockId)) return; // reject invalid blocks
        const dist = Math.hypot(bx + 0.5 - (player.x + 0.4), by + 0.5 - (player.y + 0.925));
        if (dist > 8) return;
        setBlock(room, bx, by, blockId);
        if (blockId === B.BED && player) { player.bedX = bx; player.bedY = by; }
        broadcast(room, JSON.stringify({ type: 'block_change', x: bx, y: by, block: blockId }));
        break;
      }

      case 'chat': {
        if (!room || !player) return;
        const now = Date.now();
        if (now - lastChatTime < RATE_LIMIT_MS) return; // rate limit
        lastChatTime = now;
        const text = (msg.text || '').substring(0, 200).trim();
        if (!text) return;
        const cm = { name: player.name, text, ts: now };
        room.chat.push(cm);
        if (room.chat.length > 100) room.chat.shift();
        broadcast(room, JSON.stringify({ type: 'chat', ...cm }));
        break;
      }

      case 'respawn': {
        if (!player || !room) return;
        player.hp = 20;
        if (player.bedX !== null) {
          // Find safe spot near bed
          const bx = player.bedX;
          let by = player.bedY - 1;
          // Make sure spawn spot is clear
          for (let attempt = 0; attempt < 5; attempt++) {
            if (isPassable(getBlock(room, bx, by)) && isPassable(getBlock(room, bx, by - 1))) break;
            by--;
          }
          player.x = bx;
          player.y = by - 1;
        } else {
          const sx = Math.max(-500, Math.min(500, parseInt(msg.spawnX) || 0));
          player.x = sx;
          player.y = findSurface(room, sx);
        }
        ws.send(JSON.stringify({ type: 'respawned', x: player.x, y: player.y, hp: 20 }));
        break;
      }

      case 'attack_mob': {
        if (!room || !player) return;
        const mob = room.mobs.get(msg.mobId);
        if (!mob) return;
        // Verify distance
        const dist = Math.hypot(mob.x - player.x, mob.y - player.y);
        if (dist > 5) return;
        const dmg = Math.max(1, Math.min(20, parseInt(msg.damage) || 2));
        mob.hp -= dmg;
        if (mob.hp <= 0) {
          room.mobs.delete(msg.mobId);
          broadcast(room, JSON.stringify({ type: 'mob_die', id: msg.mobId }));
        }
        break;
      }
    }
  });

  ws.on('close', () => {
    if (player && room) {
      room.players.delete(player.id);
      broadcast(room, JSON.stringify({ type: 'player_leave', id: player.id }));
      if (room.players.size === 0) {
        clearInterval(room.tickInterval);
        rooms.delete(room.code);
      }
    }
  });

  ws.on('error', () => { });
});

// Heartbeat to detect dead connections
const heartbeat = setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) { ws.terminate(); return; }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => clearInterval(heartbeat));

function sanitizeName(name) {
  return (name || 'Player')
    .replace(/[<>&"]/g, '')
    .substring(0, 16)
    .trim() || 'Player';
}

server.listen(PORT, () => console.log(`🎮 Minecraft 2D on port ${PORT}`));
