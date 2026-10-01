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

    // Detecta si es un patrón de "tablero de transparencia" (cuadritos
    // grises/blancos alternados que quedaron pegados en la imagen).
    const isCheckerBg = (r, g, b) => {
      // gris (claro u oscuro) sin saturación: cuadritos del tablero o
      // recuadro gris que a veces queda alrededor de la imagen.
      const mn = Math.min(r,g,b), mx = Math.max(r,g,b);
      const grayish = (mx - mn) < 22;        // casi sin color
      return grayish && mn > 120;            // gris medio-claro hacia blanco
    };

    // 1) Volver transparente blanco/gris-claro del fondo
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i], g = px[i+1], b = px[i+2];
      if (isCheckerBg(r, g, b)) px[i+3] = 0;
    }

    // 2) Flood fill desde los bordes para no borrar grises DENTRO del
    //    personaje (p.ej. armadura clara). Sólo quitamos el fondo conectado
    //    a los bordes. Reconstruimos alpha: parte del borde y propaga.
    const visited = new Uint8Array(W * H);
    const stack = [];
    // Sembrar desde todos los píxeles del borde que sean fondo
    for (let x = 0; x < W; x++) { stack.push([x,0]); stack.push([x,H-1]); }
    for (let y = 0; y < H; y++) { stack.push([0,y]); stack.push([W-1,y]); }

    // Primero restauramos alpha (el paso 1 fue demasiado agresivo con grises internos)
    // Reasignamos: todo opaco, y el flood fill marca el fondo real.
    for (let i = 3; i < px.length; i += 4) px[i] = 255;

    while (stack.length) {
      const [x, y] = stack.pop();
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const idx = y * W + x;
      if (visited[idx]) continue;
      const p = idx * 4;
      const r = px[p], g = px[p+1], b = px[p+2];
      if (!isCheckerBg(r, g, b)) continue;   // sólo propaga por el fondo
      visited[idx] = 1;
      px[p+3] = 0;                           // transparente
      stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
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
      img.src = src + '?v=8';
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
