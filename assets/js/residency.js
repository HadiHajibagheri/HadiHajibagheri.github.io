/* ============================================================================
   residency.js - the hero readout.

   Depicts what RocketLLM actually does: a fixed VRAM window sliding across a
   32-layer transformer while the next layers are prefetched across PCIe. The
   window size is the memory budget; the strip is the model. Nothing here is
   decorative - every rectangle stands for a layer and a state.

   30 fps cap, pauses offscreen and when the tab is hidden, allocates nothing
   inside the loop, and never starts at all under prefers-reduced-motion.
   ========================================================================= */

(function () {
  'use strict';

  var wrap = document.querySelector('[data-residency]');
  if (!wrap) return;

  var canvas = wrap.querySelector('canvas');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  var LAYERS = 32;
  var WINDOW = 6;       /* layers resident in the VRAM budget */
  var PREFETCH = 2;     /* layers in flight host -> device */
  var SPEED = 2.6;      /* layers per second */
  var FRAME = 1000 / 30;

  /* Shared readout for the status bar. */
  var bus = (window.__signal = window.__signal || {});
  bus.fps = null;

  /* Resolve tokens once - never inside the loop. */
  var cs = getComputedStyle(document.documentElement);
  function token(name, fallback) {
    var v = cs.getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }
  var C_SIGNAL = token('--signal', '#FFB000');
  var C_DIM = token('--signal-dim', 'rgba(255,176,0,0.14)');
  var C_LINE = token('--line-strong', '#2E2E36');
  var C_FAINT = token('--line', '#1C1C21');

  var w = 0, h = 0, dpr = 1;
  var pos = 8;
  var raf = 0, last = 0, acc = 0;
  var onScreen = true, running = false;
  var fpsCount = 0, fpsSince = 0;

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* --- geometry ---------------------------------------------------------- */

  function resize() {
    var rect = canvas.parentNode.getBoundingClientRect();
    if (!rect.width) return false;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }

  /* Relative offset of layer i from the leading edge of the window. */
  function rel(i) {
    var r = (i + 0.5 - pos) % LAYERS;
    return r < 0 ? r + LAYERS : r;
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    var gap = Math.max(1, (w / LAYERS) * 0.18);
    var bw = (w - gap * (LAYERS - 1)) / LAYERS;
    var stride = bw + gap;

    var stripY = h * 0.10;
    var stripH = h * 0.42;
    var brackY = stripY + stripH + h * 0.10;
    var trackY = h * 0.78;
    var trackH = Math.max(2, h * 0.045);

    /* 1. The model: 32 layers, three states. */
    var i, r, x;
    for (i = 0; i < LAYERS; i++) {
      r = rel(i);
      if (r < WINDOW) ctx.fillStyle = C_SIGNAL;
      else if (r < WINDOW + PREFETCH) ctx.fillStyle = C_DIM;
      else ctx.fillStyle = C_LINE;
      ctx.fillRect(i * stride, stripY, bw, stripH);
    }

    /* 2. The budget: a bracket under the resident window. */
    ctx.strokeStyle = C_LINE;
    ctx.lineWidth = 1;
    var tick = h * 0.07;
    for (i = 0; i < LAYERS; i++) {
      r = rel(i);
      if (r >= WINDOW) continue;
      x = i * stride;
      ctx.beginPath();
      ctx.moveTo(x, brackY + 0.5);
      ctx.lineTo(x + bw, brackY + 0.5);
      ctx.stroke();
      /* End ticks only on the first and last resident layer. */
      if (r < 1 || r >= WINDOW - 1) {
        ctx.beginPath();
        var tx = r < 1 ? x + 0.5 : x + bw - 0.5;
        ctx.moveTo(tx, brackY);
        ctx.lineTo(tx, brackY - tick);
        ctx.stroke();
      }
    }

    /* 3. The bus: host -> device transfer, leading the window. */
    ctx.fillStyle = C_FAINT;
    ctx.fillRect(0, trackY, w, trackH);
    for (i = 0; i < LAYERS; i++) {
      r = rel(i);
      if (r < WINDOW || r >= WINDOW + PREFETCH) continue;
      ctx.fillStyle = C_SIGNAL;
      ctx.globalAlpha = r < WINDOW + 1 ? 0.55 : 0.25;
      ctx.fillRect(i * stride, trackY, bw, trackH);
      ctx.globalAlpha = 1;
    }
  }

  /* --- loop -------------------------------------------------------------- */

  function tick(now) {
    raf = window.requestAnimationFrame(tick);
    if (!last) last = now;
    var dt = now - last;
    last = now;
    acc += dt;
    if (acc < FRAME) return;

    /* Advance by real elapsed time, not per frame, so the rate is honest. */
    pos = (pos + SPEED * (acc / 1000)) % LAYERS;
    acc = 0;
    draw();

    fpsCount++;
    if (now - fpsSince >= 1000) {
      bus.fps = Math.round((fpsCount * 1000) / (now - fpsSince));
      fpsCount = 0;
      fpsSince = now;
    }
  }

  function start() {
    if (running || reduced()) return;
    running = true;
    last = 0;
    acc = FRAME;
    fpsCount = 0;
    fpsSince = window.performance ? performance.now() : Date.now();
    raf = window.requestAnimationFrame(tick);
  }

  function stop() {
    if (!running) return;
    running = false;
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
    bus.fps = null;
  }

  function reduced() {
    return mqReduce.matches;
  }

  function sync() {
    if (reduced()) {
      stop();
      draw();               /* one static frame, mid-cycle */
    } else if (onScreen && !document.hidden) {
      start();
    } else {
      stop();
    }
  }

  /* --- wiring ------------------------------------------------------------ */

  var booted = false;

  /* On a cold load the figure can still measure zero when a deferred script
     runs, so booting is retried until the box actually has a width. Until then
     the inline SVG stays on screen and the hero is never empty. */
  function boot() {
    if (!resize()) return false;
    draw();
    if (booted) return true;
    booted = true;
    wrap.classList.add('is-live');   /* only now is the canvas the truth */

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        sync();
      }, { threshold: 0 }).observe(canvas);
    }

    document.addEventListener('visibilitychange', sync);

    if (mqReduce.addEventListener) mqReduce.addEventListener('change', sync);
    else if (mqReduce.addListener) mqReduce.addListener(sync);

    sync();
    return true;
  }

  if ('ResizeObserver' in window) {
    /* Covers both the first successful measurement and every later resize. */
    new ResizeObserver(boot).observe(canvas.parentNode);
  } else {
    var rt = 0;
    window.addEventListener('resize', function () {
      if (rt) window.clearTimeout(rt);
      rt = window.setTimeout(boot, 150);
    }, { passive: true });
    window.addEventListener('load', boot);
  }

  boot();
})();
