/* =====================================================================
   MAZMORRA DE CARTAS — Capa de red (opcional)
   ---------------------------------------------------------------------
   Conecta el juego con el servidor Flask de Google Colab.
   Todo es "best effort": si el servidor no responde, el juego sigue
   funcionando offline sin romperse.
   ===================================================================== */

/* ¿Hay servidor configurado? */
function serverEnabled() {
  return !!(window.CONFIG && CONFIG.API_URL && CONFIG.API_URL.trim());
}

/* Comprobar conexión al arrancar (opcional, solo informa en consola). */
async function pingServer() {
  if (!serverEnabled()) {
    console.log('🎲 Modo offline: sin servidor, se usa guardado local.');
    return;
  }
  try {
    const res = await fetch(CONFIG.API_URL.replace(/\/$/, '') + '/ping');
    const data = await res.json();
    console.log('✅ Servidor conectado:', data.msg);
  } catch (e) {
    console.warn('⚠️ No se pudo conectar al servidor. Se usa modo offline.', e);
  }
}

/* Enviar el resultado de una partida al servidor. */
window.sendProgressToServer = async function (record) {
  if (!serverEnabled()) return;
  try {
    const res = await fetch(CONFIG.API_URL.replace(/\/$/, '') + '/save', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(record),
    });
    const data = await res.json();
    console.log('💾 Partida guardada en el servidor:', data);
  } catch (e) {
    console.warn('⚠️ No se pudo guardar en el servidor.', e);
  }
};

/* Pedir una tirada de dado al servidor (anti-trampas). Devuelve null si falla. */
window.serverRoll = async function () {
  if (!serverEnabled() || !CONFIG.USE_SERVER_DICE) return null;
  try {
    const res = await fetch(CONFIG.API_URL.replace(/\/$/, '') + '/roll');
    const data = await res.json();
    return data.value;
  } catch (e) {
    return null; // fallback a tirada local
  }
};

/* Obtener el ranking global. */
window.fetchRanking = async function () {
  if (!serverEnabled()) return null;
  try {
    const res = await fetch(CONFIG.API_URL.replace(/\/$/, '') + '/ranking');
    return await res.json();
  } catch (e) {
    return null;
  }
};

// Comprobar servidor al cargar
window.addEventListener('load', pingServer);
