/* =====================================================================
   MAZMORRA DE CARTAS — Lógica del juego (motor PvE)
   Maneja estado, dado, combate por turnos y progresión de salas.
   La UI (ui.js) lee este estado y dibuja. game.js NO toca el DOM
   directamente salvo llamando a funciones render* de ui.js.
   ===================================================================== */

/* ──────────────────────────── Estado global ────────────────────────── */
const state = {
  playerName: '',
  classId:    null,
  classData:  null,

  hp:      0,
  maxHp:   0,
  block:   0,        // defensa acumulada este turno
  buff:    0,        // daño extra próximo ataque
  dodge:   false,    // esquiva el próximo golpe

  room:    1,        // sala actual (1..TOTAL_ROOMS)
  level:   1,

  enemy:   null,     // { name, sprite, hp, maxHp, minAtk, maxAtk, nextAtk, frozen, poison }

  dice:        null, // último valor tirado
  hasRolled:   false,
  canPlay:     false,
  turnOver:    false,
  cardsPlayed: 0,    // cartas jugadas este turno (límite 1 por tirada)
};

/* ──────────────────────────── Inicio de partida ────────────────────── */
function initGame(classId) {
  const cls = CLASSES[classId];
  state.classId   = classId;
  state.classData = cls;
  state.hp        = cls.maxHp;
  state.maxHp     = cls.maxHp;
  state.block     = 0;
  state.buff      = 0;
  state.dodge     = false;
  state.room      = 1;
  state.level     = 1;

  spawnEnemy(1);
  resetTurn();
  clearLog();
  logMsg(`⚔️ ${state.playerName} el ${cls.name} entra en la mazmorra...`, 'info');
  logMsg(`Sala 1: ¡Aparece un ${state.enemy.name}!`, 'info');

  showScreen('screen-game');
  renderAll();
}

/* ──────────────────────────── Crear enemigo ────────────────────────── */
function spawnEnemy(roomNum) {
  const base = ENEMIES[roomNum - 1];
  state.enemy = {
    name:   base.name,
    sprite: base.sprite,
    spriteKey: base.spriteKey,
    hp:     base.hp,
    maxHp:  base.hp,
    minAtk: base.minAtk,
    maxAtk: base.maxAtk,
    nextAtk: 0,
    frozen:  false,
    poison:  0,
  };
  telegraphEnemy();
}

/* Decide cuánto atacará el enemigo el próximo turno (para telegrafiar). */
function telegraphEnemy() {
  const e = state.enemy;
  e.nextAtk = randInt(e.minAtk, e.maxAtk);
}

/* ──────────────────────────── Turno / dado ─────────────────────────── */
function resetTurn() {
  state.dice        = null;
  state.hasRolled   = false;
  state.canPlay     = false;
  state.turnOver    = false;
  state.cardsPlayed = 0;
  state.block       = 0;
}

function doRollDice() {
  if (state.hasRolled) return null;
  const value = randInt(1, 6);
  state.dice      = value;
  state.hasRolled = true;
  state.canPlay   = true;
  logMsg(`🎲 Lanzaste el dado: <b>${value}</b>`, 'info');
  return value;
}

/* ──────────────────────────── Jugar una carta ──────────────────────── */
/* Devuelve { ok, reason } para que la UI muestre feedback.              */
function playCard(cardId) {
  if (!state.canPlay)  return { ok:false, reason:'Primero lanza el dado.' };
  if (state.turnOver)  return { ok:false, reason:'El turno terminó.' };

  const card = state.classData.cards.find(c => c.id === cardId);
  if (!card) return { ok:false, reason:'Carta no encontrada.' };

  if (!meetsDiceReq(card.diceReq, state.dice)) {
    return { ok:false, reason:`No puedes jugar "${card.name}" con un dado de ${state.dice}.` };
  }

  // Ejecutar efecto
  const result = card.calc(state.dice);
  applyCardEffect(card, result);

  // Sólo se juega 1 carta por tirada → termina la fase del jugador
  state.canPlay = false;

  // ¿Enemigo muerto?
  if (state.enemy.hp <= 0) {
    onEnemyDefeated();
    return { ok:true, killed:true };
  }

  // Turno del enemigo
  enemyTurn();
  return { ok:true, killed:false };
}

function applyCardEffect(card, r) {
  const e = state.enemy;

  if (r.dmg != null) {
    let dmg = r.dmg + state.buff;
    if (state.buff) { logMsg(`Bonus de furia: +${state.buff} daño`, 'special'); state.buff = 0; }
    e.hp = Math.max(0, e.hp - dmg);
    logMsg(`${card.icon} ${card.name}: ${dmg} de daño a ${e.name}.`, 'damage');
  }
  if (r.heal != null) {
    const before = state.hp;
    state.hp = Math.min(state.maxHp, state.hp + r.heal);
    logMsg(`${card.icon} ${card.name}: te curas ${state.hp - before} HP.`, 'heal');
  }
  if (r.block != null) {
    state.block += r.block;
    logMsg(`${card.icon} ${card.name}: +${r.block} de defensa.`, 'special');
  }
  if (r.buff != null) { state.buff += r.buff; logMsg(`¡Furia! próximo ataque +${r.buff}.`, 'special'); }
  if (r.dodge)  { state.dodge = true;  logMsg('Te preparas para esquivar.', 'special'); }
  if (r.freeze) { e.frozen = true;     logMsg(`❄️ ${e.name} queda congelado y perderá su turno.`, 'special'); }
  if (r.poison) { e.poison = r.poison; e.poisonTurns = 2; logMsg(`🧪 ${e.name} envenenado (${r.poison}/turno).`, 'special'); }
}

/* ──────────────────────────── Turno enemigo ────────────────────────── */
function enemyTurn() {
  const e = state.enemy;

  // Veneno actúa al inicio del turno enemigo (dura 2 turnos y luego se disipa)
  if (e.poison > 0) {
    e.hp = Math.max(0, e.hp - e.poison);
    logMsg(`🧪 El veneno hace ${e.poison} de daño a ${e.name}.`, 'damage');
    e.poisonTurns = (e.poisonTurns || 2) - 1;
    if (e.poisonTurns <= 0) { e.poison = 0; }
    if (e.hp <= 0) { onEnemyDefeated(); return; }
  }

  if (e.frozen) {
    logMsg(`❄️ ${e.name} está congelado y no puede atacar.`, 'info');
    e.frozen = false;
  } else {
    let dmg = e.nextAtk;
    if (state.dodge) {
      logMsg(`💨 ¡Esquivaste el ataque de ${e.name}!`, 'special');
      state.dodge = false;
    } else {
      const blocked = Math.min(state.block, dmg);
      dmg -= blocked;
      if (blocked > 0) logMsg(`🛡️ Tu defensa absorbe ${blocked} de daño.`, 'special');
      state.hp = Math.max(0, state.hp - dmg);
      logMsg(`💢 ${e.name} te ataca por ${dmg} de daño.`, 'enemy-atk');
    }
  }

  // Preparar siguiente turno
  if (state.hp <= 0) { onPlayerDefeated(); return; }
  resetTurn();
  telegraphEnemy();
  renderAll();
}

/* ──────────────────────────── Enemigo derrotado ────────────────────── */
function onEnemyDefeated() {
  logMsg(`🏆 ¡Derrotaste al ${state.enemy.name}!`, 'special');
  state.level += 1;

  if (state.room >= TOTAL_ROOMS) {
    onVictory();
  } else {
    state.turnOver = true;
    // Curación entre salas
    const healAmt = Math.round(state.maxHp * 0.25);
    state.hp = Math.min(state.maxHp, state.hp + healAmt);
    logMsg(`💚 Descansas y recuperas ${healAmt} HP.`, 'heal');
    renderAll();
    showNextRoomButton();
  }
}

function goNextRoom() {
  state.room += 1;
  spawnEnemy(state.room);
  resetTurn();
  logMsg(`🚪 Sala ${state.room}: ¡Aparece un ${state.enemy.name}!`, 'info');
  hideNextRoomButton();
  renderAll();
}

/* ──────────────────────────── Fin de partida ───────────────────────── */
function onPlayerDefeated() {
  logMsg('💀 Has sido derrotado...', 'damage');
  saveProgress('defeat');
  renderGameOver();
  showScreen('screen-gameover');
}

function onVictory() {
  logMsg('👑 ¡Has conquistado la mazmorra entera!', 'special');
  saveProgress('victory');
  renderVictory();
  showScreen('screen-victory');
}

/* ──────────────────────────── Utilidades ───────────────────────────── */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
