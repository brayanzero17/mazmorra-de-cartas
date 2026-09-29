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
