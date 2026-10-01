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

/* Canvases ya procesados (fondo quitado), listos para dibujar. */
const CLASS_IMAGES = {};   // classId → canvas (o undefined si no hay)

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

    // Un píxel es "fondo" si YA es transparente, o si es casi blanco/gris
    // claro (fondo sólido o patrón de tablero pegado a la imagen).
    const isBg = (r, g, b, a) => {
      if (a < 24) return true;                 // ya transparente
      const mn = Math.min(r,g,b), mx = Math.max(r,g,b);
      const grayish = (mx - mn) < 24;          // sin color
      return grayish && mn > 200;              // claro (blanco/gris claro)
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

    ctx.putImageData(data, 0, 0);
  } catch (e) {
    console.warn('No se pudo procesar el fondo:', e);
  }
  return cv;
}

/* Precarga todas las imágenes de clase disponibles. Devuelve una promesa
   que resuelve cuando terminó de intentar cargarlas todas. */
function preloadClassImages() {
  const jobs = Object.entries(CLASS_IMAGE_FILES).map(([classId, src]) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try { CLASS_IMAGES[classId] = removeWhiteBackground(img); }
        catch (e) { CLASS_IMAGES[classId] = null; }
        resolve();
      };
      img.onerror = () => { resolve(); };  // no existe → se queda sin imagen
      img.src = src + '?v=9';
    });
  });
  return Promise.all(jobs);
}

/* ¿Hay imagen externa para esta clase? */
function hasClassImage(classId) {
  return !!CLASS_IMAGES[classId];
}
/* Devuelve el canvas de la imagen de clase (o null). */
function getClassImage(classId) {
  return CLASS_IMAGES[classId] || null;
}

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
