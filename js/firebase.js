/* =====================================================================
   MAZMORRA DE CARTAS — Integración con Firebase (opcional)
   ---------------------------------------------------------------------
   Añade login (Auth anónimo) y ranking persistente (Firestore).
   Es OPCIONAL: si no configuras las claves abajo, el juego sigue
   funcionando en modo offline con localStorage.

   ╔═══════════════════════════════════════════════════════════════╗
   ║ CÓMO CONFIGURARLO:                                            ║
   ║ 1. Ve a https://console.firebase.google.com                   ║
   ║ 2. Crea un proyecto nuevo (gratis).                           ║
   ║ 3. Agrega una app Web (</>) y copia el objeto firebaseConfig. ║
   ║ 4. Pégalo abajo en FIREBASE_CONFIG.                           ║
   ║ 5. En "Authentication" activa el proveedor "Anónimo".         ║
   ║ 6. En "Firestore Database" crea la base en modo de prueba.    ║
   ║ 7. Descomenta las etiquetas <script> de Firebase en index.html║
   ╚═══════════════════════════════════════════════════════════════╝
   ===================================================================== */

/* Pega aquí tu configuración de Firebase (o déjala vacía para offline). */
const FIREBASE_CONFIG = {
  // apiKey: "...",
  // authDomain: "tu-proyecto.firebaseapp.com",
  // projectId: "tu-proyecto",
  // storageBucket: "tu-proyecto.appspot.com",
  // messagingSenderId: "...",
  // appId: "..."
};

let _db   = null;
let _auth = null;
let _firebaseReady = false;

/* Inicializa Firebase sólo si hay config y el SDK está cargado. */
function initFirebase() {
  const hasConfig = FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey;
  const hasSDK    = typeof firebase !== 'undefined';

  if (!hasConfig || !hasSDK) {
    console.log('🔥 Firebase no configurado: se usa guardado local.');
    return;
  }

  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    _auth = firebase.auth();
    _db   = firebase.firestore();

    // Login anónimo automático (no requiere que el usuario cree cuenta).
    _auth.signInAnonymously()
      .then(() => { _firebaseReady = true; console.log('✅ Firebase listo (login anónimo).'); })
      .catch(err => console.warn('⚠️ Error en login anónimo:', err));
  } catch (e) {
    console.warn('⚠️ No se pudo iniciar Firebase:', e);
  }
}

/* Guarda una partida en Firestore (colección "partidas"). */
async function saveToFirestore(record) {
  if (!_firebaseReady || !_db) return false;
  try {
    const uid = _auth.currentUser ? _auth.currentUser.uid : 'anon';
    const score = record.room * 100 + record.level * 10;
    await _db.collection('partidas').add({
      ...record,
      uid,
      score,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    console.log('🔥 Partida guardada en Firestore.');
    return true;
  } catch (e) {
    console.warn('⚠️ No se pudo guardar en Firestore:', e);
    return false;
  }
}

/* Obtiene el top 10 del ranking global desde Firestore. */
async function fetchFirestoreRanking() {
  if (!_firebaseReady || !_db) return null;
  try {
    const snap = await _db.collection('partidas')
      .orderBy('score', 'desc')
      .limit(10)
      .get();
    return snap.docs.map(d => d.data());
  } catch (e) {
    console.warn('⚠️ No se pudo leer el ranking:', e);
    return null;
  }
}

/* ─── Enganchar con saveProgress de ui.js ─────────────────────────────
   Envolvemos sendProgressToServer para que además guarde en Firestore. */
const _prevSender = window.sendProgressToServer;
window.sendProgressToServer = function (record) {
  if (typeof _prevSender === 'function') _prevSender(record); // servidor Flask
  saveToFirestore(record);                                     // Firebase
};

window.addEventListener('load', initFirebase);
