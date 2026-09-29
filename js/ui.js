/* =====================================================================
   MAZMORRA DE CARTAS — Capa de interfaz (DOM)
   Conecta el motor (game.js) con la pantalla. Aquí viven los
   render*, los handlers de botones y la navegación entre pantallas.
   ===================================================================== */

/* ──────────────────────────── Navegación ───────────────────────────── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

/* ──────────────────────────── Login ────────────────────────────────── */
function startGame() {
  const name = document.getElementById('login-name').value.trim();
  if (!name) { alert('Escribe tu nombre de aventurero.'); return; }
  state.playerName = name;
  renderClassSelection();
  showScreen('screen-class');
}

/* ──────────────────────────── Selección de clase ───────────────────── */
function renderClassSelection() {
  const grid = document.getElementById('class-grid');
  grid.innerHTML = '';
  Object.values(CLASSES).forEach(cls => {
    const card = document.createElement('div');
    card.className = `class-card ${cls.id}`;
    card.onclick = () => initGame(cls.id);
    card.innerHTML = `
      <div class="class-icon">${cls.icon}</div>
      <div class="class-name">${cls.name}</div>
      <div class="class-style">${cls.style}</div>
      <div class="class-dice">🎲 ${cls.diceHint}</div>
      <div class="class-desc">${cls.desc}</div>
      <div class="class-dice" style="margin-top:.6rem;">❤️ ${cls.maxHp} HP · ${cls.cards.length} cartas</div>
    `;
    grid.appendChild(card);
  });
}

/* ──────────────────────────── Render principal ─────────────────────── */
function renderAll() {
  renderHUD();
  renderEnemy();
  renderDice();
  renderHand();
}

function renderHUD() {
  const hpPct = Math.max(0, (state.hp / state.maxHp) * 100);

  // Cara DOOM del jugador: canvas pixel art que cambia con la vida.
  const avatar = document.getElementById('hud-avatar');
  if (typeof makePlayerFace === 'function') {
    const face = makePlayerFace(hpPct, state.classId);
    avatar.innerHTML = '';
    avatar.appendChild(face);
  } else {
    avatar.textContent = state.classData.icon; // fallback
  }

  document.getElementById('hud-name').textContent        = state.playerName;
  document.getElementById('hud-class-name').textContent  = state.classData.name;

  document.getElementById('bar-hp').style.width = hpPct + '%';
  document.getElementById('txt-hp').textContent = `${state.hp}/${state.maxHp}`;

  document.getElementById('txt-room').textContent  = `${state.room}/${TOTAL_ROOMS}`;
  document.getElementById('txt-level').textContent = state.level;
}

function renderEnemy() {
  const e = state.enemy;

  // Sprite pixel art del enemigo (canvas). Fallback a emoji si falla.
  const spriteEl = document.getElementById('enemy-sprite');
  let canvas = null;
  if (typeof makeEnemySprite === 'function' && e.spriteKey) {
    canvas = makeEnemySprite(e.spriteKey);
  }
  if (canvas) {
    spriteEl.innerHTML = '';
    spriteEl.appendChild(canvas);
  } else {
    spriteEl.textContent = e.sprite;
  }

  document.getElementById('enemy-name').textContent   = e.name;
  const pct = Math.max(0, (e.hp / e.maxHp) * 100);
  document.getElementById('bar-enemy').style.width = pct + '%';
  document.getElementById('txt-enemy-hp').textContent = `${e.hp}/${e.maxHp}`;

  const intent = document.getElementById('enemy-intent');
  if (e.frozen) {
    intent.textContent = '❄️ Congelado (pierde el turno)';
  } else {
    intent.textContent = `💢 Atacará: ${e.nextAtk} daño`;
  }
}

function renderDice() {
  const faceEl  = document.getElementById('dice-result');
  const valEl   = document.getElementById('dice-value');
  const btn     = document.getElementById('btn-roll');
  const phase   = document.getElementById('turn-phase');

  const faces = { 1:'⚀', 2:'⚁', 3:'⚂', 4:'⚃', 5:'⚄', 6:'⚅' };

  if (state.dice) {
    faceEl.textContent = faces[state.dice] || '🎲';
    valEl.textContent  = state.dice;
  } else {
    faceEl.textContent = '🎲';
    valEl.textContent  = '?';
  }

  btn.disabled = state.hasRolled || state.turnOver;

  if (state.turnOver)        phase.textContent = '✅ Sala completada';
  else if (!state.hasRolled) phase.textContent = 'Lanza el dado para comenzar tu turno';
  else if (state.canPlay)    phase.textContent = '🃏 Elige una carta que puedas jugar';
  else                       phase.textContent = 'Turno del enemigo...';
}

/* ──────────────────────────── Tirar dado (UI) ──────────────────────── */
function rollDice() {
  const value = doRollDice();
  if (value == null) return;

  const faceEl = document.getElementById('dice-result');
  faceEl.classList.add('rolling');

  // Pequeña animación: números aleatorios antes del resultado
  let ticks = 0;
  const faces = { 1:'⚀', 2:'⚁', 3:'⚂', 4:'⚃', 5:'⚄', 6:'⚅' };
  const spin = setInterval(() => {
    const r = randInt(1, 6);
    faceEl.textContent = faces[r];
    document.getElementById('dice-value').textContent = r;
    if (++ticks > 8) {
      clearInterval(spin);
      faceEl.classList.remove('rolling');
      document.getElementById('roll-msg').textContent = `¡Sacaste un ${value}!`;
      renderAll();
    }
  }, 60);
}

/* ──────────────────────────── Mano de cartas ───────────────────────── */
function renderHand() {
  const hand  = document.getElementById('hand-cards');
  const count = document.getElementById('hand-count');
  hand.innerHTML = '';

  const cards = state.classData.cards;
  count.textContent = cards.length;

  cards.forEach(card => {
    const playable = state.canPlay && meetsDiceReq(card.diceReq, state.dice);
    const reqOk    = state.hasRolled && meetsDiceReq(card.diceReq, state.dice);

    const el = document.createElement('div');
    el.className = 'card' + (playable ? ' playable' : '') + (state.canPlay && !playable ? ' disabled' : '');
    el.onclick = () => onCardClick(card.id);
    el.innerHTML = `
      <div class="card-class-icon">${card.icon}</div>
      <div class="card-name">${card.name}</div>
      <div class="card-effect">${card.effect}</div>
      <div class="card-req ${reqOk ? 'ok' : ''}">${reqLabel(card.diceReq)}</div>
    `;
    hand.appendChild(el);
  });
}

function onCardClick(cardId) {
  const hpBefore      = state.hp;
  const enemyHpBefore = state.enemy.hp;

  const res = playCard(cardId);
  if (!res.ok) {
    document.getElementById('roll-msg').textContent = '⚠️ ' + res.reason;
    return;
  }
  document.getElementById('roll-msg').textContent = '';

  // Efecto: el enemigo recibió daño → sacudida + sangre
  if (state.enemy.hp < enemyHpBefore) fxEnemyHit();
  // Efecto: el jugador recibió daño (contraataque) → flash rojo
  if (state.hp < hpBefore) fxPlayerHit();

  renderAll();
}

/* ─── Efectos visuales estilo DOOM ─────────────────────────────────── */
function fxPlayerHit() {
  const flash = document.getElementById('dmg-flash');
  if (!flash) return;
  flash.classList.remove('show');
  void flash.offsetWidth;      // reinicia la animación
  flash.classList.add('show');
}

function fxEnemyAttack() {
  const sprite = document.getElementById('enemy-sprite');
  if (!sprite) return;
  sprite.classList.remove('attack');
  void sprite.offsetWidth;      // reinicia la animación
  sprite.classList.add('attack');
  setTimeout(() => sprite.classList.remove('attack'), 500);
}

function fxEnemyHit() {
  const sprite = document.getElementById('enemy-sprite');
  if (!sprite) return;
  sprite.classList.remove('hit');
  void sprite.offsetWidth;
  sprite.classList.add('hit');

  // Salpicadura de sangre sobre el enemigo
  const splat = document.createElement('div');
  splat.className = 'blood-splat';
  splat.textContent = '🩸';
  splat.style.left = (30 + Math.random() * 60) + '%';
  splat.style.top  = (20 + Math.random() * 50) + '%';
  sprite.parentElement.style.position = 'relative';
  sprite.parentElement.appendChild(splat);
  setTimeout(() => splat.remove(), 600);
}

/* ──────────────────────────── Botón siguiente sala ─────────────────── */
function showNextRoomButton() { document.getElementById('next-room-btn').classList.remove('hidden'); }
function hideNextRoomButton() { document.getElementById('next-room-btn').classList.add('hidden'); }
function nextRoom() { goNextRoom(); }

/* ──────────────────────────── Exploración ──────────────────────────── */
let _exploreInit = false;

function enterExploreScreen(roomNum) {
  state.room = roomNum;   // sincroniza la sala actual con el HUD
  const canvas = document.getElementById('explore-canvas');

  // Inicializar el motor una sola vez
  if (!_exploreInit) {
    EXPLORE.init(canvas);
    EXPLORE.onEncounter = (enemyRef) => startCombatFromEncounter(enemyRef);
    EXPLORE.onExit      = () => onRoomCleared();
    EXPLORE.onPickup    = (itemId) => { acquireItem(itemId); renderExploreHUD(); };
    // Joystick táctil
    const pad = document.getElementById('joystick');
    const stick = document.getElementById('joystick-stick');
    if (pad && stick) EXPLORE.bindTouch(pad, stick);
    _exploreInit = true;
  }

  EXPLORE.buildRoom(roomNum, ENEMIES);
  renderExploreHUD();
  showScreen('screen-explore');
  EXPLORE.start();
}

function renderExploreHUD() {
  const hpPct = Math.max(0, (state.hp / state.maxHp) * 100);

  const avatar = document.getElementById('exp-avatar');
  if (typeof makePlayerFace === 'function') {
    avatar.innerHTML = '';
    avatar.appendChild(makePlayerFace(hpPct, state.classId));
  }
  document.getElementById('exp-name').textContent       = state.playerName;
  document.getElementById('exp-class-name').textContent = state.classData.name;
  document.getElementById('exp-bar-hp').style.width     = hpPct + '%';
  document.getElementById('exp-txt-hp').textContent     = `${state.hp}/${state.maxHp}`;
  document.getElementById('exp-room').textContent       = `${state.room}/${TOTAL_ROOMS}`;
  // Nombre temático de la sala
  const rn = document.getElementById('exp-room-name');
  if (rn && typeof roomTheme === 'function') {
    const th = roomTheme(state.room);
    rn.textContent = (th.boss ? '👑 ' : '🗺️ ') + th.name;
  }
  renderEquip();
}

/* Muestra los objetos equipados (armor/weapon/relic). */
function renderEquip() {
  const cont = document.getElementById('exp-equip');
  if (!cont) return;
  const slots = ['weapon','armor','relic'];
  const labels = { weapon:'⚔️', armor:'🛡️', relic:'💠' };
  cont.innerHTML = slots.map(s => {
    const it = state.equip[s];
    return `<span class="equip-slot" title="${it ? it.name+': '+it.desc : 'Vacío'}">${it ? it.icon : labels[s]}</span>`;
  }).join('');
}

/* ──────────────────────────── Sonido ───────────────────────────────── */
function toggleSound() {
  if (typeof SFX === 'undefined') return;
  const on = !SFX.isEnabled();
  SFX.toggle(on);
  const btn = document.getElementById('btn-sound');
  if (btn) btn.textContent = on ? '🔊' : '🔇';
  if (on) SFX.click();
}

/* ──────────────────────────── Battle log ───────────────────────────── */
function logMsg(text, cls = '') {
  const box = document.getElementById('log-content');
  const entry = document.createElement('div');
  entry.className = 'log-entry ' + cls;
  entry.innerHTML = text;
  box.appendChild(entry);
  box.scrollTop = box.scrollHeight;
}
function clearLog() { document.getElementById('log-content').innerHTML = ''; }

/* ──────────────────────────── Game Over / Victoria ─────────────────── */
function renderGameOver() {
  document.getElementById('gameover-msg').textContent =
    `Caíste en la sala ${state.room} frente al ${state.enemy.name}.`;
  document.getElementById('final-stats').innerHTML = `
    🏰 Salas superadas: <b>${state.room - 1}/${TOTAL_ROOMS}</b><br>
    ⭐ Nivel alcanzado: <b>${state.level}</b><br>
    🧝 Clase: <b>${state.classData.name}</b>
  `;
}

function renderVictory() {
  document.getElementById('victory-msg').textContent =
    `¡${state.playerName}, has vencido al ${state.enemy.name} y conquistado la mazmorra!`;
  document.getElementById('victory-stats').innerHTML = `
    🏰 Salas superadas: <b>${TOTAL_ROOMS}/${TOTAL_ROOMS}</b><br>
    ⭐ Nivel final: <b>${state.level}</b><br>
    ❤️ HP restante: <b>${state.hp}/${state.maxHp}</b><br>
    🧝 Clase: <b>${state.classData.name}</b>
  `;
}

function restartGame() {
  document.getElementById('roll-msg').textContent = '';
  // Asegurar que el mapa de exploración esté detenido antes de reiniciar
  if (typeof EXPLORE !== 'undefined') EXPLORE.stop();
  hideNextRoomButton();
  showScreen('screen-class');
  renderClassSelection();
}

/* ──────────────────────────── Guardado (placeholder) ───────────────── */
/* Se sobrescribe en firebase.js si Firebase está disponible.            */
function saveProgress(outcome) {
  const record = {
    name:    state.playerName,
    class:   state.classId,
    room:    state.room,
    level:   state.level,
    outcome: outcome,
    date:    new Date().toISOString(),
  };
  // Guardado local por defecto (funciona sin servidor).
  try {
    const hist = JSON.parse(localStorage.getItem('mazmorra_history') || '[]');
    hist.push(record);
    localStorage.setItem('mazmorra_history', JSON.stringify(hist));
  } catch (e) { /* almacenamiento no disponible */ }

  // Si hay backend/Firebase, enviarlo también.
  if (window.sendProgressToServer) {
    window.sendProgressToServer(record);
  }
}
