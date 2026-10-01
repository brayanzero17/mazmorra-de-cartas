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

  const player = { x: 0, y: 0, r: 14, speed: 2.8, dir: 'down', frame: 0, vx: 0, vy: 0, moving: false };
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
    player.vx = 0; player.vy = 0; player.moving = false;

    // Puerta de salida (derecha) — más grande y visible
    exitDoor = { x: W - TILE - 6, y: H/2 - TILE*1.5, w: TILE + 6, h: TILE*3 };

    // Enemigos: la cantidad la define el tema de la sala
    const eData = enemyList[roomNum - 1];
    const count = theme.enemies;
    for (let i = 0; i < count; i++) {
      const gx = TILE * (6 + (i % 3) * 3);
      const gy = TILE * (3 + Math.floor(i / 3 + i) % 5 + 1);
      enemies.push({
        x: gx, y: Math.min(gy, H - TILE*2),
        r: isBoss ? 26 : 16, alive: true,
        vx: (Math.random()<.5?-1:1) * (isBoss ? 0.7 : 1.0),
        vy: (Math.random()<.5?-1:1) * (isBoss ? 0.7 : 1.0),
        spriteKey: eData.spriteKey, name: eData.name, roomNum, boss: isBoss,
      });
    }

    // Cofres: cantidad según el tema (el jefe no tiene)
    const spots = [{x:3,y:8},{x:13,y:2},{x:13,y:8},{x:2,y:2},{x:8,y:9}];
    for (let i = 0; i < theme.chests; i++) {
      const s = spots[i];
      chests.push({ x: s.x*TILE + TILE/2, y: s.y*TILE + TILE/2, opened:false, itemId: randomLoot(roomNum, state.classId) });
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
  function update(dt) {
    dt = dt || 1;
    time += dt;
    let dx = 0, dy = 0;
    if (keys['arrowleft'] || keys['a']) dx -= 1;
    if (keys['arrowright']|| keys['d']) dx += 1;
    if (keys['arrowup']   || keys['w']) dy -= 1;
    if (keys['arrowdown'] || keys['s']) dy += 1;
    dx += joy.dx; dy += joy.dy;

    // Dirección objetivo (normalizada)
    let tvx = 0, tvy = 0;
    if (dx || dy) {
      const len = Math.hypot(dx, dy) || 1;
      tvx = (dx / len) * player.speed;
      tvy = (dy / len) * player.speed;
    }
    // Movilidad suave: la velocidad actual se acerca a la objetivo
    // (aceleración al arrancar, deslizamiento al soltar) → más fluido.
    const accel = 0.35;   // respuesta un poco más ágil
    player.vx += (tvx - player.vx) * accel * dt;
    player.vy += (tvy - player.vy) * accel * dt;

    // Aplicar movimiento con colisión por ejes (deslizar por paredes)
    const nx = player.x + player.vx * dt;
    const ny = player.y + player.vy * dt;
    if (!hitsWall(nx, player.y)) player.x = nx; else player.vx = 0;
    if (!hitsWall(player.x, ny)) player.y = ny; else player.vy = 0;

    const spd = Math.hypot(player.vx, player.vy);
    player.moving = spd > 0.3;
    if (player.moving) {
      // dirección según la velocidad real
      player.dir = Math.abs(player.vx) > Math.abs(player.vy)
                 ? (player.vx > 0 ? 'right' : 'left')
                 : (player.vy > 0 ? 'down' : 'up');
      player.frame += 0.12 * dt;
    }

    enemies.forEach(e => {
      if (!e.alive) return;
      // Enemigos también escalados por dt
      const nx = e.x + e.vx * dt, ny = e.y + e.vy * dt;
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

    // Suelo con baldosas biseladas (sombra + luz para dar relieve)
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const px = x*TILE, py = y*TILE;
        ctx.fillStyle = ((x+y)%2) ? theme.floorA : theme.floorB;
        ctx.fillRect(px, py, TILE, TILE);
        // Bisel: línea clara arriba/izq, oscura abajo/der
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(px, py, TILE, 2);
        ctx.fillRect(px, py, 2, TILE);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(px, py+TILE-2, TILE, 2);
        ctx.fillRect(px+TILE-2, py, 2, TILE);
        // Grietas/manchas decorativas deterministas (no parpadean)
        const seed = (x*7 + y*13) % 11;
        if (seed === 0) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(px+8, py+10, 6, 3); }
        else if (seed === 3) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(px+22, py+26, 4, 4); }
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

    // Puerta de salida — MUY visible cuando la sala está limpia
    if (exitDoor) {
      const open = enemiesLeft() === 0;
      const cx = exitDoor.x + exitDoor.w/2;
      const cy = exitDoor.y + exitDoor.h/2;

      if (open) {
        const pulse = 0.5 + 0.5*Math.sin(time*0.15);
        // Halo verde brillante detrás de la puerta
        const g = ctx.createRadialGradient(cx, cy, 6, cx, cy, 70);
        g.addColorStop(0, `rgba(168,232,50,${0.5*pulse + 0.3})`);
        g.addColorStop(1, 'rgba(168,232,50,0)');
        ctx.fillStyle = g;
        ctx.fillRect(exitDoor.x - 60, exitDoor.y - 40, exitDoor.w + 70, exitDoor.h + 80);
        // Puerta abierta
        ctx.fillStyle = '#1a4a1a';
        ctx.fillRect(exitDoor.x, exitDoor.y, exitDoor.w, exitDoor.h);
        ctx.strokeStyle = `rgba(168,232,50,${pulse})`;
        ctx.lineWidth = 5;
        ctx.strokeRect(exitDoor.x+2, exitDoor.y+2, exitDoor.w-4, exitDoor.h-4);
        // Flecha animada apuntando a la puerta
        const ax = exitDoor.x - 34 + Math.sin(time*0.1)*6;
        ctx.fillStyle = `rgba(168,232,50,${0.6 + 0.4*pulse})`;
        ctx.font = 'bold 30px monospace'; ctx.textAlign = 'center';
        ctx.fillText('➡', ax, cy + 10);
        ctx.font = '30px serif';
        ctx.fillStyle = '#fff';
        ctx.fillText('🚪', cx, cy + 10);
        // Etiqueta "SALIDA"
        ctx.fillStyle = `rgba(168,232,50,${pulse})`;
        ctx.font = '13px monospace';
        ctx.fillText('SALIDA', cx, exitDoor.y - 8);
      } else {
        // Puerta cerrada (aún hay enemigos)
        ctx.fillStyle = '#3a1010';
        ctx.fillRect(exitDoor.x, exitDoor.y, exitDoor.w, exitDoor.h);
        ctx.font = '28px serif'; ctx.textAlign = 'center';
        ctx.fillText('🔒', cx, cy + 8);
      }
    }

    // Paredes de ladrillo con relieve 3D (realce arriba, sombra abajo)
    walls.forEach(w => {
      ctx.fillStyle = theme.wall;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      // Ladrillos con juntas y luz/sombra
      const bh = 10; // alto de ladrillo
      let row = 0;
      for (let yy = w.y; yy < w.y + w.h; yy += bh, row++) {
        const offset = (row % 2) * 10; // ladrillos alternados
        for (let xx = w.x - offset; xx < w.x + w.w; xx += 20) {
          const bx = Math.max(w.x, xx), bw = Math.min(xx+18, w.x+w.w) - bx;
          if (bw <= 0) continue;
          // luz arriba
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fillRect(bx, yy+1, bw, 2);
          // sombra abajo
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.fillRect(bx, yy+bh-2, bw, 2);
        }
        // junta horizontal
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(w.x, yy, w.w, 1);
      }
    });

    // Cofres (sprite pixel art)
    chests.forEach(c => {
      const cv = (typeof makeChestSprite === 'function') ? makeChestSprite(c.opened) : null;
      if (cv) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(cv, c.x - 20, c.y - 20, 40, 40);
      } else {
        ctx.font = '26px serif'; ctx.textAlign = 'center';
        ctx.fillText(c.opened ? '📭' : '📦', c.x, c.y + 9);
      }
      // Destello sobre cofres cerrados
      if (!c.opened) {
        const tw = 0.5 + 0.5*Math.sin(time*0.1 + c.x);
        ctx.fillStyle = `rgba(255,220,80,${0.4*tw})`;
        ctx.fillRect(c.x - 1, c.y - 24, 2, 4);
      }
    });

    // Enemigos (sprite de cuerpo completo con leve bob)
    enemies.forEach(e => {
      if (!e.alive) return;
      const size = e.boss ? 56 : 40;
      const ebob = Math.sin(time*0.1 + e.x) * 2;
      let cv = null;
      if (typeof makeEnemyBody === 'function') {
        const fr = (Math.floor(time*0.12) % 2 === 0) ? 'a' : 'b';
        cv = makeEnemyBody(e.spriteKey, fr);
      }
      if (!cv && typeof makeEnemySprite === 'function') cv = makeEnemySprite(e.spriteKey);
      if (cv) { ctx.imageSmoothingEnabled = false; ctx.drawImage(cv, e.x - size/2, e.y - size/2 + ebob, size, size); }
      else { ctx.fillStyle = '#b83020'; ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, 7); ctx.fill(); }
      if (e.boss) { ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.fillText('👑', e.x, e.y - size/2 - 2 + ebob); }
    });

    // Jugador: sprite de cuerpo completo con animación de caminar
    drawPlayer();

    // Atmósfera: viñeta oscura en los bordes + halo de luz cálida en el
    // jugador (como si llevara una antorcha). Da profundidad al mapa.
    const vig = ctx.createRadialGradient(player.x, player.y, 30, player.x, player.y, W*0.6);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(0.6, 'rgba(0,0,0,0.15)');
    vig.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(player.x, player.y, 10, player.x, player.y, 110);
    glow.addColorStop(0, 'rgba(255,180,80,0.10)');
    glow.addColorStop(1, 'rgba(255,180,80,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

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
    return ({ warrior:'#b83020', elf:'#4a9a3a', mage:'#6a4aaa', rogue:'#4a4a4a', werewolf:'#7a4e24', demon:'#b82418' })[state.classId] || '#c8963c';
  }

  /* Dibuja al jugador como sprite de cuerpo completo con animación de
     caminar. Alterna 2 frames al moverse, idle al estar quieto, y se
     voltea horizontalmente según la dirección. Incluye sombra. */
  function drawPlayer() {
    const size = 42;
    const px = player.x, py = player.y;

    // Si la clase tiene imagen externa (assets/), úsala en el mapa
    if (typeof getClassImage === 'function' && getClassImage(state.classId)) {
      const img = getClassImage(state.classId);
      // Más grande y proporcional al mapa (antes 54 → ahora 72)
      const isize = 72;
      // Animación de caminar: rebote vertical + ligero balanceo (inclinación)
      const walkBob  = player.moving ? Math.abs(Math.sin(player.frame * 2.5)) * 4 : 0;
      const walkTilt = player.moving ? Math.sin(player.frame * 2.5) * 0.06 : 0;
      const flip = (player.dir === 'left');

      // Sombra elíptica en el piso (se achica cuando "salta" al caminar)
      ctx.fillStyle = 'rgba(0,0,0,.4)';
      ctx.beginPath();
      ctx.ellipse(px, py + isize*0.42, isize*0.26 - walkBob*0.5, isize*0.09, 0, 0, Math.PI*2);
      ctx.fill();

      ctx.imageSmoothingEnabled = false;
      ctx.save();
      // Pivote en los "pies" del personaje para que el balanceo se vea natural
      ctx.translate(px, py + isize*0.4 - walkBob);
      ctx.rotate(walkTilt);
      if (flip) ctx.scale(-1, 1);
      ctx.drawImage(img, -isize/2, -isize*0.9, isize, isize);
      ctx.restore();
      return;
    }

    // Sombra para el personaje pixel art (fallback)
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath();
    ctx.ellipse(px, py + size/2 - 4, size*0.28, size*0.12, 0, 0, Math.PI*2);
    ctx.fill();

    let cv = null;
    if (typeof makeCharSprite === 'function') {
      let frameKey = 'idle';
      if (player.moving) frameKey = (Math.floor(player.frame * 2) % 2 === 0) ? 'A' : 'B';
      cv = makeCharSprite(state.classId, frameKey);
    }

    if (cv) {
      ctx.imageSmoothingEnabled = false;
      const flip = (player.dir === 'left');
      ctx.save();
      if (flip) {
        ctx.translate(px, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(cv, -size/2, py - size/2, size, size);
      } else {
        ctx.drawImage(cv, px - size/2, py - size/2, size, size);
      }
      ctx.restore();
    } else {
      // Fallback: círculo
      ctx.fillStyle = playerColor();
      ctx.beginPath(); ctx.arc(px, py, player.r, 0, 7); ctx.fill();
    }
  }

  /* ─── Bucle ─────────────────────────────────────────────────────── */
  /* Bucle basado en DELTA TIME: la velocidad es la misma en cualquier
     equipo y en cualquier sala, sin importar los FPS del monitor.
     'dt' es un factor donde 1.0 = velocidad de referencia a 60 FPS. */
  let lastT = 0;
  function loop(now) {
    if (!running) return;
    if (!lastT) lastT = now;
    let dt = (now - lastT) / (1000 / 60);   // normalizado a 60fps
    lastT = now;
    // Cap de dt para evitar "saltos" tras una pausa (ej. volver de combate)
    if (!dt || dt > 3) dt = 1;
    update(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }
  function start() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }   // evita loops duplicados
    for (const k in keys) keys[k] = false;
    joy.dx = 0; joy.dy = 0;
    player.vx = 0; player.vy = 0; player.moving = false;  // sin deriva al reanudar
    running = true;
    lastT = 0;
    raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } lastT = 0; }

  /* Reanudar tras el combate = reiniciar el bucle de forma limpia. */
  function resume() { start(); }

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
