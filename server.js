const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;

// ─── Perlin Noise ────────────────────────────────────────────────────────────
function mulberry32(seed) {
  let s = seed >>> 0;
  return function() {
    s += 0x6D2B79F5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createNoise(seed) {
  const rand = mulberry32(seed);
  const p = Array.from({length: 256}, (_, i) => i);
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
    const a = perm[X] + Y, b = perm[X+1] + Y;
    return lerp(
      lerp(grad(perm[a], x, y), grad(perm[b], x-1, y), u),
      lerp(grad(perm[a+1], x, y-1), grad(perm[b+1], x-1, y-1), u), v
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

// ─── Block Types ─────────────────────────────────────────────────────────────
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

const CHUNK_SIZE = 16;
const WORLD_HEIGHT = 128;
const SEA_LEVEL = 64;

function isPassable(b) {
  return b === B.AIR || b === B.WATER || b === B.LAVA || b === B.TORCH || b === B.LADDER;
}

// ─── Chunk Generation ────────────────────────────────────────────────────────
function generateChunk(cx, seed) {
  const { octave } = createNoise(seed);
  const blocks = {};

  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    const wx = cx * CHUNK_SIZE + lx;
    const heightN = octave(wx, 0, 6, 0.5, 80);
    const surfaceY = Math.floor(SEA_LEVEL + heightN * 25);
    const biomeN = octave(wx * 0.3, 100, 2, 0.5, 60);
    const isDesert = biomeN > 0.3;
    const isSnowy = biomeN < -0.4;

    // Y=0 = sky top, Y=WH-1 = bedrock bottom
    // surfaceY is where grass/sand is, smaller Y = higher up = sky
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      const key = `${lx},${y}`;
      let block = B.AIR;
      const caveV = octave(wx * 0.08, y * 0.08, 3, 0.5, 1);

      if (y >= WORLD_HEIGHT - 3) {
        block = B.BEDROCK; // bedrock at very bottom
      } else if (y > surfaceY) {
        // underground (below surface)
        if (caveV > 0.28) { block = B.AIR; }
        else if (y >= WORLD_HEIGHT - 10) { block = B.BEDROCK; }
        else {
          const oreN = Math.abs(octave(wx * 2.3, y * 2.3, 2, 0.5, 3));
          const depth = WORLD_HEIGHT - y;
          if (depth < 18 && oreN > 0.36) block = B.DIAMOND_ORE;
          else if (depth < 32 && oreN > 0.33) block = B.GOLD_ORE;
          else if (oreN > 0.29) block = B.IRON_ORE;
          else if (oreN > 0.24) block = B.COAL_ORE;
          else block = B.STONE;
        }
      } else if (y === surfaceY) {
        block = isDesert ? B.SAND : isSnowy ? B.SNOW : B.GRASS;
      } else if (y > surfaceY - 4) {
        block = isDesert ? B.SAND : B.DIRT;
      } else if (y > SEA_LEVEL && y < surfaceY) {
        block = B.WATER; // water above surface but below sea level
      }
      // y < surfaceY - 4 = sky = AIR (default)
      if (block !== B.AIR) blocks[key] = block;
    }

    // Trees grow UP = decreasing Y
    if (!isDesert && !isSnowy && surfaceY < SEA_LEVEL) {
      const treeN = octave(wx * 5.1, 200, 1, 0.5, 3);
      if (treeN > 0.38) {
        const base = surfaceY - 1; // one above surface
        for (let h = 0; h < 5; h++) blocks[`${lx},${base - h}`] = B.WOOD;
        for (let dy = 0; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (Math.abs(dx) + dy < 4) {
              const k = `${lx + dx},${base - 5 - dy}`;
              if (!blocks[k]) blocks[k] = B.LEAVES;
            }
          }
        }
        if (!blocks[`${lx},${base-7}`]) blocks[`${lx},${base-7}`] = B.LEAVES;
      }
    }

    // Cactus grows UP = decreasing Y
    if (isDesert && surfaceY < SEA_LEVEL) {
      const cacN = octave(wx * 7, 300, 1, 0.5, 2);
      if (cacN > 0.42) {
        for (let h = 1; h <= 3; h++) blocks[`${lx},${surfaceY - h}`] = B.CACTUS;
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
  // Y=0 is top (sky), Y=WH-1 is bottom (bedrock)
  // Search from top down: find first AIR block above a solid block
  for (let y = 1; y < WORLD_HEIGHT - 2; y++) {
    const cur = getBlock(room, wx, y);
    const below = getBlock(room, wx, y + 1);
    if (isPassable(cur) && !isPassable(below)) {
      return y; // stand here (air block just above solid)
    }
  }
  return SEA_LEVEL - 5;
}

// ─── Mob AI ───────────────────────────────────────────────────────────────────
function spawnMob(room, x, y, type) {
  const id = ++mobIdCounter;
  room.mobs.set(id, { id, type, x, y, vx: 0, vy: 0, hp: type === 'zombie' ? 20 : 16, dir: 1, atkCD: 0, jumpCD: 0 });
}

function tickRoom(room) {
  room.dayTime = (room.dayTime + 1) % 24000;
  const isNight = room.dayTime > 13000;

  // Spawn
  if (isNight && room.players.size > 0 && room.mobs.size < 15) {
    for (const [, p] of room.players) {
      if (Math.random() < 0.003) {
        const sx = Math.floor(p.x + (Math.random() > 0.5 ? 1 : -1) * (15 + Math.random() * 15));
        const sy = findSurface(room, sx);
        spawnMob(room, sx, sy, Math.random() > 0.5 ? 'zombie' : 'spider');
      }
    }
  }
  // Despawn day
  if (!isNight && room.mobs.size > 0 && Math.random() < 0.01) {
    const ids = [...room.mobs.keys()];
    if (ids.length) room.mobs.delete(ids[0]);
  }

  // Update mobs
  for (const [id, mob] of room.mobs) {
    updateMob(room, mob);
    if (mob.hp <= 0) room.mobs.delete(id);
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
  const nx = mob.x + mob.vx;
  if (isPassable(getBlock(room, Math.floor(nx), Math.floor(mob.y)))) mob.x = nx;
  else mob.dir *= -1;

  // Y collision
  const ny = mob.y + mob.vy;
  if (isPassable(getBlock(room, Math.floor(mob.x), Math.floor(ny)))) {
    mob.y = ny;
  } else {
    if (mob.vy > 0) mob.y = Math.floor(mob.y);
    mob.vy = 0;
  }
  mob.y = Math.max(0, Math.min(WORLD_HEIGHT - 1, mob.y));
}

// ─── WebSocket ────────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    try {
      const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (e) {
      res.writeHead(500);
      res.end('index.html introuvable sur le serveur');
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const wss = new WebSocket.Server({ server });

function genCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function broadcast(room, data, excludeId = null) {
  for (const [id, p] of room.players) {
    if (id !== excludeId && p.ws.readyState === WebSocket.OPEN) p.ws.send(data);
  }
}

wss.on('connection', ws => {
  let player = null, room = null;

  ws.on('message', raw => {
    let msg; try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'create_room': {
        const code = genCode();
        room = createRoom(code);
        const pid = crypto.randomUUID();
        const sy = findSurface(room, 0);
        player = { id: pid, name: (msg.name||'Player').substring(0,16), ws, x: 0, y: sy, dir: 1, hp: 20, bedX: null, bedY: null };
        room.players.set(pid, player);
        ws.send(JSON.stringify({ type: 'joined', roomCode: code, playerId: pid, seed: room.seed, x: 0, y: sy }));
        break;
      }
      case 'join_room': {
        const code = (msg.code||'').toUpperCase();
        room = rooms.get(code);
        if (!room) { ws.send(JSON.stringify({ type: 'error', msg: 'Salon introuvable' })); return; }
        const pid = crypto.randomUUID();
        const sy = findSurface(room, 0);
        player = { id: pid, name: (msg.name||'Player').substring(0,16), ws, x: 0, y: sy, dir: 1, hp: 20, bedX: null, bedY: null };
        room.players.set(pid, player);
        broadcast(room, JSON.stringify({ type: 'player_join', id: pid, name: player.name }), pid);
        ws.send(JSON.stringify({ type: 'joined', roomCode: code, playerId: pid, seed: room.seed, x: 0, y: sy }));
        ws.send(JSON.stringify({ type: 'chat_history', messages: room.chat }));
        break;
      }
      case 'move': {
        if (!player) return;
        player.x = msg.x; player.y = msg.y; player.dir = msg.dir || 1;
        break;
      }
      case 'request_chunk': {
        if (!room) return;
        const chunk = getOrGenChunk(room, msg.cx);
        ws.send(JSON.stringify({ type: 'chunk', cx: msg.cx, blocks: { ...chunk.blocks, ...chunk.modified } }));
        break;
      }
      case 'break_block': {
        if (!room) return;
        setBlock(room, msg.x, msg.y, B.AIR);
        broadcast(room, JSON.stringify({ type: 'block_change', x: msg.x, y: msg.y, block: B.AIR }));
        break;
      }
      case 'place_block': {
        if (!room) return;
        setBlock(room, msg.x, msg.y, msg.block);
        if (msg.block === B.BED && player) { player.bedX = msg.x; player.bedY = msg.y; }
        broadcast(room, JSON.stringify({ type: 'block_change', x: msg.x, y: msg.y, block: msg.block }));
        break;
      }
      case 'chat': {
        if (!room || !player) return;
        const cm = { name: player.name, text: (msg.text||'').substring(0, 200), ts: Date.now() };
        room.chat.push(cm);
        if (room.chat.length > 100) room.chat.shift();
        broadcast(room, JSON.stringify({ type: 'chat', ...cm }));
        break;
      }
      case 'respawn': {
        if (!player || !room) return;
        player.hp = 20;
        if (player.bedX !== null) {
          player.x = player.bedX; player.y = player.bedY - 1;
        } else {
          player.x = msg.spawnX || 0;
          player.y = findSurface(room, msg.spawnX || 0);
        }
        ws.send(JSON.stringify({ type: 'respawned', x: player.x, y: player.y, hp: 20 }));
        break;
      }
      case 'attack_mob': {
        if (!room) return;
        const mob = room.mobs.get(msg.mobId);
        if (mob) {
          mob.hp -= (msg.damage || 5);
          if (mob.hp <= 0) { room.mobs.delete(msg.mobId); broadcast(room, JSON.stringify({ type: 'mob_die', id: msg.mobId })); }
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

  ws.on('error', () => {});
});

server.listen(PORT, () => console.log(`🎮 Minecraft 2D on port ${PORT}`));
