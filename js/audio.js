/* =====================================================================
   MAZMORRA DE CARTAS — Sonidos retro 8-bit (Web Audio API)
   ---------------------------------------------------------------------
   Genera efectos de sonido por código, sin archivos externos.
   Usa osciladores (cuadrada/sierra) para ese sabor arcade/DOOM.
   El audio se activa tras la primera interacción del usuario
   (requisito de los navegadores).
   ===================================================================== */

const SFX = (() => {
  let ctx = null;
  let enabled = true;

  function ensureCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { enabled = false; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* Un "beep" básico configurable. */
  function beep({ freq = 440, dur = 0.12, type = 'square', vol = 0.15,
                  slideTo = null, attack = 0.005 } = {}) {
    if (!enabled) return;
    const ac = ensureCtx();
    if (!ac) return;

    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);

    gain.gain.setValueAtTime(0.0001, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(vol, ac.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);

    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + dur + 0.02);
  }

  /* Ruido blanco corto (para golpes/explosiones). */
  function noise({ dur = 0.15, vol = 0.2 } = {}) {
    if (!enabled) return;
    const ac = ensureCtx();
    if (!ac) return;
    const size = Math.floor(ac.sampleRate * dur);
    const buffer = ac.createBuffer(1, size, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / size);
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    src.connect(gain).connect(ac.destination);
    src.start();
  }

  function seq(notes) {
    if (!enabled) return;
    const ac = ensureCtx();
    if (!ac) return;
    let t = 0;
    notes.forEach(n => { setTimeout(() => beep(n), t); t += (n.gap || 90); });
  }

  /* ─── Sonidos del juego ─────────────────────────────────────────── */
  return {
    toggle(v) { enabled = v; },
    isEnabled() { return enabled; },

    dice() { // dado rodando: barrido rápido
      beep({ freq: 220, slideTo: 660, dur: 0.25, type: 'square', vol: 0.12 });
    },
    playerAttack() { // jugar carta de ataque
      beep({ freq: 520, slideTo: 180, dur: 0.16, type: 'sawtooth', vol: 0.14 });
    },
    hitEnemy() { // impacto en el enemigo
      noise({ dur: 0.12, vol: 0.18 });
      beep({ freq: 160, slideTo: 80, dur: 0.14, type: 'square', vol: 0.12 });
    },
    heal() { // curación: dos notas ascendentes suaves
      seq([{ freq: 440, dur: 0.1, type: 'sine', vol: 0.12 },
           { freq: 660, dur: 0.14, type: 'sine', vol: 0.12 }]);
    },
    block() { // defensa: golpe metálico
      beep({ freq: 300, dur: 0.08, type: 'square', vol: 0.1 });
      noise({ dur: 0.06, vol: 0.1 });
    },
    playerHurt() { // el jugador recibe daño
      beep({ freq: 200, slideTo: 60, dur: 0.3, type: 'sawtooth', vol: 0.18 });
      noise({ dur: 0.2, vol: 0.15 });
    },
    special() { // efecto mágico (congelar/veneno/buff)
      beep({ freq: 800, slideTo: 1200, dur: 0.2, type: 'triangle', vol: 0.1 });
    },
    enemyDown() { // enemigo derrotado
      seq([{ freq: 300, dur: 0.1, type: 'square', vol: 0.14 },
           { freq: 200, dur: 0.1, type: 'square', vol: 0.14 },
           { freq: 120, dur: 0.25, type: 'square', vol: 0.14 }]);
    },
    victory() { // fanfarria de victoria
      seq([{ freq: 523, dur: 0.14, type: 'square', vol: 0.14 },
           { freq: 659, dur: 0.14, type: 'square', vol: 0.14 },
           { freq: 784, dur: 0.14, type: 'square', vol: 0.14 },
           { freq: 1047, dur: 0.35, type: 'square', vol: 0.16 }]);
    },
    defeat() { // derrota: descenso fúnebre
      seq([{ freq: 300, dur: 0.2, type: 'sawtooth', vol: 0.15 },
           { freq: 220, dur: 0.2, type: 'sawtooth', vol: 0.15 },
           { freq: 150, dur: 0.5, type: 'sawtooth', vol: 0.15 }]);
    },
    click() { // clic de UI
      beep({ freq: 660, dur: 0.05, type: 'square', vol: 0.08 });
    },
  };
})();
