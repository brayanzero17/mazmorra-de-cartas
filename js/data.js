/* =====================================================================
   MAZMORRA DE CARTAS — Datos del juego
   Clases, cartas y enemigos. Todo se define aquí para editarlo fácil.
   ===================================================================== */

/* ──────────────────────────────────────────────────────────────────────
   MECÁNICA DEL DADO (d6):
   Cada carta tiene un requisito "diceReq" que indica con qué valores
   del dado se puede jugar:
     - { type: 'gte', value: 4 }   → dado >= 4
     - { type: 'lte', value: 3 }   → dado <= 3
     - { type: 'eq',  value: 6 }   → dado == 6
     - { type: 'any' }             → cualquier valor
     - { type: 'even' }            → par (2,4,6)
     - { type: 'odd' }             → impar (1,3,5)
   El resultado del dado también puede potenciar el efecto (scaling).
   ────────────────────────────────────────────────────────────────────── */

const CLASSES = {

  elf: {
    id: 'elf',
    name: 'Elfo Arquero',
    icon: '🧝',
    style: 'Preciso y ágil',
    diceHint: 'Mejor con dados altos',
    desc: 'Domina el arco. Sus flechas escalan con el valor del dado.',
    maxHp: 90,
    cards: [
      { id:'e1', name:'Flecha Certera', icon:'🏹', effect:'Daño = 4 + dado', type:'attack',
        diceReq:{type:'any'}, calc:(d)=>({dmg:4+d}) },
      { id:'e2', name:'Lluvia de Flechas', icon:'🌧️', effect:'Daño = dado × 3 (necesita dado ≥ 4)', type:'attack',
        diceReq:{type:'gte',value:4}, calc:(d)=>({dmg:d*3}) },
      { id:'e3', name:'Disparo Rápido', icon:'💨', effect:'6 daño + roba idea de otra tirada', type:'attack',
        diceReq:{type:'odd'}, calc:()=>({dmg:6}) },
      { id:'e4', name:'Raíces Curativas', icon:'🌿', effect:'Cura 5 + dado de HP', type:'heal',
        diceReq:{type:'any'}, calc:(d)=>({heal:5+d}) },
      { id:'e5', name:'Tiro Perfecto', icon:'🎯', effect:'20 de daño (solo con dado = 6)', type:'attack',
        diceReq:{type:'eq',value:6}, calc:()=>({dmg:20}) },
    ]
  },

  warrior: {
    id: 'warrior',
    name: 'Guerrero',
    icon: '⚔️',
    style: 'Fuerza bruta',
    diceHint: 'Constante con cualquier dado',
    desc: 'Resistente y poderoso. Golpea fuerte sin depender tanto del dado.',
    maxHp: 130,
    cards: [
      { id:'w1', name:'Tajo', icon:'🗡️', effect:'Daño = 6 + dado', type:'attack',
        diceReq:{type:'any'}, calc:(d)=>({dmg:6+d}) },
      { id:'w2', name:'Golpe Aplastante', icon:'🔨', effect:'Daño = 10 + dado (necesita dado ≥ 3)', type:'attack',
        diceReq:{type:'gte',value:3}, calc:(d)=>({dmg:10+d}) },
      { id:'w3', name:'Muro de Escudo', icon:'🛡️', effect:'Gana 8 + dado de defensa', type:'defense',
        diceReq:{type:'any'}, calc:(d)=>({block:8+d}) },
      { id:'w4', name:'Grito de Guerra', icon:'📢', effect:'Cura 8 HP y +2 daño próximo turno', type:'heal',
        diceReq:{type:'even'}, calc:()=>({heal:8, buff:2}) },
      { id:'w5', name:'Furia Berserker', icon:'💢', effect:'Daño = dado × 4 (solo con dado = 6)', type:'attack',
        diceReq:{type:'eq',value:6}, calc:(d)=>({dmg:d*4}) },
    ]
  },

  mage: {
    id: 'mage',
    name: 'Mago',
    icon: '🧙',
    style: 'Poder arcano',
    diceHint: 'Explosivo pero variable',
    desc: 'Hechizos devastadores. Alto riesgo, alta recompensa según el dado.',
    maxHp: 75,
    cards: [
      { id:'m1', name:'Chispa Arcana', icon:'✨', effect:'Daño = 3 + dado', type:'attack',
        diceReq:{type:'any'}, calc:(d)=>({dmg:3+d}) },
      { id:'m2', name:'Bola de Fuego', icon:'🔥', effect:'Daño = dado × 4 (necesita dado ≥ 4)', type:'attack',
        diceReq:{type:'gte',value:4}, calc:(d)=>({dmg:d*4}) },
      { id:'m3', name:'Rayo de Hielo', icon:'❄️', effect:'8 daño y el enemigo pierde su turno', type:'attack',
        diceReq:{type:'even'}, calc:()=>({dmg:8, freeze:true}) },
      { id:'m4', name:'Robo de Vida', icon:'🩸', effect:'Daño = dado + 2, te curas lo mismo', type:'attack',
        diceReq:{type:'any'}, calc:(d)=>({dmg:d+2, heal:d+2}) },
      { id:'m5', name:'Meteoro', icon:'☄️', effect:'25 de daño (solo con dado = 6)', type:'attack',
        diceReq:{type:'eq',value:6}, calc:()=>({dmg:25}) },
    ]
  },

  rogue: {
    id: 'rogue',
    name: 'Pícaro',
    icon: '🗡️',
    style: 'Sigilo y astucia',
    diceHint: 'Recompensa dados bajos',
    desc: 'Ataques sigilosos. Aprovecha los dados bajos donde otros fallan.',
    maxHp: 85,
    cards: [
      { id:'r1', name:'Puñalada', icon:'🔪', effect:'Daño = 5 + dado', type:'attack',
        diceReq:{type:'any'}, calc:(d)=>({dmg:5+d}) },
      { id:'r2', name:'Golpe Furtivo', icon:'👤', effect:'12 daño (necesita dado ≤ 3)', type:'attack',
        diceReq:{type:'lte',value:3}, calc:()=>({dmg:12}) },
      { id:'r3', name:'Veneno', icon:'🧪', effect:'4 daño ahora + 4 los próximos 2 turnos', type:'attack',
        diceReq:{type:'any'}, calc:()=>({dmg:4, poison:4}) },
      { id:'r4', name:'Evasión', icon:'💨', effect:'Gana 6 + dado de defensa y esquiva', type:'defense',
        diceReq:{type:'odd'}, calc:(d)=>({block:6+d, dodge:true}) },
      { id:'r5', name:'Asesinato', icon:'☠️', effect:'18 daño (solo con dado = 1)', type:'attack',
        diceReq:{type:'eq',value:1}, calc:()=>({dmg:18}) },
    ]
  }

};

/* ──────────────────────────── ENEMIGOS ─────────────────────────────── */
/* La mazmorra tiene 5 salas. Cada sala tiene un enemigo más fuerte.     */

const ENEMIES = [
  { name:'Goblin',           sprite:'👹', spriteKey:'goblin',     hp:30,  minAtk:4,  maxAtk:8  },
  { name:'Esqueleto',        sprite:'💀', spriteKey:'esqueleto',  hp:45,  minAtk:6,  maxAtk:11 },
  { name:'Orco Brutal',      sprite:'👺', spriteKey:'orco',       hp:65,  minAtk:8,  maxAtk:14 },
  { name:'Nigromante',       sprite:'🧟', spriteKey:'nigromante', hp:85,  minAtk:10, maxAtk:16 },
  { name:'Dragón Ancestral', sprite:'🐉', spriteKey:'dragon',     hp:120, minAtk:12, maxAtk:20 },
];

const TOTAL_ROOMS = ENEMIES.length;

/* ──────────────────────────── Helper dado ──────────────────────────── */
/* Comprueba si un valor de dado cumple el requisito de una carta.       */
function meetsDiceReq(req, dice) {
  switch (req.type) {
    case 'any':  return true;
    case 'gte':  return dice >= req.value;
    case 'lte':  return dice <= req.value;
    case 'eq':   return dice === req.value;
    case 'even': return dice % 2 === 0;
    case 'odd':  return dice % 2 === 1;
    default:     return false;
  }
}

/* Texto legible del requisito, para mostrarlo en la carta. */
function reqLabel(req) {
  switch (req.type) {
    case 'any':  return '🎲 Cualquiera';
    case 'gte':  return `🎲 ≥ ${req.value}`;
    case 'lte':  return `🎲 ≤ ${req.value}`;
    case 'eq':   return `🎲 = ${req.value}`;
    case 'even': return '🎲 Par';
    case 'odd':  return '🎲 Impar';
    default:     return '🎲 ?';
  }
}


/* =====================================================================
   OBJETOS — se encuentran en cofres durante la exploración.
   ---------------------------------------------------------------------
   Tipos:
     - consumable: se usa al instante al recogerlo (ej. poción cura HP)
     - armor:      equipable, reduce el daño recibido en combate
     - weapon:     equipable, aumenta el daño de tus cartas de ataque
     - relic:      equipable, bonus pasivo (ej. +1 al dado, +HP máx)
   Los equipables ocupan una "ranura" (slot): armor / weapon / relic.
   Solo puede haber 1 objeto equipado por ranura (el nuevo reemplaza).
   ===================================================================== */

const ITEMS = {

  /* ── Consumibles ─────────────────────────────────────────────────── */
  pocion_menor:  { id:'pocion_menor',  name:'Poción Menor',  icon:'🧪', type:'consumable',
                   desc:'Cura 20 HP al instante.', heal:20 },
  pocion_mayor:  { id:'pocion_mayor',  name:'Poción Mayor',  icon:'⚗️', type:'consumable',
                   desc:'Cura 45 HP al instante.', heal:45 },
  elixir_vida:   { id:'elixir_vida',   name:'Elixir de Vida',icon:'🍶', type:'consumable',
                   desc:'Restaura toda tu vida.', healFull:true },

  /* ── Armaduras (ranura: armor) → reducen daño recibido ───────────── */
  armadura_cuero: { id:'armadura_cuero', name:'Armadura de Cuero', icon:'🥋', type:'armor', slot:'armor',
                    desc:'Reduce 2 de daño por golpe.', defense:2 },
  cota_malla:     { id:'cota_malla',     name:'Cota de Malla',     icon:'🛡️', type:'armor', slot:'armor',
                    desc:'Reduce 4 de daño por golpe.', defense:4 },
  armadura_placas:{ id:'armadura_placas',name:'Armadura de Placas',icon:'🦺', type:'armor', slot:'armor',
                    desc:'Reduce 6 de daño por golpe.', defense:6 },

  /* ── Armas (ranura: weapon) → +daño a cartas de ataque ───────────── */
  daga_afilada:   { id:'daga_afilada',   name:'Daga Afilada',   icon:'🗡️', type:'weapon', slot:'weapon',
                    desc:'+2 de daño a tus ataques.', attack:2 },
  espada_acero:   { id:'espada_acero',   name:'Espada de Acero', icon:'⚔️', type:'weapon', slot:'weapon',
                    desc:'+4 de daño a tus ataques.', attack:4 },
  hacha_guerra:   { id:'hacha_guerra',   name:'Hacha de Guerra', icon:'🪓', type:'weapon', slot:'weapon',
                    desc:'+6 de daño a tus ataques.', attack:6 },

  /* ── Reliquias (ranura: relic) → bonus pasivos ───────────────────── */
  dado_suerte:    { id:'dado_suerte',    name:'Dado de la Suerte', icon:'🎲', type:'relic', slot:'relic',
                    desc:'+1 al resultado del dado.', diceBonus:1 },
  amuleto_vida:   { id:'amuleto_vida',   name:'Amuleto Vital',    icon:'📿', type:'relic', slot:'relic',
                    desc:'+25 HP máximo.', maxHpBonus:25 },
  anillo_furia:   { id:'anillo_furia',   name:'Anillo de Furia',  icon:'💍', type:'relic', slot:'relic',
                    desc:'+2 daño y +1 al dado.', attack:2, diceBonus:1 },

  /* ── OBJETOS POR CLASE ────────────────────────────────────────────
     Cada clase tiene equipo temático que potencia SU estilo de juego.
     Campo forClass: a qué clase pertenece (para el loot filtrado).     */

  /* GUERRERO — armas y protección física */
  w_mandoble:     { id:'w_mandoble',    name:'Mandoble del Campeón', icon:'⚔️', type:'weapon', slot:'weapon',
                    forClass:'warrior', desc:'+5 daño a tus golpes.', attack:5 },
  w_yelmo:        { id:'w_yelmo',       name:'Yelmo de Hierro',      icon:'⛑️', type:'armor',  slot:'armor',
                    forClass:'warrior', desc:'Reduce 5 de daño por golpe.', defense:5 },
  w_estandarte:   { id:'w_estandarte',  name:'Estandarte de Guerra', icon:'🚩', type:'relic',  slot:'relic',
                    forClass:'warrior', desc:'+3 daño y +20 HP máximo.', attack:3, maxHpBonus:20 },

  /* MAGO — mejoras de hechizos y poder arcano */
  m_grimorio:     { id:'m_grimorio',    name:'Grimorio Arcano',      icon:'📖', type:'weapon', slot:'weapon',
                    forClass:'mage', desc:'+5 de poder a tus hechizos.', attack:5 },
  m_orbe:         { id:'m_orbe',        name:'Orbe de Maná',         icon:'🔮', type:'relic',  slot:'relic',
                    forClass:'mage', desc:'+1 al dado (hechizos más potentes).', diceBonus:1 },
  m_tunica:       { id:'m_tunica',      name:'Túnica Encantada',     icon:'🧥', type:'armor',  slot:'armor',
                    forClass:'mage', desc:'Barrera mágica: reduce 4 de daño.', defense:4 },
  m_varita:       { id:'m_varita',      name:'Varita del Archimago', icon:'🪄', type:'relic',  slot:'relic',
                    forClass:'mage', desc:'+3 poder mágico y +1 al dado.', attack:3, diceBonus:1 },

  /* ELFO — arco y precisión */
  e_arco_largo:   { id:'e_arco_largo',  name:'Arco Largo Élfico',    icon:'🏹', type:'weapon', slot:'weapon',
                    forClass:'elf', desc:'+5 daño a tus flechas.', attack:5 },
  e_carcaj:       { id:'e_carcaj',      name:'Carcaj Encantado',     icon:'🎯', type:'relic',  slot:'relic',
                    forClass:'elf', desc:'+1 al dado (mejor puntería).', diceBonus:1 },
  e_manto:        { id:'e_manto',       name:'Manto del Bosque',     icon:'🍃', type:'armor',  slot:'armor',
                    forClass:'elf', desc:'Reduce 4 de daño por golpe.', defense:4 },

  /* PÍCARO — sigilo, veneno y agilidad */
  r_dagas:        { id:'r_dagas',       name:'Dagas Gemelas',        icon:'🗡️', type:'weapon', slot:'weapon',
                    forClass:'rogue', desc:'+5 daño a tus ataques furtivos.', attack:5 },
  r_capa:         { id:'r_capa',        name:'Capa de Sombras',      icon:'🥷', type:'armor',  slot:'armor',
                    forClass:'rogue', desc:'Reduce 4 de daño (evasión).', defense:4 },
  r_veneno:       { id:'r_veneno',      name:'Frasco de Veneno',     icon:'☠️', type:'relic',  slot:'relic',
                    forClass:'rogue', desc:'+2 daño y +1 al dado.', attack:2, diceBonus:1 },
};

/* Objetos temáticos por clase (para el loot filtrado). */
const CLASS_ITEMS = {
  warrior: ['w_mandoble', 'w_yelmo', 'w_estandarte'],
  mage:    ['m_grimorio', 'm_orbe', 'm_tunica', 'm_varita'],
  elf:     ['e_arco_largo', 'e_carcaj', 'e_manto'],
  rogue:   ['r_dagas', 'r_capa', 'r_veneno'],
};

/* Botín posible por sala (índice = sala-1). Cada cofre saca uno al azar
   de la lista correspondiente, así las salas avanzadas dan mejor loot. */
const LOOT_TABLE = [
  ['pocion_menor', 'armadura_cuero', 'daga_afilada'],                         // Sala 1
  ['pocion_menor', 'pocion_mayor', 'daga_afilada', 'dado_suerte'],            // Sala 2
  ['pocion_mayor', 'cota_malla', 'espada_acero', 'amuleto_vida'],             // Sala 3
  ['pocion_mayor', 'cota_malla', 'espada_acero', 'anillo_furia'],             // Sala 4
  ['elixir_vida', 'armadura_placas', 'hacha_guerra', 'anillo_furia'],         // Sala 5
];

/* Devuelve el id de un objeto al azar según la sala y la clase.
   ~55% de las veces sale un objeto TEMÁTICO de la clase del jugador
   (arma/armadura/reliquia acorde), el resto son consumibles/genéricos.
   Así el Mago encuentra hechizos, el Guerrero armas, etc. */
function randomLoot(roomNum, classId) {
  const cid = classId || (typeof state !== 'undefined' ? state.classId : null);
  const classPool = CLASS_ITEMS[cid] || [];

  // A partir de la sala 1 ya puede salir loot de clase; más probable si avanzas
  if (classPool.length && Math.random() < 0.55) {
    return classPool[Math.floor(Math.random() * classPool.length)];
  }

  // Si no, loot genérico de la sala (pociones, etc.)
  const table = LOOT_TABLE[Math.min(roomNum, LOOT_TABLE.length) - 1] || LOOT_TABLE[0];
  return table[Math.floor(Math.random() * table.length)];
}


/* =====================================================================
   TEMÁTICA Y PROGRESIÓN DE SALAS (modo exploración)
   ---------------------------------------------------------------------
   Cada sala tiene: paleta de suelo/paredes distinta, nº de enemigos,
   nº de cofres y un nombre ambiental. La sala 5 es la arena del JEFE.
   ===================================================================== */

const ROOM_THEMES = [
  { // Sala 1 — Entrada húmeda
    name: 'Cripta de Entrada',
    floorA:'#241c14', floorB:'#201812', wall:'#3a2c1e', accent:'#6fae2f',
    enemies: 1, chests: 1, boss:false,
  },
  { // Sala 2 — Catacumbas
    name: 'Catacumbas',
    floorA:'#1e1a22', floorB:'#181420', wall:'#332a3a', accent:'#8a7ab8',
    enemies: 2, chests: 1, boss:false,
  },
  { // Sala 3 — Foso de lava
    name: 'Foso Ardiente',
    floorA:'#2a1810', floorB:'#241208', wall:'#4a2a18', accent:'#e8702a',
    enemies: 2, chests: 2, boss:false,
  },
  { // Sala 4 — Salón profanado
    name: 'Salón Profanado',
    floorA:'#101a14', floorB:'#0c160f', wall:'#1e3a26', accent:'#a8e832',
    enemies: 3, chests: 2, boss:false,
  },
  { // Sala 5 — GUARIDA DEL DRAGÓN (jefe)
    name: 'Guarida del Dragón',
    floorA:'#2a0a08', floorB:'#200604', wall:'#5a1810', accent:'#ff3010',
    enemies: 1, chests: 0, boss:true,
  },
];

function roomTheme(roomNum) {
  return ROOM_THEMES[Math.min(roomNum, ROOM_THEMES.length) - 1] || ROOM_THEMES[0];
}
