/* =====================================================================
   MAZMORRA DE CARTAS — Retratos pixel art de las clases
   ---------------------------------------------------------------------
   Retratos tipo "busto" (16x16) grandes y detallados para la pantalla
   de selección de clase y el HUD. Reemplazan a los emojis.
   Reutiliza drawPixelArt() de sprites.js.
   ===================================================================== */

/* Cada retrato tiene su propia paleta y matriz 16x16. Letras:
   o=contorno  . =transparente  (el resto son colores de la paleta)   */
const PORTRAITS = {

  /* 🧝 ELFO ARQUERO — rubio, orejas puntudas, capucha verde, arco */
  elf: {
    palette: { o:'#0a2a0a', k:'#2a6a2a', K:'#3a9a3a', h:'#e8d070', H:'#f8e890', S:'#e8c8a0', s:'#c89868', e:'#2a7a3a', w:'#8a5a2a' },
    art: [
      '......oooo......',
      '....ohhhhho.....',
      '...ohHHHHHho....',
      '..ohHHHHHHHo..o.',
      '..oHkSSSSkHo.ow.',
      '..oHSSSSSSHo.ow.',
      '..oHSeSSeSHo.ow.',
      '..oHSSSSSSHo..w.',
      '..oHSSssSSHo..w.',
      '..oHoSSSSoHo..w.',
      '...okSSSSko.....',
      '...okKKKKko.....',
      '..okKKKKKKko....',
      '..oKKKKKKKKo....',
      '..oKKo..oKKo....',
      '..oo......oo....',
    ],
  },

  /* ⚔️ GUERRERO — yelmo de hierro, cejas firmes, armadura */
  warrior: {
    palette: { o:'#1a0804', m:'#8a9098', M:'#c0c8d0', g:'#d0a040', S:'#e0a878', s:'#b07048', e:'#2a3a5a', r:'#b83020', R:'#d84838' },
    art: [
      '....oMMMMMo.....',
      '...oMMMMMMMo....',
      '..oMMMMMMMMMo...',
      '..oMMgggggMMo...',
      '..oMSSSSSSSMo...',
      '..oMSeSSSeSMo...',
      '..oMSSSSSSSMo...',
      '..oMSSmmSSSMo...',
      '..oMSSSSSSSMo...',
      '..ooSSSSSSSoo...',
      '...orRRRRRro....',
      '..orRRRRRRRro...',
      '..oRRgggggRRo...',
      '..oRRRRRRRRRo...',
      '..oRRo..oRRo....',
      '..oo......oo....',
    ],
  },

  /* 🧙 MAGO — sombrero puntudo, barba, ojos brillantes */
  mage: {
    palette: { o:'#140a24', m:'#4a2a8a', M:'#6a3ab8', g:'#c89028', S:'#e0c0a0', s:'#b8986a', e:'#a8e8ff', b:'#d0d0e0' },
    art: [
      '.......oo.......',
      '......omMo......',
      '.....omMMo......',
      '....omMMMMo.....',
      '...omMMMMMMo....',
      '..omMgggggMMo...',
      '..oMSSSSSSSMo...',
      '..oMSeSSSeSMo...',
      '..oMSSSSSSSMo...',
      '..oMbSSSSSbMo...',
      '..oMbbSSSbbMo...',
      '..oMbbbbbbbMo...',
      '..omMMMMMMMmo...',
      '..omMMMMMMMmo...',
      '..omMo...oMmo...',
      '..oo......oo....',
    ],
  },

  /* 🗡️ PÍCARO — capucha negra, ojos amarillos, bufanda */
  rogue: {
    palette: { o:'#000000', h:'#2a2a2a', H:'#3a3a3a', S:'#d8b890', s:'#a88860', e:'#f0d020', r:'#8a2a2a', R:'#b83838' },
    art: [
      '....ohhhhho.....',
      '...ohHHHHHho....',
      '..ohHHHHHHHho...',
      '..oHHHHHHHHHo...',
      '..oHHSSSSSHHo...',
      '..oHSeSSSeSHo...',
      '..oHSSSSSSSHo...',
      '..oHHSSSSSHHo...',
      '..oHHHoooHHHo...',
      '...orRRRRRro....',
      '..orRRRRRRRro...',
      '..oRRRRRRRRRo...',
      '..oHHHHHHHHHo...',
      '..oHHHHHHHHHo...',
      '..oHHo..oHHo....',
      '..oo......oo....',
    ],
  },

  /* 🐺 HOMBRE LOBO — hocico, orejas, pelaje marrón, colmillos */
  werewolf: {
    palette: { o:'#1a0f08', k:'#3a2410', K:'#6a4418', L:'#8a5a2a', S:'#9a6a30', e:'#ffd020', w:'#f0f0f0', m:'#1a0a04', n:'#2a1810' },
    art: [
      '..o..........o..',
      '.oKo........oKo.',
      '.oKKo......oKKo.',
      '.oKKKoooooKKKo..',
      '.oKKKKKKKKKKKo..',
      '.oKKeKKKKKeKKo..',
      '.oKKKKKKKKKKKo..',
      '.oKKKLLLLLKKKo..',
      '.oKKLSSSSSLKKo..',
      '.oKLSwmmmwSLKo..',
      '.oKLSmmmmmSLKo..',
      '.oKLwSmmmSwLKo..',
      '..oKLSSSSSLKo...',
      '..oKKLLLLLKKo...',
      '..oKKo...oKKo...',
      '..oo......oo....',
    ],
  },

  /* 😈 DEMONIO — cuernos, piel roja, ojos amarillos, colmillos */
  demon: {
    palette: { o:'#1a0404', r:'#8a1810', R:'#b82418', L:'#d84020', e:'#ffe020', g:'#ffa020', w:'#f0f0f0', m:'#2a0804', p:'#000' },
    art: [
      '.og........go...',
      '.ogo......ogo...',
      '.oRgo....ogRo...',
      '.oRRgoooogRRo...',
      '.oRRRRRRRRRRRo..',
      '.oRRLRRRRRLRRo..',
      '.oRReRRRRReRRo..',
      '.oRRRRRRRRRRRo..',
      '.oRRRRmmRRRRRo..',
      '.oRRLRRRRRLRRo..',
      '.oRRwRmmmRwRRo..',
      '.oRRwwmmmwwRRo..',
      '..oRRRRRRRRRo...',
      '..oRRRRRRRRRo...',
      '..oRRo...oRRo...',
      '..oo......oo....',
    ],
  },

};

/* Caché de retratos para no redibujar. */
const _portraitCache = {};

/* Devuelve un canvas con el retrato de la clase (scale configurable). */
function makePortrait(classId, scale = 5) {
  const key = `${classId}_${scale}`;
  if (_portraitCache[key]) return _portraitCache[key];
  const p = PORTRAITS[classId];
  if (!p) return null;
  const cv = drawPixelArt(p.art, p.palette, scale);
  _portraitCache[key] = cv;
  return cv;
}


/* =====================================================================
   ICONOS pixel art para el HUD (reemplazan emojis ❤️🎲🃏 etc.)
   Matrices más pequeñas (12x12 / 10x10). drawPixelArt escala.
   ===================================================================== */
const ICONS = {

  /* ❤️ Corazón */
  heart: {
    palette: { o:'#5a0a0a', r:'#c81818', R:'#ff4838', h:'#ff9088' },
    art: [
      '.oo..oo.',
      'oRRooRRo',
      'oRhRRhRo',
      'oRRRRRRo',
      'oRRRRRRo',
      '.oRRRRo.',
      '..oRRo..',
      '...oo...',
    ],
  },

  /* 🎲 Dado */
  dice: {
    palette: { o:'#000', w:'#e8e0c8', W:'#f8f0d8', p:'#1a1a1a' },
    art: [
      'oooooooo',
      'oWWWWWWo',
      'oWpWWpWo',
      'oWWWWWWo',
      'oWWpWWWo',
      'oWpWWpWo',
      'oWWWWWWo',
      'oooooooo',
    ],
  },

  /* 🃏 Carta */
  card: {
    palette: { o:'#000', b:'#c8963c', B:'#f0c060', w:'#2a1f14' },
    art: [
      '.oooooo.',
      'oBbbbbBo',
      'obwwwwbo',
      'obwBBwbo',
      'obwBBwbo',
      'obwwwwbo',
      'oBbbbbBo',
      '.oooooo.',
    ],
  },

  /* 🗺️ Sala/mapa */
  room: {
    palette: { o:'#000', g:'#4a7a2a', G:'#6fae2f', b:'#3a2c1e' },
    art: [
      'oooooooo',
      'obbbbbbo',
      'obGGbGbo',
      'obGbbGbo',
      'obGGGGbo',
      'obbGbbbo',
      'obGGGGbo',
      'oooooooo',
    ],
  },

  /* ⭐ Nivel/estrella */
  star: {
    palette: { o:'#5a4000', y:'#e8a020', Y:'#ffd040' },
    art: [
      '...oo...',
      '...YY...',
      '.oYYYYo.',
      'oYYYYYYo',
      '.oYYYYo.',
      '.oYooYo.',
      'oYo..oYo',
      'oo....oo',
    ],
  },

  /* 🎒 Mochila */
  bag: {
    palette: { o:'#000', b:'#6a4418', B:'#8a5a2a', g:'#c89028' },
    art: [
      '..oooo..',
      '.oBggBo.',
      'oBBBBBBo',
      'oBgggBBo',
      'oBBBBBBo',
      'oBgBgBBo',
      'oBBBBBBo',
      'oooooooo',
    ],
  },

};

const _iconCache = {};

/* Devuelve un canvas con el icono pedido. */
function makeIcon(name, scale = 3) {
  const key = `${name}_${scale}`;
  if (_iconCache[key]) return _iconCache[key];
  const ic = ICONS[name];
  if (!ic) return null;
  const cv = drawPixelArt(ic.art, ic.palette, scale);
  _iconCache[key] = cv;
  return cv;
}

/* Inserta un icono como <img>/<canvas> dentro de un elemento del DOM.
   Devuelve el dataURL para usar en innerHTML si se requiere. */
function iconHTML(name, scale = 2) {
  const cv = makeIcon(name, scale);
  if (!cv) return '';
  return `<img src="${cv.toDataURL()}" class="px-icon" alt="${name}" />`;
}
