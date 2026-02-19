<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Minecraft 2D</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Minecraft&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
:root{
  --bg:#0f0f0f;--surface:#1a1a1a;--surface2:#242424;--border:#2e2e2e;
  --text:#e8e8e8;--muted:#666;--accent:#4ade80;--accent2:#86efac;
  --danger:#f87171;--warning:#fbbf24;--info:#60a5fa;
}
html,body{width:100%;height:100%;overflow:hidden;background:var(--bg);color:var(--text);
  font-family:'Inter',system-ui,sans-serif;font-size:14px;}
canvas{display:block;image-rendering:pixelated;}

/* ── MENU ── */
#menu{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
  background:var(--bg);z-index:200;}
#menu-bg{position:absolute;inset:0;opacity:0.08;}
.menu-inner{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:32px;width:340px;}
.logo{text-align:center;}
.logo h1{font-size:36px;font-weight:300;letter-spacing:-1px;color:var(--text);}
.logo h1 span{color:var(--accent);font-weight:600;}
.logo p{color:var(--muted);font-size:13px;margin-top:4px;letter-spacing:2px;text-transform:uppercase;}
.card{background:var(--surface);border:1px solid var(--border);padding:24px;width:100%;display:flex;flex-direction:column;gap:12px;}
.field{display:flex;flex-direction:column;gap:6px;}
.field label{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;}
.field input{background:var(--surface2);border:1px solid var(--border);color:var(--text);
  padding:10px 14px;font-size:14px;font-family:inherit;outline:none;transition:border .15s;}
.field input:focus{border-color:var(--accent);}
.btn-primary{background:var(--accent);color:#000;border:none;padding:11px 20px;font-size:13px;font-weight:600;
  font-family:inherit;cursor:pointer;transition:opacity .15s;letter-spacing:.5px;width:100%;}
.btn-primary:hover{opacity:.85;}
.btn-ghost{background:transparent;color:var(--muted);border:1px solid var(--border);padding:11px 20px;
  font-size:13px;font-family:inherit;cursor:pointer;transition:all .15s;letter-spacing:.5px;width:100%;}
.btn-ghost:hover{border-color:var(--text);color:var(--text);}
.sep{display:flex;align-items:center;gap:12px;color:var(--muted);font-size:12px;}
.sep::before,.sep::after{content:'';flex:1;height:1px;background:var(--border);}
#menu-err{color:var(--danger);font-size:13px;text-align:center;min-height:18px;}

/* ── HUD ── */
#hud{position:fixed;inset:0;pointer-events:none;z-index:10;}

/* Coords top-left */
#coords{position:absolute;top:12px;left:12px;background:rgba(0,0,0,0.65);
  backdrop-filter:blur(4px);border:1px solid var(--border);padding:6px 12px;
  font-size:13px;color:var(--text);font-variant-numeric:tabular-nums;line-height:1.6;}

/* Room top-right */
#room-info{position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.65);
  backdrop-filter:blur(4px);border:1px solid var(--border);padding:6px 14px;
  font-size:13px;color:var(--muted);text-align:right;line-height:1.6;}
#room-info strong{color:var(--accent);}

/* Day indicator top-center */
#day-bar{position:absolute;top:12px;left:50%;transform:translateX(-50%);
  background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);border:1px solid var(--border);
  padding:6px 16px;font-size:13px;color:var(--text);}

/* Health */
#health-wrap{position:absolute;bottom:74px;left:50%;transform:translateX(-50%);
  display:flex;align-items:center;gap:6px;}
#health-hearts{display:flex;gap:2px;}
.heart-icon{width:16px;height:16px;font-size:15px;line-height:1;}

/* Hotbar */
#hotbar{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);
  display:flex;gap:2px;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);
  border:1px solid var(--border);padding:4px;}
.hslot{width:54px;height:54px;background:var(--surface2);border:1px solid transparent;
  display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer;
  pointer-events:all;transition:border-color .1s;}
.hslot.active{border-color:var(--accent);}
.hslot canvas{width:38px;height:38px;}
.hslot .sc{position:absolute;bottom:2px;right:3px;font-size:11px;color:var(--text);
  font-weight:600;text-shadow:1px 1px 0 #000;}
.hslot .sk{position:absolute;top:2px;left:4px;font-size:10px;color:var(--muted);}

/* Controls hint bottom-right */
#hint{position:absolute;bottom:74px;right:12px;background:rgba(0,0,0,0.55);
  backdrop-filter:blur(4px);border:1px solid var(--border);padding:8px 12px;
  font-size:11px;color:var(--muted);line-height:2;}

/* ── PANELS ── */
.panel{position:fixed;background:var(--surface);border:1px solid var(--border);z-index:50;
  display:none;flex-direction:column;}
.panel.open{display:flex;}
.panel-header{display:flex;align-items:center;justify-content:space-between;
  padding:14px 18px;border-bottom:1px solid var(--border);}
.panel-header h2{font-size:14px;font-weight:500;letter-spacing:.5px;}
.panel-close{background:none;border:none;color:var(--muted);font-size:18px;cursor:pointer;line-height:1;}
.panel-close:hover{color:var(--text);}
.panel-body{padding:16px 18px;overflow-y:auto;}

/* INVENTORY */
#inventory{top:50%;left:50%;transform:translate(-50%,-50%);min-width:460px;}
.inv-label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;}
.inv-grid{display:grid;grid-template-columns:repeat(9,46px);gap:2px;margin-bottom:16px;}
.islot{width:46px;height:46px;background:var(--surface2);border:1px solid var(--border);
  display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer;transition:border .1s;}
.islot:hover{border-color:#555;}
.islot canvas{width:32px;height:32px;}
.islot .ic{position:absolute;bottom:2px;right:3px;font-size:11px;color:#fff;font-weight:600;text-shadow:1px 1px 0 #000;}

/* CRAFTING */
#crafting{top:50%;left:50%;transform:translate(-50%,-50%);width:700px;max-height:90vh;}
.craft-body{display:grid;grid-template-columns:1fr 280px;gap:0;}
.craft-left{padding:16px 18px;border-right:1px solid var(--border);}
.craft-right{padding:16px 18px;display:flex;flex-direction:column;gap:10px;}
.craft-workspace{display:flex;align-items:center;gap:16px;margin-bottom:16px;}
.craft-grid-3{display:grid;grid-template-columns:repeat(3,52px);gap:2px;}
.cslot{width:52px;height:52px;background:var(--surface2);border:1px solid var(--border);
  display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer;transition:border .1s;}
.cslot:hover{border-color:#666;}
.cslot.has-item{border-color:#444;}
.cslot canvas{width:36px;height:36px;}
.cslot .ic{position:absolute;bottom:2px;right:3px;font-size:11px;color:#fff;font-weight:600;text-shadow:1px 1px 0 #000;}
.craft-arrow{font-size:24px;color:var(--muted);}
.craft-output{width:64px;height:64px;background:var(--surface2);border:2px solid var(--border);
  display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer;transition:border .15s;}
.craft-output:hover{border-color:var(--accent);}
.craft-output canvas{width:44px;height:44px;}
.craft-output .ic{position:absolute;bottom:3px;right:4px;font-size:12px;color:#fff;font-weight:600;text-shadow:1px 1px 0 #000;}
.craft-btn{background:var(--accent);color:#000;border:none;padding:8px;font-size:12px;font-weight:600;
  font-family:inherit;cursor:pointer;width:100%;transition:opacity .15s;margin-top:4px;}
.craft-btn:hover{opacity:.85;}
.craft-btn:disabled{opacity:.3;cursor:default;}
.craft-output-name{font-size:13px;color:var(--text);text-align:center;}
.craft-clear{background:none;border:1px solid var(--border);color:var(--muted);padding:6px;font-size:11px;
  font-family:inherit;cursor:pointer;width:100%;}
.craft-clear:hover{border-color:#555;color:var(--text);}

/* Recipe list */
.recipes-label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;}
.recipes-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:1px;max-height:320px;}
.recipe-entry{display:flex;align-items:center;gap:10px;padding:7px 8px;cursor:pointer;
  border-radius:2px;transition:background .1s;}
.recipe-entry:hover{background:var(--surface2);}
.recipe-entry canvas{width:24px;height:24px;flex-shrink:0;}
.recipe-info{flex:1;min-width:0;}
.recipe-name{font-size:12px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.recipe-status{font-size:11px;margin-top:1px;}
.recipe-ok{color:var(--accent);}
.recipe-missing{color:var(--danger);}

/* ── CHAT ── */
#chat-wrap{position:fixed;bottom:74px;left:12px;z-index:20;width:320px;pointer-events:none;}
#chat-msgs{display:flex;flex-direction:column;gap:2px;max-height:130px;overflow:hidden;justify-content:flex-end;}
.cmsg{font-size:13px;background:rgba(0,0,0,0.6);padding:3px 8px;pointer-events:all;
  animation:fadeMsg 12s forwards;}
@keyframes fadeMsg{0%,80%{opacity:1;}100%{opacity:0;}}
.cmsg .cn{color:var(--accent);}
.cmsg .cs{color:var(--warning);}
#chat-input-wrap{margin-top:4px;display:none;pointer-events:all;}
#chat-input-wrap.open{display:flex;}
#chat-input{flex:1;background:rgba(0,0,0,0.85);border:1px solid var(--border);color:var(--text);
  padding:7px 10px;font-size:13px;font-family:inherit;outline:none;}
#chat-input:focus{border-color:var(--accent);}

/* ── DEATH ── */
#death{position:fixed;inset:0;background:rgba(80,0,0,0.75);backdrop-filter:blur(2px);
  display:none;flex-direction:column;align-items:center;justify-content:center;z-index:100;}
#death.show{display:flex;}
#death .dtitle{font-size:28px;font-weight:300;color:var(--danger);margin-bottom:6px;}
#death .dsub{color:#fca5a5;font-size:13px;margin-bottom:28px;}
#death .dcard{background:var(--surface);border:1px solid var(--border);padding:24px;min-width:300px;
  display:flex;flex-direction:column;gap:12px;}
#death .dcard label{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;}
#death .dcard input{background:var(--surface2);border:1px solid var(--border);color:var(--text);
  padding:8px 12px;font-size:14px;font-family:inherit;outline:none;width:100%;}
#death .bed-opt{font-size:13px;color:var(--accent);display:none;}

/* ── TOOLTIP ── */
#tooltip{position:fixed;background:rgba(0,0,0,0.9);border:1px solid var(--border);
  padding:5px 10px;font-size:12px;color:var(--text);pointer-events:none;z-index:300;
  display:none;white-space:nowrap;}
</style>
</head>
<body>

<!-- MENU -->
<div id="menu">
  <canvas id="menu-bg"></canvas>
  <div class="menu-inner">
    <div class="logo">
      <h1>Minecraft <span>2D</span></h1>
      <p>Multijoueur · Monde infini</p>
    </div>
    <div class="card">
      <div class="field">
        <label>Pseudo</label>
        <input id="pname" placeholder="Ton nom..." maxlength="16">
      </div>
      <button class="btn-primary" onclick="createRoom()">Créer un salon</button>
      <div class="sep">ou rejoindre</div>
      <div class="field">
        <label>Code du salon</label>
        <input id="jcode" placeholder="Ex: AB12CD" maxlength="6" style="text-transform:uppercase">
      </div>
      <button class="btn-ghost" onclick="joinRoom()">Rejoindre</button>
      <div id="menu-err"></div>
    </div>
  </div>
</div>

<!-- GAME -->
<canvas id="game" style="display:none"></canvas>

<!-- HUD -->
<div id="hud" style="display:none">
  <div id="coords">X: 0 &nbsp;Y: 0</div>
  <div id="room-info"></div>
  <div id="day-bar">☀ Jour</div>
  <div id="health-wrap"><div id="health-hearts"></div></div>
  <div id="hotbar"></div>
  <div id="hint">ZQSD / ↑↓←→ · Déplacer &amp; Sauter<br>Clic gauche · Casser<br>Clic droit · Poser / Attaquer<br>E · Inventaire &nbsp; C · Établi<br>T · Chat &nbsp; 1-9 · Hotbar</div>
</div>

<!-- CHAT -->
<div id="chat-wrap" style="display:none">
  <div id="chat-msgs"></div>
  <div id="chat-input-wrap"><input id="chat-input" placeholder="Message… (Entrée pour envoyer)" maxlength="200"></div>
</div>

<!-- INVENTORY -->
<div id="inventory" class="panel">
  <div class="panel-header"><h2>Inventaire</h2><button class="panel-close" onclick="closeInv()">✕</button></div>
  <div class="panel-body">
    <div class="inv-label">Objets (36 emplacements)</div>
    <div class="inv-grid" id="inv-grid"></div>
  </div>
</div>

<!-- CRAFTING -->
<div id="crafting" class="panel">
  <div class="panel-header"><h2>Établi</h2><button class="panel-close" onclick="closeCraft()">✕</button></div>
  <div class="craft-body">
    <div class="craft-left">
      <div class="craft-workspace">
        <div>
          <div class="inv-label" style="margin-bottom:6px">Grille de craft (3×3)</div>
          <div class="craft-grid-3" id="craft-grid"></div>
          <button class="craft-clear" style="margin-top:6px" onclick="clearCraftGrid()">Vider la grille</button>
        </div>
        <div class="craft-arrow">→</div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
          <div class="craft-output" id="craft-out" onclick="doCraft()">
            <canvas id="craft-out-cv" width="44" height="44"></canvas>
            <span class="ic" id="craft-out-cnt"></span>
          </div>
          <div class="craft-output-name" id="craft-out-name">—</div>
          <button class="craft-btn" id="craft-do-btn" disabled onclick="doCraft()">Fabriquer</button>
        </div>
      </div>
      <div class="inv-label">Ton inventaire (clic = placer dans grille)</div>
      <div class="inv-grid" id="craft-inv-grid"></div>
    </div>
    <div class="craft-right">
      <div class="recipes-label">Recettes disponibles</div>
      <div class="recipes-scroll" id="recipes-scroll"></div>
    </div>
  </div>
</div>

<!-- DEATH -->
<div id="death">
  <div class="dtitle">Vous êtes mort</div>
  <div class="dsub">Votre inventaire a été perdu.</div>
  <div class="dcard">
    <label>Point de respawn (X)</label>
    <input id="spawnX" type="number" value="0">
    <div class="bed-opt" id="bed-opt">🛏 Lit assigné disponible</div>
    <button class="btn-primary" onclick="doRespawn()">Réapparaître</button>
  </div>
</div>

<!-- TOOLTIP -->
<div id="tooltip"></div>

<script>
// ══════════════════════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════════════════════
const TILE = 32;
const CHUNK = 16;
const WH = 128;          // world height in blocks
const SEA = 64;          // sea level (block index from TOP of world)
// NOTE: Y=0 is TOP of world, Y=WH-1 is BOTTOM (bedrock)
// On screen: higher Y block = lower on screen

const B = {
  AIR:0,GRASS:1,DIRT:2,STONE:3,SAND:4,GRAVEL:5,
  WOOD:6,LEAVES:7,WATER:8,LAVA:9,COAL_ORE:10,
  IRON_ORE:11,GOLD_ORE:12,DIAMOND_ORE:13,BEDROCK:14,
  PLANKS:15,COBBLE:16,GLASS:17,BRICK:18,
  TORCH:19,CHEST:20,CRAFTING_TABLE:21,FURNACE:22,
  BED:23,DOOR:24,LADDER:25,TNT:26,OBSIDIAN:27,
  SNOW:28,ICE:29,CACTUS:30,CLAY:31,SANDSTONE:32,
  MOSSY:33,BOOKSHELF:34,WOOL:35,
};

const BNAME={
  0:'Air',1:'Herbe',2:'Terre',3:'Pierre',4:'Sable',5:'Gravier',
  6:'Bois',7:'Feuilles',8:'Eau',9:'Lave',10:'Minerai de charbon',
  11:'Minerai de fer',12:'Minerai d\'or',13:'Minerai de diamant',14:'Bedrock',
  15:'Planches',16:'Cobblestone',17:'Verre',18:'Brique',
  19:'Torche',20:'Coffre',21:'Établi',22:'Four',
  23:'Lit',24:'Porte',25:'Échelle',26:'TNT',27:'Obsidienne',
  28:'Neige',29:'Glace',30:'Cactus',31:'Argile',32:'Grès',
  33:'Cobble moussu',34:'Bibliothèque',35:'Laine',
};

// Item IDs above 35: tools/weapons
// 99=bâton, 100+=outils
const INAME={
  99:'Bâton',
  100:'Pioche en bois',101:'Pioche en pierre',102:'Pioche en fer',103:'Pioche en or',104:'Pioche en diamant',
  110:'Hache en bois',111:'Hache en pierre',112:'Hache en fer',
  120:'Épée en bois',121:'Épée en pierre',122:'Épée en fer',123:'Épée en or',124:'Épée en diamant',
  130:'Casque fer',131:'Plastron fer',132:'Jambières fer',133:'Bottes fer',
  140:'Arc',141:'Flèche',
};

const DROPS={
  [B.GRASS]:{i:B.DIRT,n:1},[B.DIRT]:{i:B.DIRT,n:1},[B.STONE]:{i:B.COBBLE,n:1},
  [B.SAND]:{i:B.SAND,n:1},[B.GRAVEL]:{i:B.GRAVEL,n:1},[B.WOOD]:{i:B.WOOD,n:1},
  [B.LEAVES]:{i:B.LEAVES,n:1},[B.COAL_ORE]:{i:B.COAL_ORE,n:1},[B.IRON_ORE]:{i:B.IRON_ORE,n:1},
  [B.GOLD_ORE]:{i:B.GOLD_ORE,n:1},[B.DIAMOND_ORE]:{i:B.DIAMOND_ORE,n:1},
  [B.COBBLE]:{i:B.COBBLE,n:1},[B.PLANKS]:{i:B.PLANKS,n:1},[B.GLASS]:{i:B.GLASS,n:1},
  [B.BRICK]:{i:B.BRICK,n:1},[B.TNT]:{i:B.TNT,n:1},[B.OBSIDIAN]:{i:B.OBSIDIAN,n:1},
  [B.SANDSTONE]:{i:B.SANDSTONE,n:1},[B.CLAY]:{i:B.CLAY,n:1},[B.SNOW]:{i:B.SNOW,n:1},
  [B.ICE]:{i:B.ICE,n:1},[B.CACTUS]:{i:B.CACTUS,n:1},[B.TORCH]:{i:B.TORCH,n:1},
  [B.LADDER]:{i:B.LADDER,n:1},[B.CRAFTING_TABLE]:{i:B.CRAFTING_TABLE,n:1},
  [B.FURNACE]:{i:B.FURNACE,n:1},[B.BED]:{i:B.BED,n:1},[B.CHEST]:{i:B.CHEST,n:1},
  [B.BOOKSHELF]:{i:B.BOOKSHELF,n:1},[B.WOOL]:{i:B.WOOL,n:1},[B.MOSSY]:{i:B.MOSSY,n:1},
  [B.GRAVEL]:{i:B.GRAVEL,n:1},
};

const HARD={
  [B.GRASS]:10,[B.DIRT]:8,[B.STONE]:20,[B.SAND]:8,[B.GRAVEL]:10,
  [B.WOOD]:15,[B.LEAVES]:4,[B.COAL_ORE]:20,[B.IRON_ORE]:25,[B.GOLD_ORE]:25,
  [B.DIAMOND_ORE]:30,[B.COBBLE]:20,[B.PLANKS]:10,[B.GLASS]:6,[B.BRICK]:18,
  [B.SANDSTONE]:10,[B.CLAY]:8,[B.SNOW]:4,[B.ICE]:8,[B.CACTUS]:4,
  [B.OBSIDIAN]:80,[B.CRAFTING_TABLE]:10,[B.FURNACE]:15,[B.BEDROCK]:9999,
};

// Tool speed multipliers
const TSPEED={100:4,101:6,102:8,103:10,104:15,110:5,111:7,112:9};
const TDMG={120:4,121:5,122:6,123:7,124:8,99:1};

// ══════════════════════════════════════════════════════════════
//  RECIPES — grid is 3×3, reading order, '' = empty
// ══════════════════════════════════════════════════════════════
// Format: { name, grid:[9 items, '' or item id as string], result:{i,n} }
const RECIPES=[
  // basics
  {name:'Planches (x4)',   grid:['6','','', '','','', '','',''],  result:{i:B.PLANKS,n:4}},
  {name:'Bâtons (x4)',     grid:['15','','','15','','','','',''], result:{i:99,n:4}},
  {name:'Établi',          grid:['15','15','','15','15','','','',''], result:{i:B.CRAFTING_TABLE,n:1}},
  {name:'Coffre',          grid:['15','15','15','15','','15','15','15','15'], result:{i:B.CHEST,n:1}},
  {name:'Torche (x4)',     grid:['10','','','99','','','','',''], result:{i:B.TORCH,n:4}},
  {name:'Four',            grid:['16','16','16','16','','16','16','16','16'], result:{i:B.FURNACE,n:1}},
  {name:'Échelle (x3)',    grid:['99','','99','99','99','99','99','','99'], result:{i:B.LADDER,n:3}},
  {name:'Lit',             grid:['35','35','35','15','15','15','','',''], result:{i:B.BED,n:1}},
  {name:'Verre (x8)',      grid:['4','4','4','4','4','4','4','4','4'], result:{i:B.GLASS,n:8}},
  {name:'Bibliothèque',    grid:['15','15','15','10','10','10','15','15','15'], result:{i:B.BOOKSHELF,n:1}},
  {name:'TNT',             grid:['4','10','4','10','26','10','4','10','4'], result:{i:B.TNT,n:1}},
  {name:'Grès (x4)',       grid:['4','4','','4','4','','','',''], result:{i:B.SANDSTONE,n:4}},
  {name:'Laine (x1)',      grid:['5','5','','5','5','','','',''], result:{i:B.WOOL,n:1}},
  // pickaxes
  {name:'Pioche en bois',  grid:['15','15','15','','99','','','99',''], result:{i:100,n:1}},
  {name:'Pioche en pierre',grid:['16','16','16','','99','','','99',''], result:{i:101,n:1}},
  {name:'Pioche en fer',   grid:['11','11','11','','99','','','99',''], result:{i:102,n:1}},
  {name:'Pioche en or',    grid:['12','12','12','','99','','','99',''], result:{i:103,n:1}},
  {name:'Pioche en diamant',grid:['13','13','13','','99','','','99',''], result:{i:104,n:1}},
  // axes
  {name:'Hache en bois',   grid:['15','15','','15','99','','','99',''], result:{i:110,n:1}},
  {name:'Hache en pierre',  grid:['16','16','','16','99','','','99',''], result:{i:111,n:1}},
  {name:'Hache en fer',    grid:['11','11','','11','99','','','99',''], result:{i:112,n:1}},
  // swords
  {name:'Épée en bois',    grid:['','15','','','15','','','99',''], result:{i:120,n:1}},
  {name:'Épée en pierre',  grid:['','16','','','16','','','99',''], result:{i:121,n:1}},
  {name:'Épée en fer',     grid:['','11','','','11','','','99',''], result:{i:122,n:1}},
  {name:'Épée en or',      grid:['','12','','','12','','','99',''], result:{i:123,n:1}},
  {name:'Épée en diamant', grid:['','13','','','13','','','99',''], result:{i:124,n:1}},
  // armor
  {name:'Casque en fer',   grid:['11','11','11','11','','11','','',''], result:{i:130,n:1}},
  {name:'Plastron en fer', grid:['11','','11','11','11','11','11','11','11'], result:{i:131,n:1}},
  {name:'Jambières en fer',grid:['11','11','11','11','','11','11','','11'], result:{i:132,n:1}},
  {name:'Bottes en fer',   grid:['','','','11','','11','11','','11'], result:{i:133,n:1}},
  // bow
  {name:'Arc',             grid:['','15','99','15','','99','','15','99'], result:{i:140,n:1}},
  {name:'Flèches (x4)',    grid:['','13','','','99','','','6',''], result:{i:141,n:4}},
];

function getItemName(id){return INAME[id]||BNAME[id]||`Item ${id}`;}

// ══════════════════════════════════════════════════════════════
//  PERLIN NOISE (client side, same seed as server)
// ══════════════════════════════════════════════════════════════
function mulberry32(seed){
  let s=seed>>>0;
  return ()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
}
function mkNoise(seed){
  const rand=mulberry32(seed),p=Array.from({length:256},(_,i)=>i);
  for(let i=255;i>0;i--){const j=Math.floor(rand()*(i+1));[p[i],p[j]]=[p[j],p[i]];}
  const perm=[...p,...p];
  const fade=t=>t*t*t*(t*(t*6-15)+10);
  const lerp=(a,b,t)=>a+t*(b-a);
  const grad=(h,x,y)=>{const u=h<2?x:y,v=h<2?y:x;return((h&1)?-u:u)+((h&2)?-v:v);};
  function noise(x,y){
    const X=Math.floor(x)&255,Y=Math.floor(y)&255;
    x-=Math.floor(x);y-=Math.floor(y);
    const u=fade(x),v=fade(y),a=perm[X]+Y,b=perm[X+1]+Y;
    return lerp(lerp(grad(perm[a],x,y),grad(perm[b],x-1,y),u),lerp(grad(perm[a+1],x,y-1),grad(perm[b+1],x-1,y-1),u),v);
  }
  function oct(x,y,o,p2,sc){let v=0,a=1,f=1,m=0;for(let i=0;i<o;i++){v+=noise(x*f/sc,y*f/sc)*a;m+=a;a*=p2;f*=2;}return v/m;}
  return{noise,oct};
}

// ══════════════════════════════════════════════════════════════
//  WORLD
// ══════════════════════════════════════════════════════════════
// world Y: 0 = sky top, WH-1 = bedrock
// surface ~at SEA block (from top)
// on canvas: wy * TILE = screen position (higher wy = lower on screen = correct)
const worldChunks=new Map();
const reqChunks=new Set();

function setChunkData(cx,blocks){worldChunks.set(cx,{blocks});}

function getB(wx,wy){
  if(wy<0||wy>=WH)return B.AIR;
  const cx=Math.floor(wx/CHUNK);
  const lx=((wx%CHUNK)+CHUNK)%CHUNK;
  const ch=worldChunks.get(cx);
  if(!ch)return B.AIR;
  return ch.blocks[`${lx},${wy}`]||B.AIR;
}

function setB(wx,wy,id){
  const cx=Math.floor(wx/CHUNK);
  const lx=((wx%CHUNK)+CHUNK)%CHUNK;
  let ch=worldChunks.get(cx);
  if(!ch){ch={blocks:{}};worldChunks.set(cx,ch);}
  const k=`${lx},${wy}`;
  if(id===B.AIR)delete ch.blocks[k];
  else ch.blocks[k]=id;
}

// Solid = blocks physics
function isSolid(b){
  return b!==B.AIR&&b!==B.WATER&&b!==B.LAVA&&b!==B.TORCH&&b!==B.LADDER&&b!==B.LEAVES;
}
function isPassable(b){return !isSolid(b);}

function reqChunk(cx){
  if(reqChunks.has(cx)||worldChunks.has(cx))return;
  reqChunks.add(cx);
  send({type:'request_chunk',cx});
}

// ══════════════════════════════════════════════════════════════
//  BLOCK PIXEL ART RENDERER
// ══════════════════════════════════════════════════════════════
const blockCache=new Map();

function getBlockCanvas(id,size=TILE){
  const key=`${id}_${size}`;
  if(blockCache.has(key))return blockCache.get(key);
  const c=document.createElement('canvas');c.width=c.height=size;
  drawBlockToCanvas(c.getContext('2d'),id,size);
  blockCache.set(key,c);
  return c;
}

function drawBlockToCanvas(ctx,id,s){
  // Each block has a unique pixel art style
  ctx.clearRect(0,0,s,s);
  const p=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.floor(x*s),Math.floor(y*s),Math.ceil(w*s),Math.ceil(h*s));};
  const stripe=(y,h,c)=>p(0,y,1,h,c);

  switch(id){
    case B.GRASS:
      p(0,0,1,1,'#5a7a3a');    // main dirt
      p(0,0,1,0.22,'#4db040'); // green top
      // dirt texture
      p(0.1,0.3,0.12,0.1,'#6b4f2a');p(0.5,0.5,0.1,0.12,'#6b4f2a');p(0.7,0.35,0.15,0.1,'#6b4f2a');
      p(0.25,0.6,0.1,0.1,'#7a5f3a');p(0.8,0.65,0.12,0.08,'#7a5f3a');
      // grass details
      p(0.05,0,0.05,0.15,'#5dc050');p(0.2,0,0.04,0.12,'#65d060');p(0.55,0.02,0.06,0.14,'#55b838');
      p(0.75,0,0.05,0.13,'#5dc050');p(0.88,0.01,0.04,0.16,'#60c040');
      break;
    case B.DIRT:
      p(0,0,1,1,'#7a5230');
      p(0.1,0.1,0.15,0.12,'#6b4520');p(0.4,0.25,0.12,0.1,'#6b4520');p(0.7,0.15,0.14,0.11,'#6b4520');
      p(0.2,0.5,0.1,0.14,'#8a6040');p(0.55,0.6,0.15,0.12,'#8a6040');p(0.8,0.45,0.1,0.1,'#8a6040');
      p(0.05,0.75,0.12,0.1,'#6b4520');p(0.35,0.8,0.15,0.12,'#6b4520');p(0.7,0.75,0.12,0.1,'#6b4520');
      break;
    case B.STONE:
      p(0,0,1,1,'#7a7a80');
      p(0.1,0.15,0.35,0.3,'#888890');p(0.5,0.05,0.4,0.25,'#888890');
      p(0.05,0.55,0.4,0.35,'#6a6a70');p(0.5,0.45,0.35,0.45,'#6a6a70');
      p(0,0,0.02,1,'#909098');p(0,0,1,0.02,'#909098');
      p(0.98,0,0.02,1,'#5a5a60');p(0,0.98,1,0.02,'#5a5a60');
      break;
    case B.SAND:
      p(0,0,1,1,'#d4b86a');
      // grain texture
      for(let i=0;i<12;i++){const gx=(i*37%89)/100,gy=(i*53%79)/100;p(gx,gy,0.06,0.05,'#c4a858');}
      for(let i=0;i<8;i++){const gx=(i*61%97)/100,gy=(i*41%83)/100;p(gx,gy,0.04,0.04,'#e4c87a');}
      break;
    case B.GRAVEL:
      p(0,0,1,1,'#7a7878');
      [{x:.1,y:.1,w:.3,h:.25},{x:.45,y:.05,w:.25,h:.2},{x:.72,y:.12,w:.22,h:.3},
       {x:.05,y:.45,w:.35,h:.3},{x:.42,y:.5,w:.3,h:.35},{x:.72,y:.5,w:.25,h:.28}].forEach(r=>{
         p(r.x,r.y,r.w,r.h,'#8a8888');p(r.x,r.y,r.w*.5,r.h*.15,'#9a9898');
       });
      break;
    case B.WOOD:
      p(0,0,1,1,'#7a5820');
      // bark rings
      p(0,0.05,1,0.03,'#6a4810');p(0,0.25,1,0.03,'#6a4810');p(0,0.48,1,0.03,'#6a4810');
      p(0,0.7,1,0.03,'#6a4810');p(0,0.9,1,0.03,'#6a4810');
      // grain
      p(0.15,0,0.04,1,'#8a6830');p(0.45,0,0.03,1,'#8a6830');p(0.7,0,0.04,1,'#8a6830');
      // top/bottom circles
      p(0.2,0,0.6,0.08,'#5a4010');p(0.3,0,0.4,0.04,'#9a7840');
      break;
    case B.LEAVES:
      p(0,0,1,1,'#2a7020');
      // leaf clusters
      [{x:.05,y:.05,w:.4,h:.35},{x:.5,y:.1,w:.45,h:.3},{x:.1,y:.45,w:.35,h:.4},
       {x:.5,y:.5,w:.4,h:.4},{x:.25,y:.2,w:.5,h:.5}].forEach((r,i)=>{
         p(r.x,r.y,r.w,r.h,i%2?'#38902e':'#1e6018');
       });
      // highlights
      p(0.1,0.08,0.15,0.12,'#4aaa38');p(0.55,0.12,0.18,0.1,'#4aaa38');p(0.3,0.55,0.15,0.12,'#4aaa38');
      break;
    case B.WATER:
      p(0,0,1,1,'#1a5da8');
      // waves
      p(0,0.1,1,0.08,'#2a72c0');p(0,0.35,1,0.06,'#2a72c0');p(0,0.6,1,0.08,'#2a72c0');p(0,0.82,1,0.06,'#2a72c0');
      p(0.1,0.06,0.3,0.05,'#3a88d8');p(0.5,0.28,0.35,0.04,'#3a88d8');
      p(0,0,1,0.04,'rgba(255,255,255,0.25)');
      break;
    case B.LAVA:
      p(0,0,1,1,'#cc3300');
      p(0.1,0.15,0.3,0.2,'#ff5500');p(0.45,0.05,0.4,0.25,'#ff6600');p(0.05,0.5,0.5,0.3,'#ff4400');
      p(0.55,0.55,0.35,0.35,'#ff5500');p(0.2,0.35,0.25,0.25,'#ffaa00');p(0.6,0.3,0.2,0.2,'#ffbb00');
      break;
    case B.COAL_ORE: oreBlock(ctx,s,'#7a7a80','#111111');break;
    case B.IRON_ORE: oreBlock(ctx,s,'#7a7a80','#c07a50');break;
    case B.GOLD_ORE: oreBlock(ctx,s,'#7a7a80','#f5c518');break;
    case B.DIAMOND_ORE: oreBlock(ctx,s,'#7a7a80','#00e5ff');break;
    case B.BEDROCK:
      p(0,0,1,1,'#1a1a1a');
      [{x:.05,y:.08,w:.4,h:.3},{x:.5,y:.05,w:.42,h:.25},{x:.08,y:.5,w:.38,h:.38},{x:.52,y:.45,w:.4,h:.4}].forEach(r=>{
        p(r.x,r.y,r.w,r.h,'#2a2a2a');p(r.x,r.y,r.w,0.06,'#333');
      });
      break;
    case B.PLANKS:
      p(0,0,1,1,'#c09040');
      p(0,0,1,0.02,'#b07830');p(0,0.5,1,0.02,'#b07830');
      p(0.1,0,0.03,0.5,'#d0a850');p(0.4,0,0.03,0.5,'#d0a850');p(0.7,0,0.03,0.5,'#d0a850');
      p(0.15,0.5,0.03,0.5,'#d0a850');p(0.5,0.5,0.03,0.5,'#d0a850');p(0.8,0.5,0.03,0.5,'#d0a850');
      break;
    case B.COBBLE:
      p(0,0,1,1,'#686868');
      [{x:.04,y:.04,w:.44,h:.44},{x:.52,y:.04,w:.44,h:.44},{x:.04,y:.52,w:.44,h:.44},{x:.52,y:.52,w:.44,h:.44}].forEach(r=>{
        p(r.x,r.y,r.w,r.h,'#787878');p(r.x,r.y,r.w,0.06,'#888888');p(r.x,r.y+r.h-0.06,r.w,0.06,'#585858');
      });
      break;
    case B.GLASS:
      p(0,0,1,1,'rgba(150,210,255,0.35)');
      p(0,0,1,0.06,'rgba(200,240,255,0.6)');p(0,0,0.06,1,'rgba(200,240,255,0.6)');
      p(0.06,0.06,0.88,0.88,'rgba(120,190,255,0.15)');
      p(0.94,0.06,0.06,0.88,'rgba(80,140,200,0.4)');p(0.06,0.94,0.94,0.06,'rgba(80,140,200,0.4)');
      break;
    case B.BRICK:
      p(0,0,1,1,'#963020');
      // mortar
      p(0,0.24,1,0.04,'#c0a070');p(0,0.5,1,0.04,'#c0a070');p(0,0.74,1,0.04,'#c0a070');
      p(0,0,0.04,0.25,'#c0a070');p(0.5,0,0.04,0.25,'#c0a070');
      p(0.25,0.5,0.04,0.25,'#c0a070');p(0.75,0.5,0.04,0.25,'#c0a070');
      p(0,0.28,1,0.22,'#b03828');p(0,0.78,1,0.22,'#b03828');
      p(0.04,0.02,0.44,0.22,'#a02818');p(0.54,0.02,0.44,0.22,'#a02818');
      p(0.29,0.52,0.44,0.22,'#a02818');p(0.79,0.52,0.19,0.22,'#a02818');p(0.04,0.52,0.23,0.22,'#a02818');
      break;
    case B.TORCH:
      p(0.4,0.7,0.2,0.3,'#9a6820');p(0.38,0.5,0.24,0.22,'#8a5810');
      p(0.42,0.35,0.16,0.18,'#ffcc00');p(0.44,0.15,0.12,0.22,'#ff8800');p(0.46,0.05,0.08,0.12,'#ff4400');
      p(0.44,0.28,0.12,0.1,'#ffee88');
      break;
    case B.CHEST:
      p(0,0,1,1,'#9a6830');
      p(0,0,1,0.5,'#b07840');p(0,0,1,0.04,'#d09050');
      p(0.1,0.1,0.8,0.35,'#c09050');
      p(0.35,0.42,0.3,0.12,'#d4a030');p(0.4,0.38,0.2,0.2,'#f5c518');p(0.44,0.42,0.12,0.12,'#111');
      p(0.1,0.55,0.8,0.35,'#a07030');
      p(0,0.48,1,0.06,'#666');
      break;
    case B.CRAFTING_TABLE:
      p(0,0,1,1,'#9a6830');
      p(0,0,1,0.5,'#7a4a20');
      p(0.05,0.05,0.9,0.4,'#c8a060');
      // tools drawn on top
      p(0.1,0.1,0.35,0.06,'#aaa');p(0.1,0.1,0.06,0.3,'#aaa');
      p(0.55,0.08,0.35,0.06,'#c0875a');p(0.82,0.08,0.06,0.3,'#c0875a');
      p(0.1,0.22,0.3,0.06,'#888');
      break;
    case B.FURNACE:
      p(0,0,1,1,'#666');
      p(0.08,0.08,0.84,0.84,'#555');
      p(0.2,0.12,0.6,0.35,'#3a3a3a');
      p(0.3,0.55,0.4,0.3,'#cc4400');p(0.35,0.6,0.3,0.2,'#ff7700');p(0.4,0.65,0.2,0.1,'#ffcc00');
      p(0,0,0.04,1,'#888');p(0,0,1,0.04,'#888');
      break;
    case B.BED:
      p(0,0,1,1,'#cc3333');p(0,0,1,0.18,'#eeeeee');
      p(0.05,0.22,0.9,0.6,'#dd4444');p(0.05,0.22,0.2,0.6,'#eeeeee');
      p(0.08,0.24,0.16,0.56,'#dddddd');
      break;
    case B.OBSIDIAN:
      p(0,0,1,1,'#1a0a28');
      p(0.1,0.1,0.4,0.35,'#2a1a38');p(0.52,0.08,0.38,0.3,'#2a1a38');
      p(0.08,0.52,0.35,0.4,'#221030');p(0.5,0.5,0.42,0.42,'#221030');
      p(0.2,0.15,0.12,0.12,'#4a2a58');p(0.6,0.6,0.12,0.12,'#4a2a58');
      break;
    case B.SNOW:
      p(0,0,1,1,'#e8f0ff');
      p(0,0,1,0.15,'#ffffff');
      p(0.1,0.3,0.3,0.08,'#d0ddf0');p(0.5,0.5,0.35,0.08,'#d0ddf0');p(0.15,0.65,0.4,0.06,'#d0ddf0');
      break;
    case B.ICE:
      p(0,0,1,1,'rgba(100,160,255,0.8)');
      p(0.05,0.05,0.4,0.3,'rgba(180,220,255,0.5)');p(0.55,0.55,0.35,0.35,'rgba(180,220,255,0.5)');
      p(0,0,0.06,1,'rgba(220,240,255,0.7)');p(0,0,1,0.06,'rgba(220,240,255,0.7)');
      break;
    case B.CACTUS:
      p(0.2,0,0.6,1,'#2a8a20');
      p(0.25,0,0.5,1,'#3aaa30');
      p(0.2,0,0.03,1,'#1a6010');p(0.77,0,0.03,1,'#1a6010');
      p(0,0.3,0.2,0.06,'#2a8a20');p(0.8,0.6,0.2,0.06,'#2a8a20');
      p(0.18,0.28,0.04,0.1,'#2a8a20');p(0.78,0.58,0.04,0.1,'#2a8a20');
      break;
    case B.SANDSTONE:
      p(0,0,1,1,'#c8a850');
      p(0,0,1,0.06,'#d8b860');p(0,0.5,1,0.06,'#b89840');
      p(0,0.25,1,0.03,'#b89840');p(0,0.75,1,0.03,'#b89840');
      p(0.1,0.08,0.8,0.14,'#d8c070');p(0.1,0.58,0.8,0.14,'#d8c070');
      break;
    case B.CLAY:
      p(0,0,1,1,'#9090b0');
      p(0.1,0.1,0.8,0.8,'#a0a0c0');p(0,0,0.06,1,'#b0b0d0');p(0,0,1,0.06,'#b0b0d0');
      break;
    case B.MOSSY:
      p(0,0,1,1,'#607060');
      [{x:.04,y:.04,w:.44,h:.44},{x:.52,y:.04,w:.44,h:.44},{x:.04,y:.52,w:.44,h:.44},{x:.52,y:.52,w:.44,h:.44}].forEach(r=>{
        p(r.x,r.y,r.w,r.h,'#708070');p(r.x,r.y,r.w,0.06,'#809080');
      });
      p(0.1,0.05,0.12,0.08,'#4a7a3a');p(0.55,0.55,0.15,0.1,'#4a7a3a');p(0.3,0.3,0.1,0.12,'#3a6a2a');
      break;
    case B.BOOKSHELF:
      p(0,0,1,1,'#c09040');
      p(0,0,1,0.02,'#a07020');p(0,0.5,1,0.02,'#a07020');p(0,0.98,1,0.02,'#a07020');
      // books
      [{x:.04,c:'#3a3ab0'},{x:.14,c:'#b03a3a'},{x:.24,c:'#3ab03a'},{x:.34,c:'#b0b03a'},{x:.44,c:'#3ab0b0'},{x:.54,c:'#b03ab0'},{x:.64,c:'#884400'},{x:.74,c:'#3a3ab0'},{x:.84,c:'#b03a3a'}].forEach(b=>{
        p(b.x,0.04,0.08,0.44,b.c);p(b.x,0.52,0.08,0.44,b.c);
      });
      break;
    case B.WOOL:
      p(0,0,1,1,'#cc5555');
      // wool texture
      for(let r=0;r<5;r++)for(let c=0;c<5;c++){p(c*0.2+0.01,r*0.2+0.01,0.18,0.18,r%2===c%2?'#dd6666':'#bb4444');}
      break;
    case B.TNT:
      p(0,0,1,1,'#cc2222');
      p(0,0,1,0.2,'#eeeeee');p(0,0.8,1,0.2,'#eeeeee');
      p(0.15,0.22,0.7,0.56,'#cc2222');
      // TNT text area
      p(0.1,0.3,0.8,0.4,'#eeeeee');
      p(0.15,0.35,0.15,0.3,'#cc2222');p(0.31,0.35,0.38,0.3,'#cc2222');p(0.7,0.35,0.15,0.3,'#cc2222');
      break;
    case B.LADDER:
      p(0,0.04,0.08,0.92,'#9a6820');p(0.92,0.04,0.08,0.92,'#9a6820');
      [0.15,0.38,0.62,0.85].forEach(y=>p(0.08,y,0.84,0.1,'#b07830'));
      break;
    default:
      p(0,0,1,1,'#888');
      p(0,0,0.06,1,'#aaa');p(0,0,1,0.06,'#aaa');
  }
  // Universal shading overlay
  ctx.fillStyle='rgba(0,0,0,0.08)';ctx.fillRect(s-2,0,2,s);ctx.fillRect(0,s-2,s,2);
  ctx.fillStyle='rgba(255,255,255,0.12)';ctx.fillRect(0,0,2,s);ctx.fillRect(0,0,s,2);
}

function oreBlock(ctx,s,base,ore){
  drawBlockToCanvas(ctx,B.STONE,s);
  const p=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.floor(x*s),Math.floor(y*s),Math.ceil(w*s),Math.ceil(h*s));};
  // ore veins
  [{x:.15,y:.15,w:.2,h:.15},{x:.55,y:.1,w:.25,h:.18},{x:.1,y:.55,w:.18,h:.2},{x:.55,y:.55,w:.22,h:.22},{x:.35,y:.35,w:.15,h:.15}].forEach(r=>{
    p(r.x,r.y,r.w,r.h,ore);
    p(r.x,r.y,r.w*.5,r.h*.3,ore+'cc');
  });
}

function drawBlock(ctx,id,x,y,size,light=1){
  const bc=getBlockCanvas(id,size);
  if(light>=1){ctx.drawImage(bc,x,y);return;}
  ctx.drawImage(bc,x,y);
  ctx.fillStyle=`rgba(0,0,${Math.floor(30*(1-light))},${(1-light)*0.75})`;
  ctx.fillRect(x,y,size,size);
}

// ══════════════════════════════════════════════════════════════
//  ITEM ICON (for inventory)
// ══════════════════════════════════════════════════════════════
const itemCache=new Map();
function getItemCanvas(id,size=32){
  const key=`item_${id}_${size}`;
  if(itemCache.has(key))return itemCache.get(key);
  const c=document.createElement('canvas');c.width=c.height=size;
  const ctx=c.getContext('2d');
  if(id<=35&&id>0){drawBlockToCanvas(ctx,id,size);}
  else{drawToolIcon(ctx,id,size);}
  itemCache.set(key,c);
  return c;
}

function drawToolIcon(ctx,id,s){
  ctx.clearRect(0,0,s,s);
  const p=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.floor(x),Math.floor(y),Math.ceil(w),Math.ceil(h));};
  if(id===99){// sticks
    p(s*.35,s*.05,s*.12,s*.9,'#9a6820');p(s*.3,s*.05,s*.05,s*.9,'#7a5010');
    return;
  }
  const matColors={100:'#c09040',101:'#888',102:'#c0875a',103:'#f5c518',104:'#00e5ff',
                   110:'#c09040',111:'#888',112:'#c0875a',
                   120:'#c09040',121:'#888',122:'#c0875a',123:'#f5c518',124:'#00e5ff',
                   130:'#c0875a',131:'#c0875a',132:'#c0875a',133:'#c0875a',
                   140:'#c09040',141:'#888'};
  const col=matColors[id]||'#aaa';
  if(id>=100&&id<110){// pickaxe
    p(s*.1,s*.1,s*.75,s*.18,col);p(s*.1,s*.08,s*.75,s*.05,'#fff8');
    p(s*.42,s*.25,s*.14,s*.65,'#7a5010');
    p(s*.1,s*.1,s*.18,s*.18,col);p(s*.68,s*.12,s*.15,s*.15,col);
  }else if(id>=110&&id<120){// axe
    p(s*.08,s*.08,s*.5,s*.5,col);p(s*.08,s*.08,s*.5,s*.07,'#fff6');
    p(s*.45,s*.35,s*.14,s*.58,'#7a5010');
    p(s*.08,s*.08,s*.07,s*.5,col);
  }else if(id>=120&&id<130){// sword
    p(s*.42,s*.05,s*.16,s*.65,col);p(s*.42,s*.05,s*.16,s*.05,'#fff8');
    p(s*.2,s*.38,s*.6,s*.12,'#aaa');
    p(s*.44,s*.68,s*.12,s*.28,'#7a5010');
  }else if(id>=130&&id<140){// armor
    p(s*.1,s*.05,s*.8,s*.5,col);p(s*.05,s*.5,s*.4,s*.45,col);p(s*.55,s*.5,s*.4,s*.45,col);
    p(s*.1,s*.05,s*.8,s*.06,'#fff6');
  }else if(id===140){// bow
    ctx.strokeStyle=col;ctx.lineWidth=s*.08;
    ctx.beginPath();ctx.arc(s*.5,s*.5,s*.38,Math.PI*.6,Math.PI*1.4);ctx.stroke();
    ctx.strokeStyle='#ddd';ctx.lineWidth=s*.04;
    ctx.beginPath();ctx.moveTo(s*.18,s*.2);ctx.lineTo(s*.18,s*.8);ctx.stroke();
  }else if(id===141){// arrow
    p(s*.45,s*.05,s*.1,s*.75,'#9a6820');p(s*.3,s*.05,s*.4,s*.2,'#888');
    p(s*.45,s*.75,s*.1,s*.2,'#cc3333');
  }
}

// ══════════════════════════════════════════════════════════════
//  CHARACTERS — multiple skins
// ══════════════════════════════════════════════════════════════
const SKINS=[
  {body:'#3a6abf',pants:'#1a3a8f',hair:'#3a2010',name:'#60c0ff'},
  {body:'#c04040',pants:'#802020',hair:'#101010',name:'#ff8080'},
  {body:'#40a040',pants:'#205020',hair:'#604020',name:'#80ff80'},
  {body:'#a040a0',pants:'#601060',hair:'#202020',name:'#e080e0'},
  {body:'#c08020',pants:'#805010',hair:'#202020',name:'#ffc040'},
  {body:'#40a0a0',pants:'#205050',hair:'#806040',name:'#80e0e0'},
];

function getSkin(playerId){
  // deterministic skin from id hash
  let h=0;for(const c of (playerId||''))h=(h*31+c.charCodeAt(0))&0xffff;
  return SKINS[h%SKINS.length];
}

function drawCharacter(ctx,sx,sy,tile,dir,skin,name,hp=20,maxHp=20){
  const w=Math.floor(tile*0.75);
  const h=Math.floor(tile*1.85);
  const ox=Math.floor((tile-w)/2);
  const headH=Math.floor(tile*0.42);
  const bodyH=Math.floor(h*0.55);
  const legH=h-bodyH;

  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.2)';
  ctx.beginPath();ctx.ellipse(sx+tile/2,sy+h,w*.6,4,0,0,Math.PI*2);ctx.fill();

  // Legs
  ctx.fillStyle=skin.pants;
  ctx.fillRect(sx+ox,sy+bodyH,Math.floor(w*.45),legH);
  ctx.fillRect(sx+ox+Math.floor(w*.55),sy+bodyH,Math.floor(w*.45),legH);
  // leg shading
  ctx.fillStyle='rgba(0,0,0,0.2)';
  ctx.fillRect(sx+ox+Math.floor(w*.45),sy+bodyH,Math.floor(w*.1),legH);

  // Body
  ctx.fillStyle=skin.body;
  ctx.fillRect(sx+ox,sy,w,bodyH);
  ctx.fillStyle='rgba(255,255,255,0.12)';ctx.fillRect(sx+ox,sy,w,4);
  ctx.fillStyle='rgba(0,0,0,0.15)';ctx.fillRect(sx+ox+w-3,sy,3,bodyH);

  // Head
  const hx=sx+ox+Math.floor((w-headH*.9)/2);
  const hy=sy-headH-2;
  ctx.fillStyle='#f0c080';
  ctx.fillRect(hx,hy,Math.floor(headH*.9),headH);
  // hair
  ctx.fillStyle=skin.hair;
  ctx.fillRect(hx,hy,Math.floor(headH*.9),Math.floor(headH*.35));
  // eyes
  ctx.fillStyle='#1a1a1a';
  if(dir>0){ctx.fillRect(hx+Math.floor(headH*.55),hy+Math.floor(headH*.4),4,4);}
  else{ctx.fillRect(hx+Math.floor(headH*.15),hy+Math.floor(headH*.4),4,4);}
  // mouth
  ctx.fillStyle='#c07050';
  ctx.fillRect(hx+Math.floor(headH*.3),hy+Math.floor(headH*.7),Math.floor(headH*.35),2);

  // Nametag
  if(name){
    ctx.font='12px Inter,sans-serif';
    const nw=ctx.measureText(name).width;
    const nx=sx+tile/2-nw/2-4;
    const ny=hy-18;
    ctx.fillStyle='rgba(0,0,0,0.65)';ctx.fillRect(nx,ny,nw+8,16);
    ctx.fillStyle=skin.name;ctx.fillText(name,nx+4,ny+12);
  }
}

function drawMob(ctx,sx,sy,tile,mob){
  const isSpider=mob.type==='spider';
  const w=Math.floor(tile*(isSpider?1.1:0.8));
  const h=Math.floor(tile*(isSpider?0.65:1.8));
  const ox=Math.floor((tile-w)/2);

  if(isSpider){
    // body
    ctx.fillStyle='#282828';ctx.fillRect(sx+ox+Math.floor(w*.25),sy+Math.floor(h*.15),Math.floor(w*.5),Math.floor(h*.7));
    // head
    ctx.fillStyle='#333';ctx.fillRect(sx+ox+(mob.dir>0?Math.floor(w*.65):0),sy+Math.floor(h*.2),Math.floor(w*.3),Math.floor(h*.55));
    // eyes (red)
    ctx.fillStyle='#ff2020';
    const ex=mob.dir>0?sx+ox+Math.floor(w*.72):sx+ox+Math.floor(w*.05);
    ctx.fillRect(ex,sy+Math.floor(h*.28),5,4);ctx.fillRect(ex+7,sy+Math.floor(h*.28),5,4);
    // legs
    ctx.strokeStyle='#222';ctx.lineWidth=2;
    for(let i=0;i<4;i++){
      const ly=sy+Math.floor(h*(.3+i*.12));
      ctx.beginPath();ctx.moveTo(sx+ox+Math.floor(w*.25),ly);ctx.lineTo(sx+ox,ly-8+i*4);ctx.stroke();
      ctx.beginPath();ctx.moveTo(sx+ox+Math.floor(w*.75),ly);ctx.lineTo(sx+ox+w,ly-8+i*4);ctx.stroke();
    }
  }else{
    ctx.fillStyle='#2a6a2a';ctx.fillRect(sx+ox,sy,w,Math.floor(h*.6));
    ctx.fillStyle='#1a4a1a';ctx.fillRect(sx+ox,sy+Math.floor(h*.6),w,Math.floor(h*.4));
    ctx.fillStyle='#3a8a3a';ctx.fillRect(sx+ox+Math.floor(w*.25),sy-Math.floor(tile*.38),Math.floor(w*.5),Math.floor(tile*.38));
    ctx.fillStyle='#ff2020';
    const ex=mob.dir>0?sx+ox+Math.floor(w*.62):sx+ox+Math.floor(w*.12);
    ctx.fillRect(ex,sy+Math.floor(tile*.06),5,5);
  }
  // HP bar
  const bw=tile*.9,bh=4;
  const bx=sx+(tile-bw)/2,by=sy-12;
  ctx.fillStyle='#400';ctx.fillRect(bx,by,bw,bh);
  ctx.fillStyle='#0f0';ctx.fillRect(bx,by,bw*(mob.hp/20),bh);
}

// ══════════════════════════════════════════════════════════════
//  GAME STATE
// ══════════════════════════════════════════════════════════════
let ws=null,myId=null,roomCode='',pName='',inGame=false;

const PL={
  x:0,y:0,vx:0,vy:0,
  hp:20,maxHp:20,
  onGround:false,
  w:0.8,h:1.85,
  dir:1,
  spawnX:0,spawnY:0,
  hasBed:false,bedX:0,bedY:0,
};

const inv=new Array(36).fill(null); // {i:itemId, n:count}
let activeSlot=0;
let breaking=null; // {wx,wy,prog,total}

const others=new Map();
const mobs=new Map();
const cam={x:0,y:0};

let dayTime=6000;
let mouseX=0,mouseY=0;
let mDown=false;
const keys={};
let lastMove=0;

// selected craft slot in inventory (for placing into craft grid)
let selectedInvItem=null;

// ══════════════════════════════════════════════════════════════
//  NETWORKING
// ══════════════════════════════════════════════════════════════
function wsUrl(){
  const proto=location.protocol==='https:'?'wss':'ws';
  const host=location.hostname==='localhost'?'localhost:3000':location.host;
  return `${proto}://${host}`;
}

function connect(cb){
  ws=new WebSocket(wsUrl());
  ws.onopen=cb;
  ws.onmessage=e=>onMsg(JSON.parse(e.data));
  ws.onerror=()=>menuErr('Connexion impossible.');
  ws.onclose=()=>{if(inGame)menuErr('Déconnecté.');};
}

function send(o){if(ws&&ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(o));}

function createRoom(){
  pName=(document.getElementById('pname').value.trim()||'Player').substring(0,16);
  connect(()=>send({type:'create_room',name:pName}));
}
function joinRoom(){
  const code=(document.getElementById('jcode').value.trim()||'').toUpperCase();
  if(code.length<4){menuErr('Code invalide.');return;}
  pName=(document.getElementById('pname').value.trim()||'Player').substring(0,16);
  connect(()=>send({type:'join_room',code,name:pName}));
}

function onMsg(msg){
  switch(msg.type){
    case'joined':
      roomCode=msg.roomCode;myId=msg.playerId;
      PL.x=msg.x;PL.y=msg.y;PL.spawnX=msg.x;PL.spawnY=msg.y;
      startGame();break;
    case'chunk':
      setChunkData(msg.cx,msg.blocks);break;
    case'block_change':
      setB(msg.x,msg.y,msg.block);break;
    case'tick':
      dayTime=msg.dayTime;
      const ids=new Set(msg.players.map(p=>p.id));
      for(const [id] of others)if(!ids.has(id))others.delete(id);
      for(const pd of msg.players)if(pd.id!==myId)others.set(pd.id,pd);
      mobs.clear();for(const m of msg.mobs)mobs.set(m.id,m);
      break;
    case'damage':
      PL.hp=msg.hp;updateHealth();if(PL.hp<=0)showDeath();break;
    case'respawned':
      PL.x=msg.x;PL.y=msg.y;PL.hp=msg.hp;PL.vx=0;PL.vy=0;
      hideDeath();updateHealth();break;
    case'chat':addChat(msg.name,msg.text);break;
    case'chat_history':for(const m of msg.messages)addChat(m.name,m.text);break;
    case'player_join':addSysChat(`${msg.name} a rejoint !`);break;
    case'player_leave':others.delete(msg.id);break;
    case'mob_die':mobs.delete(msg.id);break;
    case'error':menuErr(msg.msg);break;
  }
}

// ══════════════════════════════════════════════════════════════
//  START GAME
// ══════════════════════════════════════════════════════════════
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');

function resizeCv(){canvas.width=innerWidth;canvas.height=innerHeight;}
window.addEventListener('resize',resizeCv);

function startGame(){
  inGame=true;
  document.getElementById('menu').style.display='none';
  canvas.style.display='block';
  document.getElementById('hud').style.display='block';
  document.getElementById('chat-wrap').style.display='block';
  document.getElementById('room-info').innerHTML=`Code salon: <strong>${roomCode}</strong><br>${pName}`;
  resizeCv();
  buildHotbar();buildInvGrid();buildCraftGrid();buildCraftInvGrid();buildRecipeList();
  updateHealth();
  giveStarter();
  for(let cx=-4;cx<=4;cx++)reqChunk(cx);
  requestAnimationFrame(loop);
}

function giveStarter(){
  addInv(B.CRAFTING_TABLE,1);addInv(B.TORCH,8);addInv(B.PLANKS,16);addInv(B.DIRT,32);
}

// ══════════════════════════════════════════════════════════════
//  GAME LOOP
// ══════════════════════════════════════════════════════════════
let lastTs=0;
function loop(ts){
  if(!inGame){requestAnimationFrame(loop);return;}
  const dt=Math.min((ts-lastTs)/1000,0.05);lastTs=ts;
  update(dt);render();
  requestAnimationFrame(loop);
}

// ══════════════════════════════════════════════════════════════
//  PHYSICS
// ══════════════════════════════════════════════════════════════
const GRAV=0.45, JUMP=-8, SPEED=4.5;

function update(dt){
  if(document.getElementById('death').classList.contains('show'))return;
  if(document.getElementById('chat-input-wrap').classList.contains('open'))return;

  // ─ Horizontal input ─
  let moveX=0;
  if(keys['KeyA']||keys['ArrowLeft']){moveX=-1;PL.dir=-1;}
  if(keys['KeyD']||keys['ArrowRight']){moveX=1;PL.dir=1;}
  PL.vx=moveX*SPEED;

  // ─ Ladder ─
  const midB=getB(Math.floor(PL.x),Math.floor(PL.y+0.9));
  const onLadder=midB===B.LADDER;

  if(onLadder){
    if(keys['KeyW']||keys['ArrowUp'])PL.vy=-3;
    else if(keys['KeyS']||keys['ArrowDown'])PL.vy=3;
    else PL.vy=0;
  }else{
    PL.vy=Math.min(PL.vy+GRAV,14);
  }

  // ─ Jump ─
  // On ground = block directly below player feet is solid
  const feetY=PL.y+PL.h;
  const groundB=getB(Math.floor(PL.x),Math.floor(feetY));
  const groundB2=getB(Math.floor(PL.x+PL.w-0.05),Math.floor(feetY));
  PL.onGround=isSolid(groundB)||isSolid(groundB2);

  if((keys['KeyW']||keys['ArrowUp']||keys['Space'])&&PL.onGround&&!onLadder){
    PL.vy=JUMP;
    PL.onGround=false;
  }

  // ─ Move X ─
  const nx=PL.x+PL.vx*dt;
  // Check left and right edges, top/bottom of body
  const colX=checkCollX(nx,PL.y);
  if(!colX){PL.x=nx;}else{PL.vx=0;}

  // ─ Move Y ─
  const ny=PL.y+PL.vy*dt;
  const colY=checkCollY(PL.x,ny);
  if(!colY){
    PL.y=ny;
  }else{
    if(PL.vy>0){
      // landing: snap to ground
      PL.y=Math.floor(PL.y+PL.h)-PL.h;
      PL.onGround=true;
    }else{
      PL.y=Math.floor(PL.y)+1;
    }
    PL.vy=0;
  }

  // Clamp
  PL.y=Math.max(0,Math.min(WH-PL.h-0.01,PL.y));

  // ─ Block breaking (hold LMB) ─
  if(mDown&&!panelOpen()){
    const wp=s2w(mouseX,mouseY);
    const bx=Math.floor(wp.x),by=Math.floor(wp.y);
    const dist=Math.hypot(bx+.5-PL.x-.4,by+.5-PL.y-.9);
    if(dist<6.5){
      const b=getB(bx,by);
      if(b!==B.AIR&&b!==B.WATER&&b!==B.LAVA){
        const hard=HARD[b]||6;
        const spd=TSPEED[inv[activeSlot]?.i]||1;
        const tot=Math.ceil(hard/spd);
        if(!breaking||breaking.wx!==bx||breaking.wy!==by){breaking={wx:bx,wy:by,prog:0,total:tot};}
        breaking.prog++;
        if(breaking.prog>=breaking.total){
          send({type:'break_block',x:bx,y:by});
          setB(bx,by,B.AIR);
          const drop=DROPS[b];if(drop)addInv(drop.i,drop.n);
          breaking=null;
        }
      }else{breaking=null;}
    }else{breaking=null;}
  }else{breaking=null;}

  // ─ Camera ─
  cam.x=PL.x+PL.w/2;
  cam.y=PL.y+PL.h/2;

  // ─ Request chunks ─
  const vcx=Math.floor(cam.x/CHUNK);
  for(let c=vcx-5;c<=vcx+5;c++)reqChunk(c);

  // ─ Send position ─
  const now=performance.now();
  if(now-lastMove>50){
    send({type:'move',x:PL.x,y:PL.y,dir:PL.dir});
    lastMove=now;
  }

  // ─ HUD update ─
  document.getElementById('coords').innerHTML=`X: ${Math.floor(PL.x)} &nbsp;Y: ${Math.floor(PL.y)}`;
}

function checkCollX(nx,y){
  // check 3 heights on the body
  for(const fy of [y+0.05,y+PL.h*.5,y+PL.h-0.05]){
    if(isSolid(getB(Math.floor(nx),Math.floor(fy))))return true;
    if(isSolid(getB(Math.floor(nx+PL.w-0.05),Math.floor(fy))))return true;
  }
  return false;
}

function checkCollY(x,ny){
  if(ny<0)return true;
  if(ny+PL.h>=WH)return true;
  // bottom
  if(isSolid(getB(Math.floor(x),Math.floor(ny+PL.h)))||
     isSolid(getB(Math.floor(x+PL.w-0.05),Math.floor(ny+PL.h))))return true;
  // top
  if(isSolid(getB(Math.floor(x),Math.floor(ny)))||
     isSolid(getB(Math.floor(x+PL.w-0.05),Math.floor(ny))))return true;
  return false;
}

function panelOpen(){
  return document.getElementById('inventory').classList.contains('open')||
         document.getElementById('crafting').classList.contains('open');
}

// ══════════════════════════════════════════════════════════════
//  COORDINATE TRANSFORMS
//  World Y: 0=top, increases downward → screen Y increases downward = correct
// ══════════════════════════════════════════════════════════════
function w2s(wx,wy){
  return{
    x:(wx-cam.x)*TILE+canvas.width/2,
    y:(wy-cam.y)*TILE+canvas.height/2,
  };
}
function s2w(sx,sy){
  return{
    x:(sx-canvas.width/2)/TILE+cam.x,
    y:(sy-canvas.height/2)/TILE+cam.y,
  };
}

// ══════════════════════════════════════════════════════════════
//  RENDER
// ══════════════════════════════════════════════════════════════
function getLightLevel(){
  // 0=night 1=full day
  if(dayTime<2000)return lerp(.15,1,dayTime/2000);
  if(dayTime<10000)return 1;
  if(dayTime<12000)return lerp(1,.15,(dayTime-10000)/2000);
  if(dayTime<22000)return.15;
  return lerp(.15,1,(dayTime-22000)/2000);
}
function lerp(a,b,t){return a+t*(b-a);}

function render(){
  const W=canvas.width,H=canvas.height;
  const light=getLightLevel();

  // ─ Sky ─
  const dayTop='#87CEEB',nightTop='#0a0a1a';
  const sr=lerp(0x0a,0x87,light),sg=lerp(0x0a,0xCE,light),sb=lerp(0x1a,0xEB,light);
  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,`rgb(${~~sr},${~~sg},${~~sb})`);
  grad.addColorStop(1,`rgb(${~~lerp(0x05,0x5a,light)},${~~lerp(0x0a,0x9f,light)},${~~lerp(0x10,0xc8,light)})`);
  ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);

  // ─ Sun / Moon ─
  const angle=(dayTime/24000)*Math.PI*2-Math.PI/2;
  const orbitR=Math.min(W,H)*.42;
  const cx2=W/2+Math.cos(angle)*orbitR;
  const cy2=H/2+Math.sin(angle)*orbitR;
  if(dayTime<13000||dayTime>22000){
    // Sun
    const sunGrad=ctx.createRadialGradient(cx2,cy2,0,cx2,cy2,22);
    sunGrad.addColorStop(0,'#fff8a0');sunGrad.addColorStop(.5,'#ffe040');sunGrad.addColorStop(1,'rgba(255,180,0,0)');
    ctx.fillStyle=sunGrad;ctx.fillRect(cx2-24,cy2-24,48,48);
    ctx.fillStyle='#ffe040';ctx.beginPath();ctx.arc(cx2,cy2,14,0,Math.PI*2);ctx.fill();
  }else{
    ctx.fillStyle='#c8d8f0';ctx.beginPath();ctx.arc(cx2,cy2,13,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#0a0a1a';ctx.beginPath();ctx.arc(cx2+5,cy2-3,10,0,Math.PI*2);ctx.fill();
    // stars
    if(light<0.5){
      ctx.fillStyle=`rgba(255,255,255,${(0.5-light)*1.5})`;
      for(let i=0;i<40;i++){
        const sx=((i*137+23)%W),sy=((i*97+31)%(H*.6));
        ctx.fillRect(sx,sy,1+(i%3===0?1:0),1+(i%5===0?1:0));
      }
    }
  }

  // ─ Visible tiles ─
  const tilesX=Math.ceil(W/TILE/2)+2;
  const tilesY=Math.ceil(H/TILE/2)+2;
  const startWX=Math.floor(cam.x)-tilesX;
  const endWX=Math.floor(cam.x)+tilesX;
  const startWY=Math.max(0,Math.floor(cam.y)-tilesY);
  const endWY=Math.min(WH-1,Math.floor(cam.y)+tilesY);

  for(let wy=startWY;wy<=endWY;wy++){
    for(let wx=startWX;wx<=endWX;wx++){
      const b=getB(wx,wy);
      if(b===B.AIR)continue;
      const{x,y}=w2s(wx,wy);
      if(x<-TILE||x>W+TILE||y<-TILE||y>H+TILE)continue;
      drawBlock(ctx,b,x,y,TILE,light);
    }
  }

  // ─ Breaking overlay ─
  if(breaking){
    const{x,y}=w2s(breaking.wx,breaking.wy);
    const prog=breaking.prog/breaking.total;
    ctx.fillStyle=`rgba(0,0,0,${prog*.7})`;ctx.fillRect(x,y,TILE,TILE);
    // crack lines
    const cracks=Math.floor(prog*5);
    ctx.strokeStyle='rgba(0,0,0,0.8)';ctx.lineWidth=1.5;
    for(let c=0;c<cracks;c++){
      ctx.beginPath();ctx.moveTo(x+TILE*.3+c*4,y+4);ctx.lineTo(x+TILE*.1+c*6,y+TILE*.9-c*3);ctx.stroke();
    }
    // progress bar
    ctx.fillStyle='rgba(255,255,255,0.3)';ctx.fillRect(x+2,y+TILE-6,TILE-4,4);
    ctx.fillStyle='#4ade80';ctx.fillRect(x+2,y+TILE-6,(TILE-4)*prog,4);
  }

  // ─ Night overlay ─
  if(light<1){
    ctx.fillStyle=`rgba(0,0,20,${(1-light)*.7})`;
    ctx.fillRect(0,0,W,H);
  }

  // ─ Other players ─
  for(const[,pd]of others){
    const{x,y}=w2s(pd.x,pd.y);
    if(x<-80||x>W+80)continue;
    const skin=getSkin(pd.id);
    drawCharacter(ctx,x,y,TILE,pd.dir,skin,pd.name,pd.hp,20);
  }

  // ─ Mobs ─
  for(const[,m]of mobs){
    const{x,y}=w2s(m.x,m.y);
    if(x<-80||x>W+80)continue;
    drawMob(ctx,x,y,TILE,m);
  }

  // ─ Player ─
  const{x:px,y:py}=w2s(PL.x,PL.y);
  const mySkin=getSkin(myId);
  drawCharacter(ctx,px,py,TILE,PL.dir,mySkin,pName,PL.hp,20);

  // ─ Cursor highlight ─
  const wp=s2w(mouseX,mouseY);
  const hx=Math.floor(wp.x),hy=Math.floor(wp.y);
  const{x:hsx,y:hsy}=w2s(hx,hy);
  const dist=Math.hypot(hx+.5-PL.x-.4,hy+.5-PL.y-.9);
  ctx.strokeStyle=dist<6.5?'rgba(255,255,255,0.7)':'rgba(255,100,100,0.4)';
  ctx.lineWidth=1.5;ctx.strokeRect(hsx+1,hsy+1,TILE-2,TILE-2);

  // ─ Day indicator ─
  const isDay=dayTime<13000||dayTime>22000;
  const pct=Math.floor((dayTime%12000)/12000*100);
  document.getElementById('day-bar').textContent=isDay?`☀ Jour — ${pct}%`:`☾ Nuit — ${Math.floor((dayTime-13000)/9000*100)||0}%`;
}

// ══════════════════════════════════════════════════════════════
//  INVENTORY
// ══════════════════════════════════════════════════════════════
function addInv(item,count){
  for(let i=0;i<inv.length;i++){if(inv[i]?.i===item&&inv[i].n<64){inv[i].n+=count;refreshAll();return true;}}
  for(let i=0;i<inv.length;i++){if(!inv[i]){inv[i]={i:item,n:count};refreshAll();return true;}}
  return false;
}
function removeInv(item,count){
  let rem=count;
  for(let i=0;i<inv.length;i++){
    if(inv[i]?.i===item){const take=Math.min(rem,inv[i].n);inv[i].n-=take;rem-=take;if(inv[i].n<=0)inv[i]=null;if(rem<=0)break;}
  }
  refreshAll();return rem===0;
}
function hasInv(item,count=1){let t=0;for(const s of inv)if(s?.i===item)t+=s.n;return t>=count;}
function refreshAll(){refreshHotbar();refreshInvGrid();refreshCraftInvGrid();checkCraftMatch();}

function buildHotbar(){
  const hb=document.getElementById('hotbar');hb.innerHTML='';
  for(let i=0;i<9;i++){
    const s=document.createElement('div');s.className='hslot'+(i===activeSlot?' active':'');
    s.innerHTML=`<span class="sk">${i+1}</span><canvas width="38" height="38"></canvas><span class="sc"></span>`;
    s.onclick=()=>{activeSlot=i;refreshHotbar();};
    hb.appendChild(s);
  }
  refreshHotbar();
}
function refreshHotbar(){
  const slots=document.querySelectorAll('.hslot');
  slots.forEach((s,i)=>{
    s.className='hslot'+(i===activeSlot?' active':'');
    const cv=s.querySelector('canvas');const sc=s.querySelector('.sc');
    if(inv[i]){const ic=getItemCanvas(inv[i].i,38);const c=cv.getContext('2d');c.clearRect(0,0,38,38);c.drawImage(ic,0,0);sc.textContent=inv[i].n>1?inv[i].n:'';}
    else{cv.getContext('2d').clearRect(0,0,38,38);sc.textContent='';}
  });
}

function buildInvGrid(){
  const g=document.getElementById('inv-grid');g.innerHTML='';
  for(let i=0;i<36;i++){
    const s=document.createElement('div');s.className='islot';s.id=`is${i}`;
    s.innerHTML=`<canvas width="32" height="32"></canvas><span class="ic"></span>`;
    s.addEventListener('mouseenter',()=>{if(inv[i])showTip(getItemName(inv[i].i));});
    s.addEventListener('mouseleave',hideTip);
    g.appendChild(s);
  }
  refreshInvGrid();
}
function refreshInvGrid(){
  for(let i=0;i<36;i++){
    const s=document.getElementById(`is${i}`);if(!s)continue;
    const cv=s.querySelector('canvas');const ic=s.querySelector('.ic');
    if(inv[i]){const c=getItemCanvas(inv[i].i,32);cv.getContext('2d').drawImage(c,0,0);ic.textContent=inv[i].n>1?inv[i].n:'';}
    else{cv.getContext('2d').clearRect(0,0,32,32);ic.textContent='';}
  }
}

function closeInv(){document.getElementById('inventory').classList.remove('open');}
function openInv(){document.getElementById('inventory').classList.add('open');refreshInvGrid();}

// ══════════════════════════════════════════════════════════════
//  CRAFTING — free 3×3 grid, click inventory item → click grid cell
// ══════════════════════════════════════════════════════════════
const craftGridItems=new Array(9).fill(null); // item id or null

function buildCraftGrid(){
  const g=document.getElementById('craft-grid');g.innerHTML='';
  for(let i=0;i<9;i++){
    const s=document.createElement('div');s.className='cslot';s.id=`cg${i}`;
    s.innerHTML=`<canvas width="36" height="36"></canvas><span class="ic"></span>`;
    s.addEventListener('click',()=>placeToCraftSlot(i));
    s.addEventListener('contextmenu',e=>{e.preventDefault();craftGridItems[i]=null;refreshCraftGrid();checkCraftMatch();});
    s.addEventListener('mouseenter',()=>{if(craftGridItems[i])showTip(getItemName(craftGridItems[i]));});
    s.addEventListener('mouseleave',hideTip);
    g.appendChild(s);
  }
  refreshCraftGrid();
}

function buildCraftInvGrid(){
  const g=document.getElementById('craft-inv-grid');g.innerHTML='';
  for(let i=0;i<36;i++){
    const s=document.createElement('div');s.className='islot';s.id=`ci${i}`;
    s.style.cursor='pointer';
    s.innerHTML=`<canvas width="32" height="32"></canvas><span class="ic"></span>`;
    s.addEventListener('click',()=>{
      if(!inv[i])return;
      selectedInvItem=inv[i].i;
      // highlight
      document.querySelectorAll('.islot').forEach(x=>x.style.borderColor='');
      s.style.borderColor='var(--accent)';
    });
    s.addEventListener('mouseenter',()=>{if(inv[i])showTip(getItemName(inv[i].i));});
    s.addEventListener('mouseleave',hideTip);
    g.appendChild(s);
  }
  refreshCraftInvGrid();
}
function refreshCraftInvGrid(){
  for(let i=0;i<36;i++){
    const s=document.getElementById(`ci${i}`);if(!s)continue;
    const cv=s.querySelector('canvas');const ic=s.querySelector('.ic');
    if(inv[i]){const c=getItemCanvas(inv[i].i,32);cv.getContext('2d').drawImage(c,0,0);ic.textContent=inv[i].n>1?inv[i].n:'';}
    else{cv.getContext('2d').clearRect(0,0,32,32);ic.textContent='';}
  }
}

function placeToCraftSlot(idx){
  if(selectedInvItem!==null){
    craftGridItems[idx]=selectedInvItem;
    selectedInvItem=null;
    document.querySelectorAll('.islot').forEach(x=>x.style.borderColor='');
  }else{
    // right-click to clear is handled by contextmenu
    // left click with no selection = clear slot
    craftGridItems[idx]=null;
  }
  refreshCraftGrid();checkCraftMatch();
}

function refreshCraftGrid(){
  for(let i=0;i<9;i++){
    const s=document.getElementById(`cg${i}`);if(!s)continue;
    const cv=s.querySelector('canvas');const ic=s.querySelector('.ic');
    if(craftGridItems[i]){
      s.classList.add('has-item');
      const c=getItemCanvas(craftGridItems[i],36);cv.getContext('2d').drawImage(c,0,0);ic.textContent='';
    }else{
      s.classList.remove('has-item');
      cv.getContext('2d').clearRect(0,0,36,36);ic.textContent='';
    }
  }
}

function clearCraftGrid(){for(let i=0;i<9;i++)craftGridItems[i]=null;refreshCraftGrid();checkCraftMatch();}

let currentRecipe=null;

function checkCraftMatch(){
  const gridStr=craftGridItems.map(c=>c?String(c):'');
  for(const r of RECIPES){
    const rg=r.grid.map(c=>c||'');
    if(gridStr.join(',')=== rg.join(',')){
      // Check stock
      const need={};
      for(const c of rg)if(c)need[c]=(need[c]||0)+1;
      let canDo=true;
      for(const [item,cnt] of Object.entries(need))if(!hasInv(parseInt(item),cnt)){canDo=false;break;}
      currentRecipe=r;showCraftResult(r,canDo);return;
    }
  }
  currentRecipe=null;clearCraftResult();
}

function showCraftResult(r,canDo){
  const cv=document.getElementById('craft-out-cv');
  const c=getItemCanvas(r.result.i,44);cv.getContext('2d').drawImage(c,0,0);
  document.getElementById('craft-out-cnt').textContent=r.result.n>1?r.result.n:'';
  document.getElementById('craft-out-name').textContent=r.name;
  const btn=document.getElementById('craft-do-btn');
  btn.disabled=!canDo;btn.textContent=canDo?'Fabriquer ✓':'Ingrédients manquants';
}
function clearCraftResult(){
  document.getElementById('craft-out-cv').getContext('2d').clearRect(0,0,44,44);
  document.getElementById('craft-out-cnt').textContent='';
  document.getElementById('craft-out-name').textContent='—';
  const btn=document.getElementById('craft-do-btn');btn.disabled=true;btn.textContent='Fabriquer';
}

function doCraft(){
  if(!currentRecipe)return;
  const need={};for(const c of currentRecipe.grid)if(c)need[c]=(need[c]||0)+1;
  for(const [item,cnt] of Object.entries(need)){if(!hasInv(parseInt(item),cnt))return;}
  for(const [item,cnt] of Object.entries(need))removeInv(parseInt(item),cnt);
  addInv(currentRecipe.result.i,currentRecipe.result.n);
  checkCraftMatch();
}

function buildRecipeList(){
  const sc=document.getElementById('recipes-scroll');sc.innerHTML='';
  for(const r of RECIPES){
    const div=document.createElement('div');div.className='recipe-entry';div.id=`re_${r.name}`;
    const cv=document.createElement('canvas');cv.width=cv.height=24;
    const c=getItemCanvas(r.result.i,24);cv.getContext('2d').drawImage(c,0,0);
    const info=document.createElement('div');info.className='recipe-info';
    info.innerHTML=`<div class="recipe-name">${r.name}</div><div class="recipe-status" id="rs_${r.name}"></div>`;
    div.appendChild(cv);div.appendChild(info);
    div.addEventListener('click',()=>loadRecipe(r));
    sc.appendChild(div);
  }
  updateRecipeList();
}

function updateRecipeList(){
  for(const r of RECIPES){
    const st=document.getElementById(`rs_${r.name}`);if(!st)continue;
    const need={};for(const c of r.grid)if(c)need[c]=(need[c]||0)+1;
    let canDo=true;const missing=[];
    for(const [item,cnt] of Object.entries(need)){
      if(!hasInv(parseInt(item),cnt)){canDo=false;missing.push(`${getItemName(parseInt(item))} ×${cnt}`);}
    }
    if(canDo){st.innerHTML='<span class="recipe-ok">✓ Réalisable</span>';}
    else{st.innerHTML=`<span class="recipe-missing">✗ Manque: ${missing.join(', ')}</span>`;}
  }
}

function loadRecipe(r){
  for(let i=0;i<9;i++)craftGridItems[i]=r.grid[i]?parseInt(r.grid[i]):null;
  refreshCraftGrid();checkCraftMatch();
  updateRecipeList();
}

function openCraftPanel(){document.getElementById('crafting').classList.add('open');refreshCraftInvGrid();updateRecipeList();checkCraftMatch();}
function closeCraft(){document.getElementById('crafting').classList.remove('open');selectedInvItem=null;}

// ══════════════════════════════════════════════════════════════
//  HEALTH
// ══════════════════════════════════════════════════════════════
function updateHealth(){
  const hh=document.getElementById('health-hearts');hh.innerHTML='';
  for(let i=0;i<10;i++){
    const hp=PL.hp-(i*2);
    const full=hp>=2,half=hp===1;
    const span=document.createElement('span');span.className='heart-icon';
    span.textContent=full?'❤️':half?'💔':'🖤';
    hh.appendChild(span);
  }
}

// ══════════════════════════════════════════════════════════════
//  CHAT
// ══════════════════════════════════════════════════════════════
function addChat(name,text){
  const d=document.createElement('div');d.className='cmsg';
  d.innerHTML=`<span class="cn">${esc(name)}</span>: ${esc(text)}`;
  const m=document.getElementById('chat-msgs');m.appendChild(d);
  while(m.children.length>12)m.removeChild(m.firstChild);
  m.scrollTop=m.scrollHeight;
}
function addSysChat(text){
  const d=document.createElement('div');d.className='cmsg';
  d.innerHTML=`<span class="cs">★ ${esc(text)}</span>`;
  const m=document.getElementById('chat-msgs');m.appendChild(d);
  while(m.children.length>12)m.removeChild(m.firstChild);
}
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

// ══════════════════════════════════════════════════════════════
//  DEATH
// ══════════════════════════════════════════════════════════════
function showDeath(){
  for(let i=0;i<inv.length;i++)inv[i]=null;
  refreshAll();
  document.getElementById('bed-opt').style.display=PL.hasBed?'block':'none';
  document.getElementById('spawnX').value=Math.floor(PL.spawnX);
  document.getElementById('death').classList.add('show');
}
function hideDeath(){document.getElementById('death').classList.remove('show');}
function doRespawn(){
  const sx=parseInt(document.getElementById('spawnX').value)||0;
  send({type:'respawn',spawnX:sx});
}

// ══════════════════════════════════════════════════════════════
//  TOOLTIP
// ══════════════════════════════════════════════════════════════
function showTip(t){const tt=document.getElementById('tooltip');tt.textContent=t;tt.style.display='block';}
function hideTip(){document.getElementById('tooltip').style.display='none';}
document.addEventListener('mousemove',e=>{
  mouseX=e.clientX;mouseY=e.clientY;
  const tt=document.getElementById('tooltip');
  tt.style.left=(e.clientX+14)+'px';tt.style.top=(e.clientY+8)+'px';
  // world tooltip
  if(inGame&&!panelOpen()){
    const wp=s2w(e.clientX,e.clientY);
    const b=getB(Math.floor(wp.x),Math.floor(wp.y));
    if(b!==B.AIR)showTip(BNAME[b]||`Bloc ${b}`);else hideTip();
  }
});

// ══════════════════════════════════════════════════════════════
//  INPUT
// ══════════════════════════════════════════════════════════════
document.addEventListener('keydown',e=>{
  keys[e.code]=true;
  if(!inGame)return;
  const chatOpen=document.getElementById('chat-input-wrap').classList.contains('open');
  if(e.code==='KeyT'&&!chatOpen){e.preventDefault();openChat();return;}
  if(e.code==='Escape'){
    closeInv();closeCraft();closeChat();
    document.querySelectorAll('.islot').forEach(x=>x.style.borderColor='');
    selectedInvItem=null;
    return;
  }
  if(chatOpen){
    if(e.code==='Enter'){
      const inp=document.getElementById('chat-input');
      const t=inp.value.trim();if(t)send({type:'chat',text:t});
      inp.value='';closeChat();
    }
    return;
  }
  if(e.code==='KeyE'){
    if(document.getElementById('crafting').classList.contains('open'))closeCraft();
    else{toggleInv();}
    return;
  }
  if(e.code==='KeyC'){
    if(document.getElementById('inventory').classList.contains('open'))closeInv();
    if(document.getElementById('crafting').classList.contains('open'))closeCraft();
    else openCraftPanel();
    return;
  }
  if(e.code.startsWith('Digit')){
    const n=parseInt(e.code.slice(5))-1;
    if(n>=0&&n<=8){activeSlot=n;refreshHotbar();}
  }
});
document.addEventListener('keyup',e=>{keys[e.code]=false;});

document.addEventListener('wheel',e=>{
  if(!inGame)return;
  activeSlot=(activeSlot+(e.deltaY>0?1:-1)+9)%9;
  refreshHotbar();
},{passive:true});

canvas.addEventListener('mousedown',e=>{
  if(!inGame)return;
  if(e.button===0)mDown=true;
  if(e.button===2){
    e.preventDefault();
    if(panelOpen())return;
    // Place block
    const wp=s2w(e.clientX,e.clientY);
    const bx=Math.floor(wp.x),by=Math.floor(wp.y);
    const dist=Math.hypot(bx+.5-PL.x-.4,by+.5-PL.y-.9);
    if(dist<6.5){
      const cur=getB(bx,by);
      if(cur===B.AIR||cur===B.WATER){
        const slot=inv[activeSlot];
        if(slot&&slot.i>0&&slot.i<=35){
          // Don't place in player body
          const px2=Math.floor(PL.x),py2=Math.floor(PL.y);
          const inPlayer=(bx===px2||bx===px2)&&(by===py2||by===py2+1);
          if(!inPlayer){
            send({type:'place_block',x:bx,y:by,block:slot.i});
            setB(bx,by,slot.i);
            if(slot.i===B.BED){PL.hasBed=true;PL.bedX=bx;PL.bedY=by;addSysChat('Lit assigné comme point de respawn !');}
            removeInv(slot.i,1);
          }
        }
      }
    }
    // Attack mob
    for(const[,m]of mobs){
      const dist=Math.hypot(m.x-PL.x,m.y-PL.y);
      if(dist<3){const dmg=TDMG[inv[activeSlot]?.i]||2;send({type:'attack_mob',mobId:m.id,damage:dmg});break;}
    }
  }
});
canvas.addEventListener('mouseup',e=>{if(e.button===0)mDown=false;});
canvas.addEventListener('contextmenu',e=>e.preventDefault());

function openChat(){document.getElementById('chat-input-wrap').classList.add('open');document.getElementById('chat-input').focus();}
function closeChat(){document.getElementById('chat-input-wrap').classList.remove('open');}
function toggleInv(){
  const inv2=document.getElementById('inventory');
  inv2.classList.toggle('open');
  if(inv2.classList.contains('open'))refreshInvGrid();
}

// ══════════════════════════════════════════════════════════════
//  MENU UTILS
// ══════════════════════════════════════════════════════════════
function menuErr(msg){
  document.getElementById('menu-err').textContent=msg;
  document.getElementById('menu').style.display='flex';
  canvas.style.display='none';
  document.getElementById('hud').style.display='none';
  inGame=false;
}

// ── Menu background animation ──
(function menuBg(){
  const c=document.getElementById('menu-bg');
  c.width=innerWidth;c.height=innerHeight;
  const x=c.getContext('2d');
  // Draw simple block pattern
  const ts=48;
  for(let r=0;r<Math.ceil(c.height/ts)+1;r++){
    for(let col=0;col<Math.ceil(c.width/ts)+1;col++){
      const t=(r+col)%6;
      const id=[B.GRASS,B.STONE,B.DIRT,B.WOOD,B.LEAVES,B.SAND][t];
      drawBlockToCanvas(x,id,ts);
      x.drawImage(c,col*ts,r*ts,ts,ts);
    }
  }
})();
</script>
</body>
</html>
