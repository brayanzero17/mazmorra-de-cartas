/* =====================================================================
   MAZMORRA DE CARTAS — Configuración del cliente
   ---------------------------------------------------------------------
   Cambia API_URL por la URL que te da ngrok en Google Colab.
   Si la dejas vacía (''), el juego funciona 100% offline con
   guardado local (localStorage). ¡Ideal para probar sin servidor!
   ===================================================================== */

const CONFIG = {
  // Pega aquí la URL de ngrok, ej: 'https://abcd-1234.ngrok-free.app'
  API_URL: '',

  // Si es true, el dado se pide al servidor (anti-trampas).
  // Si es false o no hay API_URL, se tira localmente.
  USE_SERVER_DICE: false,
};
