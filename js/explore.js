/* =====================================================================
   MAZMORRA DE CARTAS — Modo Exploración (top-down, movimiento libre)
   ---------------------------------------------------------------------
   Vista cenital en <canvas>. Movimiento libre en 8 direcciones
   (WASD / flechas / joystick táctil). Cada sala tiene su propia
   TEMÁTICA (colores, layout), enemigos que patrullan, cofres y una
   PUERTA de salida que se abre —de forma visible— al derrotar a todos
   los enemigos. La sala 5 es la ARENA DEL JEFE (Dragón).

   Al tocar un enemigo → combate de cartas (game.js).
   Al recoger un cofre → objeto (data.js).
   Al cruzar la salida (sala limpia) → siguiente sala / victoria.
   ===================================================================== */

const EXPLORE = (() => {
  const TILE = 40;
  const COLS = 16, ROWS = 11;
  const W = COLS * TILE, H = ROWS * TILE;

  let canvas, ctx;
  let raf = null, running = false;

  const player = { x: 0, y: 0, r: 14, speed: 3.2, dir: 'down', frame: 0 };
  const keys = {};
  let walls = [];
  let enemies = [];
  let chests = [];
  let exitDoor = null;
  let theme = null;
  let isBoss = false;
  let onEncounter = null, onExit = null, onPickup = null;
  let currentRoom = 1;
  let message = '', messageTimer = 0;
  let doorJustOpened = false;   // para avisar una sola vez
  let time = 0;

  /* ─── Layouts de obstáculos por sala (variados) ─────────────────── */
  const LAYOUTS = [
    [{x:4,y:3},{x:4,y:4},{x:11,y:6},{x:11,y:7}],
    [{x:6,y:2},{x:6,y:3},{x:6,y:8},{x:9,y:5},{x:10,y:5}],
    [{x:3,y:5},{x:12,y:3},{x:7,y:7},{x:8,y:7},{x:7,y:3},{x:8,y:3}],
    [{x:5,y:4},{x:10,y:4},{x:5,y:6},{x:10,y:6},{x:7,y:2},{x:8,y:8}],
    [], // arena del jefe: despejada
  ];

  /* ─── Construcción de una sala ──────────────────────────────────── */
  function buildRoom(roomNum, enemyList) {
    currentRoom = roomNum;
    theme = roomTheme(roomNum);
    isBoss = theme.boss;
    walls = []; enemies = []; chests = [];
    message = ''; doorJustOpened = false;

    // Marco de piedra
    walls.push({ x:0, y:0, w:W, h:TILE });
    walls.push({ x:0, y:H-TILE, w:W, h:TILE });
    walls.push({ x:0, y:0, w:TILE, h:H });
    walls.push({ x:W-TILE, y:0, w:TILE, h:H });

    // Obstáculos internos según layout
    (LAYOUTS[(roomNum - 1) % LAYOUTS.length] || []).forEach(o =>
      walls.push({ x:o.x*TILE, y:o.y*TILE, w:TILE, h:TILE }));

    // Jugador entra por la izquierda
    player.x = TILE * 1.6;
    player.y = H / 2;

    // Puerta de salida (derecha)
    exitDoor = { x: W - TILE, y: H/2 - TILE, w: TILE, h: TILE*2 };

    // Enemigos: la cantidad la define el tema de la sala
    const eData = enemyList[roomNum - 1];
    const count = theme.enemies;
    for (let i = 0; i < count; i++) {
      const gx = TILE * (6 + (i % 3) * 3);
      const gy = TILE * (3 + Math.floor(i / 3 + i) % 5 + 1);
      enemies.push({
        x: gx, y: Math.min(gy, H - TILE*2),
        r: isBoss ? 26 : 16, alive: true,
        vx: (Math.random()<.5?-1:1) * (isBoss ? 0.8 : 1.3),
        vy: (Math.random()<.5?-1:1) * (isBoss ? 0.8 : 1.3),
        spriteKey: eData.spriteKey, name: eData.name, roomNum, boss: isBoss,
      });
    }

    // Cofres: cantidad según el tema (el jefe no tiene)
    const spots = [{x:3,y:8},{x:13,y:2},{x:13,y:8},{x:2,y:2},{x:8,y:9}];
    for (let i = 0; i < theme.chests; i++) {
      const s = spots[i];
      chests.push({ x: s.x*TILE + TILE/2, y: s.y*TILE + TILE/2, opened:false, itemId: randomLoot(roomNum) });
    }

    // Aviso de entrada
    showMsg(isBoss ? `👑 ${theme.name} — ¡JEFE!` : `🗺️ ${theme.name}`);
  }

  /* ─── Colisiones ────────────────────────────────────────────────── */
  function circleRect(cx, cy, r, rect) {
    const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    const dx = cx - nx, dy = cy - ny;
    return dx*dx + dy*dy < r*r;
  }
  function hitsWall(x, y) { return walls.some(w => circleRect(x, y, player.r, w)); }

  function enemiesLeft() { return enemies.filter(e => e.alive).length; }

  /* ─── Update ────────────────────────────────────────────────────── */
  function update() {
    time++;
    let dx = 0, dy = 0;
    if (keys['arrowleft'] || keys['a']) dx -= 1;
    if (keys['arrowright']|| keys['d']) dx += 1;
    if (keys['arrowup']   || keys['w']) dy -= 1;
    if (keys['arrowdown'] || keys['s']) dy += 1;
    dx += joy.dx; dy += joy.dy;

    if (dx || dy) {
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      const nx = player.x + dx * player.speed;
      const ny = player.y + dy * player.speed;
      if (!hitsWall(nx, player.y)) player.x = nx;
      if (!hitsWall(player.x, ny)) player.y = ny;
      player.dir = Math.abs(dx) > Math.abs(dy) ? (dx>0?'right':'left') : (dy>0?'down':'up');
      player.frame += 0.2;
    }

    enemies.forEach(e => {
      if (!e.alive) return;
      const nx = e.x + e.vx, ny = e.y + e.vy;
      if (hitsWall(nx, e.y) || nx < TILE+e.r || nx > W-TILE-e.r) e.vx *= -1; else e.x = nx;
      if (hitsWall(e.x, ny) || ny < TILE+e.r || ny > H-TILE-e.r) e.vy *= -1; else e.y = ny;
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d < e.r + player.r + 2) triggerCombat(e);
    });

    // Aviso cuando se abre la puerta (sala recién limpiada)
    if (exitDoor && enemiesLeft() === 0 && !doorJustOpened) {
      doorJustOpened = true;
      showMsg('🚪 ¡Sala despejada! Ve a la puerta →');
      if (typeof sfx === 'function') sfx('special');
    }

    chests.forEach(c => {
      if (c.opened) return;
      const d = Math.hypot(c.x - player.x, c.y - player.y);
      if (d < 26) {
        c.opened = true;
        if (onPickup) onPickup(c.itemId);
        const it = ITEMS[c.itemId];
        showMsg(`${it.icon} ¡${it.name}!`);
        if (typeof sfx === 'function') sfx('special');
      }
    });

    if (exitDoor && enemiesLeft() === 0 &&
        circleRect(player.x, player.y, player.r, exitDoor)) {
      if (onExit) { stop(); onExit(); }
    }

    if (messageTimer > 0) messageTimer--;
  }

  function triggerCombat(enemy) { stop(); if (onEncounter) onEncounter(enemy); }
  function defeatEnemy(ref) {
    const e = enemies.find(en => en === ref) || enemies.find(en => en.alive);
    if (e) e.alive = false;
  }
  function showMsg(txt) { message = txt; messageTimer = 150; }

  /* ─── Draw ──────────────────────────────────────────────────────── */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Suelo con la paleta del tema
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        ctx.fillStyle = ((x+y)%2) ? theme.floorA : theme.floorB;
        ctx.fillRect(x*TILE, y*TILE, TILE, TILE);
      }

    // Ambiente de jefe: resplandor rojo pulsante en el centro
    if (isBoss) {
      const glow = 0.15 + 0.08 * Math.sin(time * 0.05);
      const g = ctx.createRadialGradient(W/2, H/2, 40, W/2, H/2, W/2);
      g.addColorStop(0, `rgba(255,48,16,${glow})`);
      g.addColorStop(1, 'rgba(255,48,16,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // Puerta de salida
    if (exitDoor) {
      const open = enemiesLeft() === 0;
      ctx.fillStyle = open ? '#2a6a2a' : '#3a1010';
      ctx.fillRect(exitDoor.x, exitDoor.y, exitDoor.w, exitDoor.h);
      if (open) { // marco brillante pulsante
        ctx.strokeStyle = `rgba(168,232,50,${0.5 + 0.5*Math.sin(time*0.15)})`;
        ctx.lineWidth = 4;
        ctx.strokeRect(exitDoor.x+2, exitDoor.y+2, exitDoor.w-4, exitDoor.h-4);
      }
      ctx.font = '22px serif'; ctx.textAlign = 'center';
      ctx.fillText(open ? '🚪' : '🔒', exitDoor.x + exitDoor.w/2, exitDoor.y + exitDoor.h/2 + 8);
    }

    // Paredes (color del tema)
    walls.forEach(w => {
      ctx.fillStyle = theme.wall;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = '#00000055'; ctx.lineWidth = 2;
      for (let yy = w.y; yy < w.y + w.h; yy += 20) ctx.strokeRect(w.x+1, yy+1, w.w-2, 18);
    });

    // Cofres
    chests.forEach(c => {
      ctx.font = '26px serif'; ctx.textAlign = 'center';
      ctx.fillText(c.opened ? '📭' : '📦', c.x, c.y + 9);
    });

    // Enemigos
    enemies.forEach(e => {
      if (!e.alive) return;
      const size = e.boss ? 52 : 36;
      const cv = (typeof makeEnemySprite === 'function') ? makeEnemySprite(e.spriteKey) : null;
      if (cv) { ctx.imageSmoothingEnabled = false; ctx.drawImage(cv, e.x - size/2, e.y - size/2, size, size); }
      else { ctx.fillStyle = '#b83020'; ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, 7); ctx.fill(); }
      // Corona sobre el jefe
      if (e.boss) { ctx.font = '20px serif'; ctx.textAlign = 'center'; ctx.fillText('👑', e.x, e.y - size/2 - 4); }
    });

    // Jugador
    const bob = Math.sin(player.frame) * 2;
    ctx.fillStyle = playerColor();
    ctx.beginPath(); ctx.arc(player.x, player.y + bob, player.r, 0, 7); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#000';
    ctx.beginPath(); ctx.arc(player.x, player.y + bob, player.r, 0, 7); ctx.stroke();
    ctx.fillStyle = '#fff';
    const ox = player.dir==='left'?-4:player.dir==='right'?4:0;
    const oy = player.dir==='up'?-4:player.dir==='down'?3:0;
    ctx.fillRect(player.x - 5 + ox, player.y - 3 + oy + bob, 3, 3);
    ctx.fillRect(player.x + 2 + ox, player.y - 3 + oy + bob, 3, 3);

    // Mensaje flotante
    if (messageTimer > 0 && message) {
      ctx.font = '18px monospace'; ctx.textAlign = 'center';
      const wMsg = Math.max(260, ctx.measureText(message).width + 40);
      ctx.fillStyle = 'rgba(0,0,0,.8)';
      ctx.fillRect(W/2 - wMsg/2, 8, wMsg, 34);
      ctx.strokeStyle = theme.accent; ctx.lineWidth = 2;
      ctx.strokeRect(W/2 - wMsg/2, 8, wMsg, 34);
      ctx.fillStyle = theme.accent;
      ctx.fillText(message, W/2, 31);
    }
  }

  function playerColor() {
    return ({ warrior:'#b83020', elf:'#4a9a3a', mage:'#6a4aaa', rogue:'#4a4a4a' })[state.classId] || '#c8963c';
  }

  /* ─── Bucle ─────────────────────────────────────────────────────── */
  function loop() { if (!running) return; update(); draw(); raf = requestAnimationFrame(loop); }
  function start() { running = true; if (!raf) loop(); }
  function stop() { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } }

  /* Reanuda el bucle de forma robusta tras volver del combate.
     Cancela cualquier frame pendiente y arranca uno nuevo, y limpia
     el estado de teclas para que el jugador no quede "trabado". */
  function resume() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    for (const k in keys) keys[k] = false;   // soltar teclas atascadas
    joy.dx = 0; joy.dy = 0;
    running = true;
    loop();
  }

  /* ─── Joystick táctil ───────────────────────────────────────────── */
  const joy = { dx: 0, dy: 0 };
  function bindTouch(padEl, stickEl) {
    const setFrom = (clientX, clientY) => {
      const rect = padEl.getBoundingClientRect();
      const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
      let dx = clientX - cx, dy = clientY - cy;
      const max = rect.width/2, len = Math.hypot(dx, dy) || 1;
      const clamped = Math.min(len, max);
      dx = dx/len; dy = dy/len;
      joy.dx = dx * (clamped/max); joy.dy = dy * (clamped/max);
      stickEl.style.transform = `translate(${dx*clamped}px, ${dy*clamped}px)`;
    };
    const end = () => { joy.dx = 0; joy.dy = 0; stickEl.style.transform = 'translate(0,0)'; };
    padEl.addEventListener('touchstart', e => { e.preventDefault(); setFrom(e.touches[0].clientX, e.touches[0].clientY); }, {passive:false});
    padEl.addEventListener('touchmove',  e => { e.preventDefault(); setFrom(e.touches[0].clientX, e.touches[0].clientY); }, {passive:false});
    padEl.addEventListener('touchend', end);
    let md = false;
    padEl.addEventListener('mousedown', e => { md = true; setFrom(e.clientX, e.clientY); });
    window.addEventListener('mousemove', e => { if (md) setFrom(e.clientX, e.clientY); });
    window.addEventListener('mouseup', () => { if (md) { md = false; end(); } });
  }

  /* ─── Init / API ────────────────────────────────────────────────── */
  function init(cv) {
    canvas = cv; canvas.width = W; canvas.height = H;
    ctx = canvas.getContext('2d');
    window.addEventListener('keydown', e => {
      keys[e.key.toLowerCase()] = true;
      if (['arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())) e.preventDefault();
    });
    window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
  }

  return {
    init, buildRoom, start, stop, resume, defeatEnemy, bindTouch,
    set onEncounter(fn) { onEncounter = fn; },
    set onExit(fn)      { onExit = fn; },
    set onPickup(fn)    { onPickup = fn; },
    get currentRoom()   { return currentRoom; },
    _debug: () => ({ enemies, chests, player, theme, isBoss }),
  };
})();
