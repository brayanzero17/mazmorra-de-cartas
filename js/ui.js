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
    EXPLORE.onPickup    = (itemId) => {
      const overflow = acquireItem(itemId);        // null si entró; itemId si mochila llena
      if (overflow) openFullBagDialog(overflow);   // preguntar qué botar
      renderExploreHUD();
    };
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
  renderBagMini();
}

/* ──────────────────────────── MOCHILA (UI) ─────────────────────────── */

/* Mini-indicador de mochila en el HUD (muestra cuántos objetos / 5). */
function renderBagMini() {
  const cont = document.getElementById('exp-equip');
  if (!cont) return;
  const count = state.bag.length;
  const slots = [];
  for (let i = 0; i < state.BAG_MAX; i++) {
    const entry = state.bag[i];
    if (entry) {
      const it = ITEMS[entry.itemId];
      slots.push(`<span class="bag-mini-slot ${entry.equipped?'eq':''}" title="${it.name}">${it.icon}</span>`);
    } else {
      slots.push(`<span class="bag-mini-slot empty">·</span>`);
    }
  }
  cont.innerHTML = `<button class="bag-btn" onclick="openBag()">🎒 ${count}/${state.BAG_MAX}</button>` + slots.join('');
}

/* Abre el panel grande de la mochila. */
function openBag() {
  renderBag();
  document.getElementById('bag-modal').classList.remove('hidden');
}
function closeBag() {
  document.getElementById('bag-modal').classList.add('hidden');
}

/* Dibuja el contenido de la mochila (objetos con descripción y acciones). */
function renderBag() {
  const list = document.getElementById('bag-list');
  if (!list) return;
  if (state.bag.length === 0) {
    list.innerHTML = `<p class="bag-empty">La mochila está vacía. Abre cofres 📦 para encontrar objetos.</p>`;
    return;
  }
  const typeLabel = { consumable:'Poción', weapon:'Arma', armor:'Armadura', relic:'Reliquia' };
  list.innerHTML = state.bag.map((entry, i) => {
    const it = ITEMS[entry.itemId];
    const isConsumable = it.type === 'consumable';
    const actionBtn = isConsumable
      ? `<button class="bag-action use" onclick="bagUse(${i})">Usar</button>`
      : `<button class="bag-action equip" onclick="bagEquip(${i})">${entry.equipped?'Quitar':'Equipar'}</button>`;
    return `
      <div class="bag-item ${entry.equipped?'equipped':''}">
        <div class="bag-item-icon">${it.icon}</div>
        <div class="bag-item-info">
          <div class="bag-item-name">${it.name} ${entry.equipped?'<span class="eq-tag">EQUIPADO</span>':''}</div>
          <div class="bag-item-type">${typeLabel[it.type]||''}</div>
          <div class="bag-item-desc">${it.desc}</div>
        </div>
        <div class="bag-item-actions">
          ${actionBtn}
          <button class="bag-action drop" onclick="bagDrop(${i})">🗑️ Botar</button>
        </div>
      </div>`;
  }).join('');
}

function bagUse(i)   { useConsumable(i); renderBag(); }
function bagEquip(i) { toggleEquip(i);   renderBag(); }
function bagDrop(i)  { discardFromBag(i); renderBag(); }

/* Diálogo cuando la mochila está llena: elegir qué botar o dejar el nuevo. */
function openFullBagDialog(newItemId) {
  const it = ITEMS[newItemId];
  const modal = document.getElementById('fullbag-modal');
  const body  = document.getElementById('fullbag-body');
  body.innerHTML = `
    <p class="fullbag-intro">Encontraste <b>${it.icon} ${it.name}</b><br><span class="fullbag-desc">${it.desc}</span></p>
    <p class="fullbag-q">Tu mochila está llena (5/5). ¿Qué objeto botas para quedarte con el nuevo?</p>
    <div class="fullbag-list">
      ${state.bag.map((entry, i) => {
        const old = ITEMS[entry.itemId];
        return `<button class="fullbag-opt" onclick="fullBagSwap(${i}, '${newItemId}')">
                  <span>${old.icon} ${old.name}</span>
                  <small>${old.desc}</small>
                </button>`;
      }).join('')}
    </div>
    <button class="btn-primary fullbag-skip" onclick="fullBagSkip()">Dejar el nuevo (no tomarlo)</button>
  `;
  modal.classList.remove('hidden');
}
function fullBagSwap(index, newItemId) {
  discardFromBag(index);
  addToBag(newItemId);
  document.getElementById('fullbag-modal').classList.add('hidden');
}
function fullBagSkip() {
  document.getElementById('fullbag-modal').classList.add('hidden');
  logMsg('Dejaste el objeto en el cofre.', 'info');
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
