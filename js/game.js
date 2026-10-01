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

  // ─── MOCHILA ───
  // bag: objetos guardados (máx 5). Cada entrada: { itemId, equipped }
  // Los equipables se EQUIPAN desde la mochila; los consumibles se USAN.
  bag:    [],
  BAG_MAX: 5,
  currentEnemyRef: null, // referencia al enemigo de exploración en combate

  // Hombre Lobo: daño acumulado recibido (rencor), hasta 3 golpes.
  rencor: 0,
  rencorHits: 0,
};

/* ──────────────────────────── Mochila: bonos ───────────────────────── */
/* Los bonos vienen de los objetos EQUIPADOS dentro de la mochila. */
function equippedItems() {
  return state.bag.filter(e => e.equipped).map(e => ITEMS[e.itemId]).filter(Boolean);
}
function equipBonus(kind) {
  return equippedItems().reduce((sum, it) => sum + (it[kind] || 0), 0);
}
function bonusAttack()   { return equipBonus('attack'); }
function bonusDefense()  { return equipBonus('defense'); }
function bonusDice()     { return equipBonus('diceBonus'); }
function bonusMaxHp()    { return equipBonus('maxHpBonus'); }

/* Recalcula el HP máximo según los bonos de vida equipados. */
function recalcMaxHp() {
  const prevMax = state.maxHp;
  state.maxHp = state.classData.maxHp + bonusMaxHp();
  if (state.maxHp > prevMax) state.hp += (state.maxHp - prevMax); // ganar vida máx cura esa cantidad
  state.hp = Math.min(state.hp, state.maxHp);
}

/* ──────────────────────────── Mochila: acciones ────────────────────── */
/* Intenta meter un objeto en la mochila.
   - Si hay espacio → entra y se avisa a la UI.
   - Si está llena → devuelve false para que la UI pregunte qué botar. */
function bagIsFull() { return state.bag.length >= state.BAG_MAX; }

function addToBag(itemId) {
  if (bagIsFull()) return false;
  state.bag.push({ itemId, equipped: false });
  const it = ITEMS[itemId];
  logMsg(`🎒 Recogiste ${it.icon} ${it.name}.`, 'special');
  refreshInventoryUI();
  return true;
}

/* Bota (descarta) un objeto de la mochila por índice. */
function discardFromBag(index) {
  const entry = state.bag[index];
  if (!entry) return;
  const it = ITEMS[entry.itemId];
  state.bag.splice(index, 1);
  logMsg(`🗑️ Botaste ${it.name}.`, 'info');
  recalcMaxHp();
  refreshInventoryUI();
}

/* Equipa o desequipa un objeto de la mochila (solo equipables).
   Al equipar uno, desequipa el que ocupaba su misma ranura. */
function toggleEquip(index) {
  const entry = state.bag[index];
  if (!entry) return;
  const it = ITEMS[entry.itemId];
  if (!it.slot) return; // consumible: no se equipa

  if (entry.equipped) {
    entry.equipped = false;
    logMsg(`Guardaste ${it.name}.`, 'info');
  } else {
    // Desequipar cualquier otro de la misma ranura
    state.bag.forEach(e => { if (e.equipped && ITEMS[e.itemId].slot === it.slot) e.equipped = false; });
    entry.equipped = true;
    logMsg(`${it.icon} Equipaste ${it.name}.`, 'special');
    if (typeof sfx === 'function') sfx('special');
  }
  recalcMaxHp();
  refreshInventoryUI();
}

/* Usa un consumible de la mochila (pociones). El jugador decide cuándo. */
function useConsumable(index) {
  const entry = state.bag[index];
  if (!entry) return;
  const it = ITEMS[entry.itemId];
  if (it.type !== 'consumable') return;

  if (state.hp >= state.maxHp) {
    logMsg('Ya tienes la vida al máximo.', 'info');
    return;
  }
  const before = state.hp;
  if (it.healFull) state.hp = state.maxHp;
  else if (it.heal) state.hp = Math.min(state.maxHp, state.hp + it.heal);
  logMsg(`${it.icon} Usaste ${it.name}: +${state.hp - before} HP.`, 'heal');
  if (typeof sfx === 'function') sfx('heal');

  state.bag.splice(index, 1); // se consume
  refreshInventoryUI();
}

/* Refresca toda la UI que muestra inventario/HP (según la pantalla). */
function refreshInventoryUI() {
  if (typeof renderBag === 'function')          renderBag();
  if (typeof renderExploreHUD === 'function')   renderExploreHUD();
  if (typeof renderAll === 'function' && document.getElementById('screen-game').classList.contains('active')) renderAll();
}

/* Punto de entrada al recoger un cofre. Devuelve el itemId si la mochila
   está llena (para que la UI muestre el diálogo de descartar). */
function acquireItem(itemId) {
  if (addToBag(itemId)) return null;   // entró bien
  return itemId;                       // mochila llena → la UI decide
}

/* ──────────────────────────── Inicio de partida ────────────────────── */
function initGame(classId) {
  // Detener cualquier bucle de exploración anterior (evita que un mapa
  // viejo siga corriendo al reiniciar la partida con otra clase).
  if (typeof EXPLORE !== 'undefined') EXPLORE.stop();
  hideNextRoomButton();

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
  state.bag       = [];
  state.currentEnemyRef = null;
  state.rencor      = 0;
  state.rencorHits  = 0;

  clearLog();
  logMsg(`⚔️ ${state.playerName} el ${cls.name} entra en la mazmorra...`, 'info');

  // Arranca en modo EXPLORACIÓN (no directo al combate)
  startExploration(1);
}

/* ──────────────────────────── Exploración ──────────────────────────── */
function startExploration(roomNum) {
  state.room = roomNum;
  if (typeof enterExploreScreen === 'function') {
    enterExploreScreen(roomNum);
  } else {
    // Fallback: si no hay modo exploración, combate directo
    spawnEnemy(roomNum);
    resetTurn();
    showScreen('screen-game');
    renderAll();
  }
}

/* Llamado cuando el jugador choca con un enemigo en la exploración. */
function startCombatFromEncounter(enemyRef) {
  state.currentEnemyRef = enemyRef || null;
  // El enemigo del combate corresponde a la sala actual
  spawnEnemy(state.room);
  resetTurn();
  logMsg(`⚔️ ¡Combate contra ${state.enemy.name}!`, 'info');
  showScreen('screen-game');
  renderAll();
}

/* ──────────────────────────── Crear enemigo ────────────────────────── */
function spawnEnemy(roomNum) {
  const base = ENEMIES[roomNum - 1];
  const theme = (typeof roomTheme === 'function') ? roomTheme(roomNum) : null;
  const isBoss = theme && theme.boss;

  state.enemy = {
    name:   isBoss ? `${base.name} (JEFE)` : base.name,
    sprite: base.sprite,
    spriteKey: base.spriteKey,
    hp:     base.hp,
    maxHp:  base.hp,
    minAtk: base.minAtk,
    maxAtk: base.maxAtk,
    nextAtk: 0,
    frozen:  false,
    poison:  0,
    isBoss:  !!isBoss,
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
  sfx('dice');
  let value = randInt(1, 6);
  const db = bonusDice();
  if (db) { value = Math.min(6, value + db); }   // reliquia: +dado (tope 6)
  state.dice      = value;
  state.hasRolled = true;
  state.canPlay   = true;
  logMsg(`🎲 Lanzaste el dado: <b>${value}</b>${db ? ` (incluye +${db} de reliquia)` : ''}`, 'info');
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
    let dmg = r.dmg + state.buff + bonusAttack();  // + bonus del arma equipada
    if (state.buff) { logMsg(`Bonus de furia: +${state.buff} daño`, 'special'); state.buff = 0; }
    // Hombre Lobo: Zarpazo Vengador suma el rencor acumulado
    if (r.useRencor) {
      if (state.rencor > 0) {
        dmg += state.rencor;
        logMsg(`🐺 ¡Devuelves ${state.rencor} de rencor acumulado!`, 'special');
      } else {
        logMsg(`🐺 No tienes rencor acumulado todavía.`, 'info');
      }
      state.rencor = 0; state.rencorHits = 0;   // se descarga
      if (typeof renderAll === 'function') renderAll();
    }
    e.hp = Math.max(0, e.hp - dmg);
    logMsg(`${card.icon} ${card.name}: ${dmg} de daño a ${e.name}.`, 'damage');
    sfx('playerAttack'); sfx('hitEnemy');
  }
  // Demonio: Pacto Oscuro sacrifica vida propia
  if (r.selfDmg) {
    state.hp = Math.max(1, state.hp - r.selfDmg);  // no te mata a ti mismo (mín 1)
    logMsg(`🔥 Sacrificas ${r.selfDmg} HP por el poder.`, 'damage');
    if (typeof fxPlayerHit === 'function') fxPlayerHit();
  }
  if (r.heal != null) {
    const before = state.hp;
    state.hp = Math.min(state.maxHp, state.hp + r.heal);
    logMsg(`${card.icon} ${card.name}: te curas ${state.hp - before} HP.`, 'heal');
    sfx('heal');
  }
  if (r.block != null) {
    state.block += r.block;
    logMsg(`${card.icon} ${card.name}: +${r.block} de defensa.`, 'special');
    sfx('block');
  }
  if (r.buff != null) { state.buff += r.buff; logMsg(`¡Furia! próximo ataque +${r.buff}.`, 'special'); sfx('special'); }
  if (r.dodge)  { state.dodge = true;  logMsg('Te preparas para esquivar.', 'special'); sfx('special'); }
  if (r.freeze) { e.frozen = true;     logMsg(`❄️ ${e.name} queda congelado y perderá su turno.`, 'special'); sfx('special'); }
  if (r.poison) { e.poison = r.poison; e.poisonTurns = 2; logMsg(`🧪 ${e.name} envenenado (${r.poison}/turno).`, 'special'); sfx('special'); }
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
      const armor = bonusDefense();               // reducción fija de la armadura
      const blocked = Math.min(state.block + armor, dmg);
      dmg -= blocked;
      if (blocked > 0) logMsg(`🛡️ Tu defensa absorbe ${blocked} de daño.`, 'special');
      state.hp = Math.max(0, state.hp - dmg);
      logMsg(`💢 ${e.name} te ataca por ${dmg} de daño.`, 'enemy-atk');
      if (dmg > 0) { sfx('playerHurt'); if (typeof fxEnemyAttack === 'function') fxEnemyAttack(); }

      // Hombre Lobo: acumula el daño recibido como RENCOR (hasta 3 golpes)
      if (state.classId === 'werewolf' && dmg > 0 && state.rencorHits < 3) {
        state.rencor += dmg;
        state.rencorHits += 1;
        logMsg(`🐺 Rencor acumulado: ${state.rencor} (${state.rencorHits}/3 golpes).`, 'special');
      }
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
  sfx('enemyDown');
  state.level += 1;
  state.turnOver = true;

  // ¿Era el JEFE FINAL? → victoria inmediata (no "volver a explorar")
  if (state.enemy.isBoss) {
    onVictory();
    return;
  }

  // Pequeña curación tras la pelea
  const healAmt = Math.round(state.maxHp * 0.15);
  state.hp = Math.min(state.maxHp, state.hp + healAmt);
  logMsg(`💚 Recuperas ${healAmt} HP tras la batalla.`, 'heal');
  renderAll();

  // Volver a la exploración y marcar ese enemigo como derrotado
  showNextRoomButton();  // el botón ahora dice "volver a explorar"
}

/* Vuelve al mapa de exploración tras ganar un combate. */
function goNextRoom() {
  hideNextRoomButton();

  // Sin modo exploración: avanzar de sala como antes (fallback)
  if (typeof EXPLORE === 'undefined' || typeof enterExploreScreen !== 'function') {
    if (state.room >= TOTAL_ROOMS) { onVictory(); return; }
    state.room += 1;
    spawnEnemy(state.room);
    resetTurn();
    renderAll();
    return;
  }

  // Marcar como derrotado al enemigo con el que peleamos
  if (state.currentEnemyRef) {
    EXPLORE.defeatEnemy(state.currentEnemyRef);
    state.currentEnemyRef = null;
  }

  // Volver al mapa de la MISMA sala y REANUDAR el bucle de animación.
  // (importante: mostrar la pantalla ANTES de start para que el canvas
  //  esté visible y requestAnimationFrame corra con normalidad)
  showScreen('screen-explore');
  renderExploreHUD();
  EXPLORE.resume();
}

/* Llamado por el modo exploración cuando el jugador cruza la salida. */
function onRoomCleared() {
  if (state.room >= TOTAL_ROOMS) {
    onVictory();
  } else {
    logMsg(`🚪 Avanzas a la sala ${state.room + 1}...`, 'info');
    startExploration(state.room + 1);
  }
}

/* ──────────────────────────── Fin de partida ───────────────────────── */
function onPlayerDefeated() {
  logMsg('💀 Has sido derrotado...', 'damage');
  sfx('defeat');
  if (typeof EXPLORE !== 'undefined') EXPLORE.stop();  // detener el mapa
  hideNextRoomButton();
  state.currentEnemyRef = null;
  saveProgress('defeat');
  renderGameOver();
  showScreen('screen-gameover');
}

function onVictory() {
  logMsg('👑 ¡Has conquistado la mazmorra entera!', 'special');
  sfx('victory');
  if (typeof EXPLORE !== 'undefined') EXPLORE.stop();  // detener el mapa
  hideNextRoomButton();
  state.currentEnemyRef = null;
  saveProgress('victory');
  renderVictory();
  showScreen('screen-victory');
}

/* ──────────────────────────── Utilidades ───────────────────────────── */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* Reproduce un efecto de sonido de forma segura (no rompe si audio.js
   no está cargado o el navegador bloquea el audio). */
function sfx(name) {
  try { if (typeof SFX !== 'undefined' && SFX[name]) SFX[name](); }
  catch (e) { /* silencio */ }
}
