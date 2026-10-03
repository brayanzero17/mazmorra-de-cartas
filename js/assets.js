/* =====================================================================
   MAZMORRA DE CARTAS — Carga de imágenes externas (assets/)
   ---------------------------------------------------------------------
   Carga imágenes PNG de personajes desde la carpeta assets/. Si una
   clase tiene su imagen, el juego la usa; si no, usa el pixel art
   propio (fallback). Además quita el fondo blanco (lo hace transparente)
   para que encaje bien en el mapa de la mazmorra.
   ===================================================================== */

/* Mapa de clase → archivo de imagen. Añade aquí las que subas.
   (si el archivo no existe, simplemente se ignora y se usa pixel art). */
const CLASS_IMAGE_FILES = {
  mage:     'assets/mago.png',
  warrior:  'assets/guerrero.png',
  elf:      'assets/elfo.png',
  rogue:    'assets/picaro.png',
  werewolf: 'assets/lobo.png',
  demon:    'assets/demonio.png',
};

/* Mapa de enemigo (spriteKey) → archivo de imagen. */
const ENEMY_IMAGE_FILES = {
  goblin:     'assets/goblin.png',
  esqueleto:  'assets/esqueleto.png',
  orco:       'assets/orco.png',
  nigromante: 'assets/nigromante.png',
  dragon:     'assets/dragon.png',
};

/* Canvases ya procesados (fondo quitado), listos para dibujar. */
const CLASS_IMAGES = {};   // classId → canvas (o undefined si no hay)
const ENEMY_IMAGES = {};   // spriteKey → canvas (o undefined si no hay)

/* Quita el fondo claro de una imagen: los píxeles casi blancos se
   vuelven transparentes. Devuelve un canvas recortado al contenido. */
function removeWhiteBackground(img) {
  const cv = document.createElement('canvas');
  cv.width = img.naturalWidth;
  cv.height = img.naturalHeight;
  const ctx = cv.getContext('2d');
  ctx.drawImage(img, 0, 0);

  try {
    const data = ctx.getImageData(0, 0, cv.width, cv.height);
    const px = data.data;
    const W = cv.width, H = cv.height;

    // Un píxel es "fondo" si YA es transparente, o si es un gris/blanco
    // sin color (fondo sólido o patrón de tablero de transparencia pegado).
    // Como solo borramos lo CONECTADO al borde (flood fill), podemos ser
    // más permisivos con el gris sin dañar al personaje.
    const isBg = (r, g, b, a) => {
      if (a < 24) return true;                 // ya transparente
      const mn = Math.min(r,g,b), mx = Math.max(r,g,b);
      const grayish = (mx - mn) < 28;          // sin color (gris/blanco/negro)
      if (grayish && mn >= 150) return true;   // fondo claro (blanco/gris claro)
      if (grayish && mx <= 40)  return true;   // fondo oscuro (negro/casi negro)
      return false;
    };

    // Flood fill desde los bordes: sólo se vuelve transparente el fondo
    // CONECTADO al borde. Así no borramos zonas claras internas del
    // personaje (armadura, báculo claro, etc.). NO tocamos el resto.
    const visited = new Uint8Array(W * H);
    const stack = [];
    for (let x = 0; x < W; x++) { stack.push(x); stack.push((H-1)*W + x); }
    for (let y = 0; y < H; y++) { stack.push(y*W); stack.push(y*W + (W-1)); }

    while (stack.length) {
      const idx = stack.pop();
      if (idx < 0 || idx >= W*H || visited[idx]) continue;
      const p = idx * 4;
      if (!isBg(px[p], px[p+1], px[p+2], px[p+3])) continue;
      visited[idx] = 1;
      px[p+3] = 0;                             // transparente
      const x = idx % W, y = (idx / W) | 0;
      if (x+1 < W) stack.push(idx+1);
      if (x-1 >= 0) stack.push(idx-1);
      if (y+1 < H) stack.push(idx+W);
      if (y-1 >= 0) stack.push(idx-W);
    }

    // Pasada de limpieza: quita píxeles grises/blancos que quedaron
    // "sueltos" rodeados mayormente de transparencia (restos del tablero
    // que el flood fill no alcanzó por el patrón alternado). 2 pasadas.
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = y*W + x, p = idx*4;
          if (px[p+3] === 0) continue;
          const mn = Math.min(px[p],px[p+1],px[p+2]);
          const mx = Math.max(px[p],px[p+1],px[p+2]);
          const esFondo = (mx-mn)<28 && (mn>=150 || mx<=40);  // claro u oscuro
          if (esFondo) {
            // ¿muchos vecinos transparentes? → también es fondo
            let transp = 0, tot = 0;
            for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++) {
              if (!dx && !dy) continue;
              const nx=x+dx, ny=y+dy;
              if (nx<0||ny<0||nx>=W||ny>=H) continue;
              tot++;
              if (px[(ny*W+nx)*4+3] === 0) transp++;
            }
            if (tot && transp/tot >= 0.4) px[p+3] = 0;
          }
        }
      }
    }

    ctx.putImageData(data, 0, 0);
  } catch (e) {
    console.warn('No se pudo procesar el fondo:', e);
  }
  return cv;
}

/* Precarga todas las imágenes de clase disponibles. Devuelve una promesa
   que resuelve cuando terminó de intentar cargarlas todas. */
function loadImageInto(store, key, src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try { store[key] = removeWhiteBackground(img); }
      catch (e) { store[key] = null; }
      resolve();
    };
    img.onerror = () => { resolve(); };   // no existe → se queda sin imagen
    img.src = src + '?v=15';
  });
}

function preloadClassImages() {
  const jobs = [];
  for (const [classId, src] of Object.entries(CLASS_IMAGE_FILES))  jobs.push(loadImageInto(CLASS_IMAGES, classId, src));
  for (const [key, src]     of Object.entries(ENEMY_IMAGE_FILES))  jobs.push(loadImageInto(ENEMY_IMAGES, key, src));
  return Promise.all(jobs);
}

/* ¿Hay imagen externa para esta clase? */
function hasClassImage(classId) { return !!CLASS_IMAGES[classId]; }
/* Devuelve el canvas de la imagen de clase (o null). */
function getClassImage(classId) { return CLASS_IMAGES[classId] || null; }

/* Igual para enemigos (por spriteKey). */
function hasEnemyImage(key) { return !!ENEMY_IMAGES[key]; }
function getEnemyImage(key) { return ENEMY_IMAGES[key] || null; }

/* Precargar al iniciar la página. */
window.addEventListener('load', () => {
  preloadClassImages().then(() => {
    // Refrescar la pantalla de selección si ya está visible
    if (typeof renderClassSelection === 'function' &&
        document.getElementById('screen-class') &&
        document.getElementById('screen-class').classList.contains('active')) {
      renderClassSelection();
    }
  });
});
