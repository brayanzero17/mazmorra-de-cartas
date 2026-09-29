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
  document.getElementById('hud-avatar').textContent     = state.classData.icon;
  document.getElementById('hud-name').textContent        = state.playerName;
  document.getElementById('hud-class-name').textContent  = state.classData.name;

  const hpPct = Math.max(0, (state.hp / state.maxHp) * 100);
  document.getElementById('bar-hp').style.width = hpPct + '%';
  document.getElementById('txt-hp').textContent = `${state.hp}/${state.maxHp}`;

  document.getElementById('txt-room').textContent  = `${state.room}/${TOTAL_ROOMS}`;
  document.getElementById('txt-level').textContent = state.level;
}

function renderEnemy() {
  const e = state.enemy;
  document.getElementById('enemy-sprite').textContent = e.sprite;
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
  const res = playCard(cardId);
  if (!res.ok) {
    document.getElementById('roll-msg').textContent = '⚠️ ' + res.reason;
    return;
  }
  document.getElementById('roll-msg').textContent = '';
  renderAll();
}

/* ──────────────────────────── Botón siguiente sala ─────────────────── */
function showNextRoomButton() { document.getElementById('next-room-btn').classList.remove('hidden'); }
function hideNextRoomButton() { document.getElementById('next-room-btn').classList.add('hidden'); }
function nextRoom() { goNextRoom(); }

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
