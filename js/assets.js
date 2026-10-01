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
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i], g = px[i+1], b = px[i+2];
      // Blanco/casi blanco → transparente
      if (r > 238 && g > 238 && b > 238) {
        px[i+3] = 0;
      }
    }
    ctx.putImageData(data, 0, 0);
  } catch (e) {
    // Si falla (CORS en file://), devolvemos la imagen tal cual
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
      img.src = src + '?v=4';
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
