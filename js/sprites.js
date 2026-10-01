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

/* Matrices 16x16, con sombreado (tonos oscuro/medio/claro) para dar
   volumen y un look más trabajado, estilo RPG oscuro. */
const SPRITES = {

  /* 👹 Goblin — verde, orejas puntudas, taparrabos, ojos rojos */
  goblin: {
    palette: { d:'#2a4a15', g:'#4a7a2a', G:'#6fae2f', L:'#8fd04a', e:'#ff3020', p:'#000', m:'#1a1a1a', b:'#5a3a1a' },
    art: [
      '......pp........',
      '.pp..pGGp...pp..',
      'pGGp.pGGp..pGGp.',
      'pGGGppGGGppGGGp.',
      '.pGGGGGGGGGGGp..',
      '.pGLGGGGGGGLGp..',
      '.pGeGGGGGGeGGp..',
      '.pGGGppppGGGGp..',
      '.pGGpmmmmpGGGp..',
      '..pGGGGGGGGGp...',
      '...pGGGGGGGp....',
      '..pbbpGGGpbbp...',
      '..pbbp..pbbp....',
      '...pp....pp.....',
      '...p......p.....',
      '..pp......pp....',
    ]
  },

  /* 💀 Esqueleto — cráneo con mandíbula, costillas, tono hueso */
  esqueleto: {
    palette: { p:'#000', s:'#8a7a5a', b:'#c8b890', B:'#f0e6d0', e:'#7fe0ff' },
    art: [
      '....pppppp......',
      '...pBBBBBBp.....',
      '..pBBBBBBBBp....',
      '..pBBBBBBBBp....',
      '..pBpeBBepBp....',
      '..pBppBBppBp....',
      '..pBBBppBBBp....',
      '..pBBpppppBp....',
      '...pBpBpBpBp....',
      '....pppppp......',
      '...pbBBBBbp.....',
      '..pbpBpBpBbp....',
      '..pbpBpBpBbp....',
      '...ppBppBpp.....',
      '....pb..bp......',
      '...pp....pp.....',
    ]
  },

  /* 👹 Orco Brutal — verdoso musculoso, mandíbula ancha, colmillos */
  orco: {
    palette: { p:'#000', d:'#2a4015', r:'#4a6a28', R:'#6a9a38', L:'#8aba4a', e:'#ff2810', w:'#f0e6d0', m:'#1a1a0a' },
    art: [
      '..p..........p..',
      '.pRp........pRp.',
      '.pRRpppppppppRp.',
      '.pRRRRRRRRRRRRp.',
      'pRRRLRRRRRRLRRRp',
      'pRRReRRRRRReRRRp',
      'pRRRRRRRRRRRRRRp',
      'pRRRRRwwwwRRRRRp',
      'pwRRRwmmmmwRRRwp',
      'pwwRRmmmmmmRRwwp',
      '.pwRRRmmmmRRRwp.',
      '.pRRRRRRRRRRRRp.',
      'pRRRRRRRRRRRRRRp',
      'pddpRRRRRRRRpddp',
      '.pp.pdddddddp.pp',
      '....pp....pp....',
    ]
  },

  /* 🧙 Nigromante — encapuchado morado, ojos verdes brillantes, túnica */
  nigromante: {
    palette: { p:'#000', m:'#2a1248', M:'#3a1a5a', V:'#5a2a8a', L:'#7a3ab8', e:'#a8ff32', b:'#d8c8a8' },
    art: [
      '......pp........',
      '....ppMMpp......',
      '...pMMMMMMp.....',
      '..pMMMMMMMMp....',
      '..pMVVVVVVMp....',
      '..pMVppppVMp....',
      '..pMpeVVepMp....',
      '..pMVppppVMp....',
      '..pMMVVVVMMp....',
      '.pMMMMMMMMMMp...',
      '.pMMMLLLLMMMp...',
      'pMMMMMMMMMMMMp..',
      'pMMMMVVVVMMMMp..',
      'pMMMMMMMMMMMMp..',
      '.pMMMMMMMMMMp...',
      '..pp.pp.pp.pp...',
    ]
  },

  /* 🐉 Dragón Ancestral — gran reptil rojo, cuernos, alas, fuego */
  dragon: {
    palette: { p:'#000', d:'#5a0a04', r:'#8a1a0a', R:'#c83a1a', o:'#f07020', L:'#ff9040', e:'#ffe020', f:'#ffd000', w:'#3a0804' },
    art: [
      'p..pp......pp..p',
      'pRppRRp..pRRppRp',
      'pRRRRRRppRRRRRRp',
      'wpRRRRRRRRRRRRpw',
      'pRRRLRRRRRRLRRRp',
      'pRReRRRRRRRReRRp',
      'pRRRRRppppRRRRRp',
      'pRRRRpffffpRRRRp',
      'pRRRpffLLffpRRRp',
      'pRRRRpffffpRRRRp',
      'wpRRRRRRRRRRRRpw',
      '.pRRRRRRRRRRRRp.',
      '.pdRRRRRRRRRRdp.',
      '..ppRRRpppRRpp..',
      '...pdp.pp.pdp...',
      '...pp......pp...',
    ]
  },

};

/* ─── Devuelve un canvas con el sprite del enemigo pedido ───────────── */
function makeEnemySprite(key) {
  const s = SPRITES[key];
  if (!s) return null;
  return drawPixelArt(s.art, s.palette);
}

/* ═══════════════════════════ COFRES ═════════════════════════════════ */
/* Cofre de madera con herrajes dorados. Dos estados: cerrado y abierto. */
const CHEST = {
  palette: {
    p:'#000',       // contorno
    w:'#5a3410',    // madera oscura
    W:'#8a5420',    // madera clara
    g:'#c89028',    // herraje dorado
    G:'#f0c040',    // dorado brillante
    l:'#2a1808',    // interior/sombra
    s:'#ffe890',    // brillo del tesoro
  },
  closed: [
    '................',
    '....pppppppp....',
    '...pGGGGGGGGp...',
    '..pGWWWWWWWWGp..',
    '..pWWWWWWWWWWp..',
    '..pWWggggggWWp..',
    '..pGGgGGGGgGGp..',
    '..pWWggGGggWWp..',
    '..pWWWWWWWWWWp..',
    '..pWWWWWWWWWWp..',
    '..pGGGGGGGGGGp..',
    '...pppppppppp...',
    '................',
    '................',
    '................',
    '................',
  ],
  open: [
    '..pppppppppp....',
    '.plllllllllp....',
    '.plsllllslllp...',
    '.pllsllllsllp...',
    '.plllssslllp....',
    '..pppppppppp....',
    '..pGGGGGGGGp....',
    '..pWWWWWWWWp....',
    '..pWWggggWWp....',
    '..pGGgGGgGGp....',
    '..pWWWWWWWWp....',
    '..pGGGGGGGGp....',
    '...pppppppp.....',
    '................',
    '................',
    '................',
  ],
};

/* Devuelve el canvas del cofre (abierto o cerrado). */
function makeChestSprite(opened) {
  return drawPixelArt(opened ? CHEST.open : CHEST.closed, CHEST.palette, 2.5);
}

/* ═══════════════════════════ CARA DOOM DEL JUGADOR ══════════════════ */
/* Cambia de expresión según el % de vida (como el marine de DOOM).      */

/* Paleta por clase. h=capucha(oscuro) H=capucha(claro) c=borde/detalle
   S=piel s=sombra piel e=ojo p=pupila/sombra b=sangre m=boca d=contorno */
const FACE_PALETTES = {
  warrior: { h:'#5a1208', H:'#8a2414', c:'#c83020', S:'#e0a878', s:'#b07048', e:'#fff', p:'#1a1a2a', b:'#c81818', m:'#4a1010', d:'#2a0a04' }, // yelmo rojo
  elf:     { h:'#164a1a', H:'#2a7a2a', c:'#4ac84a', S:'#e8c8a0', s:'#c0986a', e:'#fff', p:'#163016', b:'#c81818', m:'#4a1010', d:'#0a2a0a' }, // capucha verde
  mage:    { h:'#241248', H:'#4a2a8a', c:'#8a4ad8', S:'#e0c8a0', s:'#b89868', e:'#a8e8ff', p:'#141432', b:'#c81818', m:'#4a1010', d:'#120a2a' }, // capucha morada
  rogue:   { h:'#141414', H:'#333333', c:'#5a5a5a', S:'#d8b890', s:'#a88860', e:'#f0d020', p:'#0a0a0a', b:'#c81818', m:'#4a1010', d:'#000000' }, // capucha negra
  werewolf:{ h:'#3a2410', H:'#6a4418', c:'#8a5a2a', S:'#7a4e24', s:'#5a3418', e:'#ffd020', p:'#1a0f08', b:'#c81818', m:'#2a1808', d:'#1a0f08' }, // pelaje marrón
  demon:   { h:'#5a0a06', H:'#9a1810', c:'#ff6010', S:'#b82418', s:'#8a1810', e:'#ffe020', p:'#1a0404', b:'#ffa020', m:'#2a0804', d:'#1a0404' }, // piel roja, cuernos
};

/* Caras 16x16 con capucha/yelmo sombreado y rostro con nariz.
   h=sombra capucha H=luz capucha c=borde. De sano a casi muerto. */
const FACES = {
  ok: [                         // 75-100%: firme
    '....hHHHHh......',
    '..hhHHHHHHhh....',
    '.hHHHHHHHHHHh...',
    '.hHHccccccHHh...',
    '.hHcSSSSSScHh...',
    '.hHcSSSSSScHh...',
    '.hcSeSSSSeSch...',
    '.hcSpSSSSpSch...',
    '.hcSSSssSSSch...',
    '.hcSSSssSSSch...',
    '.hcSSmmmmSSch...',
    '.hHcSSSSSScHh...',
    '..hHcccccHHh....',
    '...hHHHHHHh.....',
    '....dHHHHd......',
    '.....dddd.......',
  ],
  hurt: [                       // 40-74%: herido leve
    '....hHHHHh......',
    '..hhHHHHHHhh....',
    '.hHHHHHHHHHHh...',
    '.hHHccccccHHh...',
    '.hHcSbSSSScHh...',
    '.hHcSSSSSScHh...',
    '.hcSeSSSSeSch...',
    '.hcSpSSSSpSch...',
    '.hcSSSssSSSch...',
    '.hcSmmmmmmSch...',
    '.hcSeeeeeeSch...',
    '.hHcSbSSSScHh...',
    '..hHcccccHHh....',
    '...hHHHHHHh.....',
    '....dHHHHd......',
    '.....dddd.......',
  ],
  bad: [                        // 15-39%: malherido, sangre
    '....hHHHHh......',
    '..hhHHHHHHhh....',
    '.hHHHHHHHHHHh...',
    '.hHHccccccHHh...',
    '.hHcSbSSbScHh...',
    '.hHcbSSSSbcHh...',
    '.hcSeSSSSeSch...',
    '.hcSpSbbSpSch...',
    '.hcSbSssSbSch...',
    '.hcmmmmmmmmch...',
    '.hceeeeeeeech...',
    '.hHcbSbbSbcHh...',
    '..hHcccccHHh....',
    '...hHbbbHHh.....',
    '....dHHHHd......',
    '.....dddd.......',
  ],
  dead: [                       // 0-14%: casi muerto, ojos en X
    '....hHHHHh......',
    '..hhHHHHHHhh....',
    '.hHHHHHHHHHHh...',
    '.hHHccccccHHh...',
    '.hHcbSbbSbcHh...',
    '.hHcSbSSbScHh...',
    '.hcSbSbbSbsch...',
    '.hcSpSbbSpSch...',
    '.hcbSbssbSbch...',
    '.hcmmmmmmmmch...',
    '.hcbeeeeeebch...',
    '.hHcbbSSbbcHh...',
    '..hHcccccHHh....',
    '...hHbbbbHh.....',
    '....dHHHHd......',
    '.....dddd.......',
  ],
};

function faceForHp(pct) {
  if (pct >= 75) return 'ok';
  if (pct >= 40) return 'hurt';
  if (pct >= 15) return 'bad';
  return 'dead';
}

/* Devuelve un canvas con la cara del jugador según clase y % de vida. */
function makePlayerFace(pct, classId = 'warrior') {
  const key = faceForHp(pct);
  const palette = FACE_PALETTES[classId] || FACE_PALETTES.warrior;
  return drawPixelArt(FACES[key], palette, 4);
}
