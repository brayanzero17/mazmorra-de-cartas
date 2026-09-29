/* =====================================================================
   MAZMORRA DE CARTAS — Modo Exploración (top-down, movimiento libre)
   ---------------------------------------------------------------------
   Vista cenital dibujada en <canvas>. El jugador se mueve libre en 8
   direcciones (WASD / flechas / joystick táctil). La sala tiene paredes,
   enemigos que patrullan, cofres con objetos y una puerta de salida.
   Al tocar un enemigo → se dispara el combate de cartas (game.js).
   Al recoger un cofre → se obtiene un objeto (items.js/data.js).
   Al llegar a la salida (sin enemigos vivos) → siguiente sala.
   ===================================================================== */

const EXPLORE = (() => {
  const TILE = 40;                 // tamaño lógico de celda
  const COLS = 16, ROWS = 11;      // tamaño de la sala en celdas
  const W = COLS * TILE, H = ROWS * TILE;

  let canvas, ctx;
  let raf = null;
  let running = false;

  const player = { x: 0, y: 0, r: 14, speed: 3.2, dir: 'down', frame: 0 };
  const keys = {};
  let walls = [];      // {x,y,w,h}
  let enemies = [];    // {x,y,r,room,alive,vx,vy,spriteKey,name}
  let chests = [];     // {x,y,opened,itemId}
  let exitDoor = null; // {x,y,w,h}
  let onEncounter = null;  // callback(enemyData) → inicia combate
  let onExit = null;       // callback() → siguiente sala
  let onPickup = null;     // callback(itemId) → recoger objeto
  let currentRoom = 1;
  let message = '';
  let messageTimer = 0;

  /* ─── Construcción de una sala ──────────────────────────────────── */
  function buildRoom(roomNum, enemyList) {
    currentRoom = roomNum;
    walls = [];
    enemies = [];
    chests = [];
    message = '';

    // Bordes de la sala (marco de piedra)
    walls.push({ x:0, y:0, w:W, h:TILE });                 // arriba
    walls.push({ x:0, y:H-TILE, w:W, h:TILE });            // abajo
    walls.push({ x:0, y:0, w:TILE, h:H });                 // izquierda
    walls.push({ x:W-TILE, y:0, w:TILE, h:H });            // derecha

    // Algunos pilares/obstáculos internos (varían por sala)
    const obstacles = [
      [{x:4,y:3},{x:4,y:4},{x:11,y:6},{x:11,y:7}],
      [{x:6,y:2},{x:6,y:8},{x:9,y:5}],
      [{x:3,y:5},{x:12,y:3},{x:7,y:7},{x:8,y:7}],
      [{x:5,y:4},{x:10,y:4},{x:5,y:6},{x:10,y:6}],
      [{x:8,y:2},{x:8,y:8},{x:4,y:5},{x:12,y:5}],
    ][(roomNum - 1) % 5];
    obstacles.forEach(o => walls.push({ x:o.x*TILE, y:o.y*TILE, w:TILE, h:TILE }));

    // Jugador entra por la izquierda
    player.x = TILE * 1.6;
    player.y = H / 2;

    // Puerta de salida a la derecha
    exitDoor = { x: W - TILE, y: H/2 - TILE, w: TILE, h: TILE*2 };

    // Enemigos (los mismos datos que el combate). 1-2 por sala.
    const eData = enemyList[roomNum - 1];
    const count = roomNum >= 4 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      enemies.push({
        x: TILE * (8 + i*3), y: TILE * (3 + i*4),
        r: 16, alive: true,
        vx: (Math.random()<.5?-1:1)*1.2, vy: (Math.random()<.5?-1:1)*1.2,
        spriteKey: eData.spriteKey, name: eData.name, roomNum,
      });
    }

    // Cofres (1-2 por sala)
    const chestCount = roomNum <= 2 ? 1 : 2;
    const spots = [{x:3,y:8},{x:13,y:2},{x:13,y:8},{x:2,y:2}];
    for (let i = 0; i < chestCount; i++) {
      const s = spots[i];
      chests.push({ x: s.x*TILE + TILE/2, y: s.y*TILE + TILE/2, opened:false, itemId: randomLoot(roomNum) });
    }
  }

  /* ─── Colisiones ────────────────────────────────────────────────── */
  function circleRect(cx, cy, r, rect) {
    const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    const dx = cx - nx, dy = cy - ny;
    return dx*dx + dy*dy < r*r;
  }
  function hitsWall(x, y) {
    return walls.some(w => circleRect(x, y, player.r, w));
  }

  /* ─── Actualización (movimiento, IA, recogidas) ─────────────────── */
  function update() {
    let dx = 0, dy = 0;
    if (keys['arrowleft'] || keys['a']) dx -= 1;
    if (keys['arrowright']|| keys['d']) dx += 1;
    if (keys['arrowup']   || keys['w']) dy -= 1;
    if (keys['arrowdown'] || keys['s']) dy += 1;

    // joystick táctil
    dx += joy.dx; dy += joy.dy;

    if (dx || dy) {
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      const nx = player.x + dx * player.speed;
      const ny = player.y + dy * player.speed;
      if (!hitsWall(nx, player.y)) player.x = nx;   // deslizar por ejes
      if (!hitsWall(player.x, ny)) player.y = ny;
      player.dir = Math.abs(dx) > Math.abs(dy) ? (dx>0?'right':'left') : (dy>0?'down':'up');
      player.frame += 0.2;
    }

    // Enemigos patrullan (rebotan en paredes)
    enemies.forEach(e => {
      if (!e.alive) return;
      const nx = e.x + e.vx, ny = e.y + e.vy;
      if (hitsWall(nx, e.y) || nx < TILE || nx > W-TILE) e.vx *= -1; else e.x = nx;
      if (hitsWall(e.x, ny) || ny < TILE || ny > H-TILE) e.vy *= -1; else e.y = ny;

      // ¿toca al jugador? → combate
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d < e.r + player.r + 2) {
        triggerCombat(e);
      }
    });

    // Cofres
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

    // Salida (solo si no quedan enemigos vivos)
    if (exitDoor && !enemies.some(e => e.alive)) {
      if (circleRect(player.x, player.y, player.r, exitDoor)) {
        if (onExit) { stop(); onExit(); }
      }
    }

    if (messageTimer > 0) messageTimer--;
  }

  function triggerCombat(enemy) {
    stop();
    if (onEncounter) onEncounter(enemy);
  }

  /* Marca un enemigo como derrotado (lo llama game.js al ganar). */
  function defeatEnemy(enemyRef) {
    const e = enemies.find(en => en === enemyRef) || enemies.find(en => en.alive);
    if (e) e.alive = false;
  }

  function showMsg(txt) { message = txt; messageTimer = 120; }

  /* ─── Dibujo ────────────────────────────────────────────────────── */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Suelo de piedra con patrón
    ctx.fillStyle = '#1a1410';
    ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        ctx.fillStyle = ((x+y)%2) ? '#201812' : '#241c14';
        ctx.fillRect(x*TILE, y*TILE, TILE, TILE);
      }
    }

    // Puerta de salida
    if (exitDoor) {
      const open = !enemies.some(e => e.alive);
      ctx.fillStyle = open ? '#2a6a2a' : '#3a1010';
      ctx.fillRect(exitDoor.x, exitDoor.y, exitDoor.w, exitDoor.h);
      ctx.fillStyle = open ? '#a8e832' : '#8b0000';
      ctx.font = '20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(open ? '🚪' : '🔒', exitDoor.x + exitDoor.w/2, exitDoor.y + exitDoor.h/2 + 7);
    }

    // Paredes (ladrillo)
    walls.forEach(w => {
      ctx.fillStyle = '#3a2c1e';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = '#00000055';
      ctx.lineWidth = 2;
      for (let yy = w.y; yy < w.y + w.h; yy += 20)
        ctx.strokeRect(w.x+1, yy+1, w.w-2, 18);
    });

    // Cofres
    chests.forEach(c => {
      ctx.font = '26px serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.opened ? '📭' : '📦', c.x, c.y + 9);
    });

    // Enemigos
    enemies.forEach(e => {
      if (!e.alive) return;
      const cv = (typeof makeEnemySprite === 'function') ? makeEnemySprite(e.spriteKey) : null;
      if (cv) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(cv, e.x - 18, e.y - 18, 36, 36);
      } else {
        ctx.fillStyle = '#b83020';
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, 7); ctx.fill();
      }
    });

    // Jugador (círculo con color de clase + "casco")
    const bob = Math.sin(player.frame) * 2;
    ctx.fillStyle = playerColor();
    ctx.beginPath(); ctx.arc(player.x, player.y + bob, player.r, 0, 7); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(player.x, player.y + bob, player.r, 0, 7); ctx.stroke();
    // ojos según dirección
    ctx.fillStyle = '#fff';
    const ox = player.dir==='left'?-4:player.dir==='right'?4:0;
    const oy = player.dir==='up'?-4:player.dir==='down'?3:0;
    ctx.fillRect(player.x - 5 + ox, player.y - 3 + oy + bob, 3, 3);
    ctx.fillRect(player.x + 2 + ox, player.y - 3 + oy + bob, 3, 3);

    // Mensaje flotante (objeto recogido)
    if (messageTimer > 0 && message) {
      ctx.fillStyle = 'rgba(0,0,0,.75)';
      ctx.fillRect(W/2 - 130, 8, 260, 34);
      ctx.strokeStyle = '#c8963c'; ctx.lineWidth = 2;
      ctx.strokeRect(W/2 - 130, 8, 260, 34);
      ctx.fillStyle = '#f0c060';
      ctx.font = '18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(message, W/2, 31);
    }
  }

  function playerColor() {
    return ({ warrior:'#b83020', elf:'#4a9a3a', mage:'#6a4aaa', rogue:'#4a4a4a' })[state.classId] || '#c8963c';
  }

  /* ─── Bucle ─────────────────────────────────────────────────────── */
  function loop() {
    if (!running) return;
    update();
    draw();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    running = true;
    if (!raf) loop();
  }
  function stop() {
    running = false;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
  }

  /* ─── Joystick táctil ───────────────────────────────────────────── */
  const joy = { dx: 0, dy: 0, active: false, cx: 0, cy: 0 };

  function bindTouch(padEl, stickEl) {
    const setFrom = (clientX, clientY) => {
      const rect = padEl.getBoundingClientRect();
      const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
      let dx = clientX - cx, dy = clientY - cy;
      const max = rect.width/2;
      const len = Math.hypot(dx, dy) || 1;
      const clamped = Math.min(len, max);
      dx = dx/len; dy = dy/len;
      joy.dx = dx * (clamped/max);
      joy.dy = dy * (clamped/max);
      stickEl.style.transform = `translate(${dx*clamped}px, ${dy*clamped}px)`;
    };
    const end = () => { joy.dx = 0; joy.dy = 0; stickEl.style.transform = 'translate(0,0)'; };

    padEl.addEventListener('touchstart', e => { e.preventDefault(); setFrom(e.touches[0].clientX, e.touches[0].clientY); }, {passive:false});
    padEl.addEventListener('touchmove',  e => { e.preventDefault(); setFrom(e.touches[0].clientX, e.touches[0].clientY); }, {passive:false});
    padEl.addEventListener('touchend', end);
    // También arrastre con mouse (para probar en PC)
    let mouseDown = false;
    padEl.addEventListener('mousedown', e => { mouseDown = true; setFrom(e.clientX, e.clientY); });
    window.addEventListener('mousemove', e => { if (mouseDown) setFrom(e.clientX, e.clientY); });
    window.addEventListener('mouseup', () => { if (mouseDown) { mouseDown = false; end(); } });
  }

  /* ─── Init / API pública ────────────────────────────────────────── */
  function init(cv) {
    canvas = cv;
    canvas.width = W;
    canvas.height = H;
    ctx = canvas.getContext('2d');

    window.addEventListener('keydown', e => {
      keys[e.key.toLowerCase()] = true;
      if (['arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())) e.preventDefault();
    });
    window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
  }

  return {
    init, buildRoom, start, stop, defeatEnemy, bindTouch,
    set onEncounter(fn) { onEncounter = fn; },
    set onExit(fn)      { onExit = fn; },
    set onPickup(fn)    { onPickup = fn; },
    get currentRoom()   { return currentRoom; },
    _debug: () => ({ enemies, chests, player }),
  };
})();
