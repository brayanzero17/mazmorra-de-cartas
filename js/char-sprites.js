/* =====================================================================
   MAZMORRA DE CARTAS — Sprites de CUERPO COMPLETO (jugador y enemigos)
   ---------------------------------------------------------------------
   Personajes de cuerpo entero con capucha/capa/báculo y 2 frames de
   caminar (las piernas alternan). Vista top-down ligeramente frontal.
   Matrices 16x16. Reutiliza drawPixelArt() de sprites.js.
   ===================================================================== */

/* ─── Paletas por clase ─────────────────────────────────────────────
   o=contorno  R/r=ropa(claro/oscuro)  c=capa  S/s=piel  e=ojos
   g=detalle dorado  w=arma/báculo  f=brillo mágico  b=bota            */
const CHAR_PALETTES = {
  mage: {
    o:'#140a24', r:'#4a2a8a', R:'#5a34a4', c:'#331a6a', S:'#e0c0a0', s:'#b8986a',
    e:'#a8e8ff', g:'#c89028', w:'#8a5a2a', f:'#b060ff', b:'#2a1a4a',
  },
  warrior: {
    o:'#1a0804', r:'#8a2414', R:'#b83020', c:'#5a1208', S:'#e0a878', s:'#b07048',
    e:'#ffffff', g:'#d0a040', w:'#c0c0d0', f:'#ff5020', b:'#3a1a10',
  },
  elf: {
    o:'#0a2a0a', r:'#2a7a2a', R:'#3a9a3a', c:'#164a1a', S:'#e8c8a0', s:'#c0986a',
    e:'#ffffff', g:'#c8a828', w:'#8a5a2a', f:'#80ff80', b:'#1a3a12',
  },
  rogue: {
    o:'#000000', r:'#2a2a2a', R:'#3a3a3a', c:'#141414', S:'#d8b890', s:'#a88860',
    e:'#f0d020', g:'#9a9a9a', w:'#c0c0c0', f:'#f0d020', b:'#1a1a1a',
  },
};

/* ─── Cuerpo del jugador: 2 frames (piernas alternadas) ─────────────
   Base común con capucha, cara, túnica con capa y báculo a la derecha. */
const CHAR_BODY = {
  // Frame A — piernas paralelas
  frameA: [
    '......oooo......',
    '....ooRRRRoo....',
    '...oRRRRRRRRo...',
    '...oRRooooRRo..w',
    '...oRoSSSSoRo.ow',
    '...oRoSeSeSoR.of',
    '...oRoSSSSoRo.ow',
    '...ooRRRRRRoo.ow',
    '..ocRRRRRRRRco.w',
    '..ocRRRRRRRRco..',
    '..ocRRRRRRRRco..',
    '...ocRRRRRRco...',
    '...ooRRRRRRoo...',
    '...oRRoooRRRo...',
    '...obbo.obbo....',
    '...ooo...ooo....',
  ],
  // Frame B — una pierna adelantada (paso)
  frameB: [
    '......oooo......',
    '....ooRRRRoo....',
    '...oRRRRRRRRo...',
    '...oRRooooRRo..w',
    '...oRoSSSSoRo.ow',
    '...oRoSeSeSoR.of',
    '...oRoSSSSoRo.ow',
    '...ooRRRRRRoo.ow',
    '..ocRRRRRRRRco.w',
    '..ocRRRRRRRRco..',
    '..ocRRRRRRRRco..',
    '...ocRRRRRRco...',
    '...ooRRRRRRoo...',
    '..oRRRoooRRo....',
    '..obbo..obbo....',
    '..ooo....ooo....',
  ],
  // Frame quieto (idle)
  idle: [
    '......oooo......',
    '....ooRRRRoo....',
    '...oRRRRRRRRo...',
    '...oRRooooRRo..w',
    '...oRoSSSSoRo.ow',
    '...oRoSeSeSoR.of',
    '...oRoSSSSoRo.ow',
    '...ooRRRRRRoo.ow',
    '..ocRRRRRRRRco.w',
    '..ocRRRRRRRRco..',
    '..ocRRRRRRRRco..',
    '...ocRRRRRRco...',
    '...ooRRRRRRoo...',
    '...oRRRRRRRRo...',
    '...obbooobbo....',
    '...ooo...ooo....',
  ],
};

/* Caché de canvases para no redibujar cada frame (rendimiento). */
const _charCache = {};

/* Devuelve un canvas del jugador según clase y frame ('idle'|'A'|'B'). */
function makeCharSprite(classId, frameKey) {
  const key = `${classId}_${frameKey}`;
  if (_charCache[key]) return _charCache[key];
  const palette = CHAR_PALETTES[classId] || CHAR_PALETTES.mage;
  const matrix = frameKey === 'A' ? CHAR_BODY.frameA
               : frameKey === 'B' ? CHAR_BODY.frameB
               : CHAR_BODY.idle;
  const cv = drawPixelArt(matrix, palette, 3);
  _charCache[key] = cv;
  return cv;
}

/* ─── Enemigos de cuerpo completo (16x16) con 2 frames ──────────────── */
const ENEMY_BODIES = {
  goblin: {
    palette: { o:'#1a2a0a', g:'#4a7a2a', G:'#6fae2f', L:'#8fd04a', e:'#ff3020', p:'#000', b:'#5a3a1a', w:'#9a9aa0' },
    a: [
      '....o....o......',
      '...oGo..oGo.....',
      '...oGGooGGo.....',
      '..oGGGGGGGGo....',
      '..oGLGGGGLGo....',
      '..oGeGGGGeGo....',
      '..oGGGppGGGo....',
      '..ooGGGGGGoo....',
      '.obGGGGGGGGbo...',
      '.obGGGGGGGGbo...',
      '..oGGGGGGGGo....',
      '..oGGo..oGGo....',
      '..oGo....oGo....',
      '..obo....obo....',
      '..oo......oo....',
      '................',
    ],
    b: [
      '....o....o......',
      '...oGo..oGo.....',
      '...oGGooGGo.....',
      '..oGGGGGGGGo....',
      '..oGLGGGGLGo....',
      '..oGeGGGGeGo....',
      '..oGGGppGGGo....',
      '..ooGGGGGGoo....',
      '.obGGGGGGGGbo...',
      '..oGGGGGGGGo....',
      '..oGGGGGGGGo....',
      '...oGGooGGo.....',
      '..oGo....oGo....',
      '..obo....obo....',
      '...oo....oo.....',
      '................',
    ],
  },
};

/* Devuelve canvas del enemigo de cuerpo completo (fallback al retrato). */
function makeEnemyBody(key, frame) {
  const b = ENEMY_BODIES[key];
  if (!b) return (typeof makeEnemySprite === 'function') ? makeEnemySprite(key) : null;
  const ck = `enemy_${key}_${frame}`;
  if (_charCache[ck]) return _charCache[ck];
  const cv = drawPixelArt(frame === 'b' ? b.b : b.a, b.palette, 3);
  _charCache[ck] = cv;
  return cv;
}
