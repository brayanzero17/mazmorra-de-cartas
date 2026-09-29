/* =====================================================================
   MAZMORRA DE CARTAS — Sprites pixel art (estilo DOOM)
   ---------------------------------------------------------------------
   Dibuja enemigos y la "cara DOOM" del jugador en un <canvas> a partir
   de mapas de píxeles. No necesita imágenes externas: todo se genera.
   Cada sprite es una matriz de índices que apuntan a una paleta.
   '.' = transparente.
   ===================================================================== */

/* Escala cada "pixel" del arte a un bloque de N x N px reales. */
const PIXEL_SCALE = 8;

/* ─── Helper: dibuja una matriz de píxeles en un canvas ─────────────── */
function drawPixelArt(matrix, palette, scale = PIXEL_SCALE) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const cv = document.createElement('canvas');
  cv.width  = cols * scale;
  cv.height = rows * scale;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const key = matrix[y][x];
      if (key === '.' || key === ' ') continue;
      const color = palette[key];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  return cv;
}

/* ═══════════════════════════ ENEMIGOS ═══════════════════════════════ */
/* Matrices 12x12. Diseño simple pero reconocible, estilo retro.         */

const SPRITES = {

  /* 👹 Goblin — verde, orejas puntudas */
  goblin: {
    palette: { g:'#4a7a2a', G:'#6fae2f', d:'#2a4a15', e:'#e0e0e0', p:'#000', m:'#a83232' },
    art: [
      '....gggg....',
      '..gg.GG.gg..',
      '.g.GGGGGG.g.',
      '.gGGGGGGGGg.',
      '.gGeGGGGeGg.',
      '.gGpGGGGpGg.',
      '.gGGGGGGGGg.',
      '.gGGmmmmGGg.',
      '.gGGpppGGGg.',
      '..gGGGGGGg..',
      '...dg..gd...',
      '...d....d...',
    ]
  },

  /* 💀 Esqueleto — hueso, cuencas negras */
  esqueleto: {
    palette: { b:'#d8c8a8', B:'#f0e6d0', p:'#000', s:'#8a7a5a' },
    art: [
      '...bBBBb....',
      '..bBBBBBb...',
      '.bBBBBBBBb..',
      '.bBpBBBpBb..',
      '.bBpBBBpBb..',
      '.bBBBpBBBb..',
      '.bBBpppBBb..',
      '..bBBBBBb...',
      '...bbbbb....',
      '..b.b.b.b...',
      '.b..b.b..b..',
      '.s..s.s..s..',
    ]
  },

  /* 👺 Orco Brutal — rojo, colmillos */
  orco: {
    palette: { r:'#8a3a1a', R:'#b8502a', d:'#5a2410', e:'#f0d020', p:'#000', w:'#f0e6d0' },
    art: [
      '..rr.RR.rr..',
      '.rRRRRRRRRr.',
      'rRRRRRRRRRRr',
      'rRReRRRReRRr',
      'rRRpRRRRpRRr',
      'rRRRRRRRRRRr',
      'rRRRddddRRRr',
      'rRwRRRRRRwRr',
      '.rRRRRRRRRr.',
      '..rRRRRRRr..',
      '..d.rRRr.d..',
      '....d..d....',
    ]
  },

  /* 🧟 Nigromante — encapuchado morado, ojos brillantes */
  nigromante: {
    palette: { m:'#3a1a5a', M:'#5a2a8a', e:'#a8e832', p:'#000', b:'#d8c8a8', s:'#7a3ab8' },
    art: [
      '...mMMMm....',
      '..mMMMMMm...',
      '.mMMMMMMMm..',
      '.mMpppppMm..',
      '.mMpeepeMm..',
      '.mMpppppMm..',
      '.mbMMMMMbm..',
      'mMMMMMMMMMm.',
      'mMMsMMMsMMm.',
      'mMMMMMMMMMm.',
      '.mMMMMMMMm..',
      '..mM.MM.Mm..',
    ]
  },

  /* 🐉 Dragón Ancestral — rojo/naranja, cuernos, fuego */
  dragon: {
    palette: { r:'#8a1a0a', R:'#c83a1a', o:'#f07020', e:'#f0d020', p:'#000', f:'#ffd000' },
    art: [
      'r..rRRRr..r.',
      '.rrRRRRRRrr.',
      '.RRRRRRRRRR.',
      'RRReRRRReRRo',
      'RRpRRRRpRRoo',
      'RRRRRRRRRRRo',
      '.RRRffffRRR.',
      '.RRfffffRRo.',
      'oRRRRRRRRRo.',
      '.oRRRRRRRo..',
      '..o.RRRR.o..',
      '...o.RR.o...',
    ]
  },

};

/* ─── Devuelve un canvas con el sprite del enemigo pedido ───────────── */
function makeEnemySprite(key) {
  const s = SPRITES[key];
  if (!s) return null;
  return drawPixelArt(s.art, s.palette);
}

/* ═══════════════════════════ CARA DOOM DEL JUGADOR ══════════════════ */
/* Cambia de expresión según el % de vida (como el marine de DOOM).      */

const FACE_PALETTE = {
  s:'#c88a5a', S:'#e0a878', // piel
  h:'#5a3a1a',              // pelo/sombra
  e:'#ffffff', p:'#1a1a2a', // ojos
  b:'#8b0000', m:'#5a1a1a', // sangre / boca
  d:'#3a2410'               // contorno
};

/* Distintas expresiones (12x12). De sano a casi muerto. */
const FACES = {
  ok: [                         // 75-100%: serio y firme
    '..hhhhhhhh..',
    '.hSSSSSSSSh.',
    '.hSSSSSSSSh.',
    '.hSeSpSpSeS.',
    '.hSSSSSSSSh.',
    '.hSSSbbSSSh.',
    '.hSShhhhSSh.',
    '.hSSmmmmSSh.',
    '.hSSSSSSSSh.',
    '..hSSSSSSh..',
    '...dhhhhd...',
    '............',
  ],
  hurt: [                       // 40-74%: apretando dientes, un corte
    '..hhhhhhhh..',
    '.hSSSSSSSSh.',
    '.hSSbSSSSSh.',
    '.hSpSSpSSeS.',
    '.hSSSSSSSSh.',
    '.hSSSbbSSSh.',
    '.hSmmmmmmSh.',
    '.hSeeeeeeSh.',
    '.hSSmmmmSSh.',
    '..hSSSSSSh..',
    '...dhhhhd...',
    '............',
  ],
  bad: [                        // 15-39%: herido, sangre en la cara
    '..hhhhhhhh..',
    '.hSSbSSbSSh.',
    '.hSbSSSSbSh.',
    '.hSpSSpSSpS.',
    '.hSSbSSbSSh.',
    '.hSbSbbSbSh.',
    '.hmmmmmmmmh.',
    '.heeeeeeeeh.',
    '.hSbmmmmbSh.',
    '..hSbSSbSh..',
    '...dhhhhd...',
    '............',
  ],
  dead: [                       // 0-14%: casi muerto, ojos en X
    '..hhhhhhhh..',
    '.hbbSSSSbbh.',
    '.hSbSbbSbSh.',
    '.hSpSbbSpSh.',
    '.hSbSbbSbSh.',
    '.hbSbbbbSbh.',
    '.hmmmmmmmmh.',
    '.hbeeeeeebh.',
    '.hbbmmmmbbh.',
    '..hbbSSbbh..',
    '...dhhhhd...',
    '............',
  ],
};

function faceForHp(pct) {
  if (pct >= 75) return 'ok';
  if (pct >= 40) return 'hurt';
  if (pct >= 15) return 'bad';
  return 'dead';
}

/* Devuelve un canvas con la cara según % de vida. */
function makePlayerFace(pct) {
  const key = faceForHp(pct);
  return drawPixelArt(FACES[key], FACE_PALETTE, 4);
}
