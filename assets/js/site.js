/* ============================================================================
   site.js - navigation state, scroll reveal, and the status bar.

   Every status-bar field is measured from something real. If a field cannot be
   real it is not rendered at all.

   Reveal elements are authored visible in the HTML; this script opts them into
   the animation and is then responsible for letting them back in. It is driven
   by the same throttled scroll pass as everything else rather than by an
   IntersectionObserver, because observer callbacks are not delivered while a
   document is hidden - which would leave content stranded at opacity 0.
   ========================================================================= */

(function () {
  'use strict';

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function reduced() { return mqReduce.matches; }

  /* --- 1. Scroll reveal --------------------------------------------------- */

  var pending = [];

  function armReveal() {
    if (reduced()) return;
    var groups = document.querySelectorAll('[data-reveal-group]');
    for (var g = 0; g < groups.length; g++) {
      var kids = groups[g].children;
      for (var k = 0; k < kids.length; k++) {
        var el = kids[k];
        el.classList.add('reveal');
        /* Max 6 staggered items per group, 40ms apart. */
        if (k < 6) el.style.transitionDelay = (k * 40) + 'ms';
        pending.push(el);
      }
    }
  }

  function pumpReveal() {
    if (!pending.length) return;
    var line = window.innerHeight * 0.88;   /* equivalent to -12% bottom margin */
    for (var i = pending.length - 1; i >= 0; i--) {
      if (pending[i].getBoundingClientRect().top < line) {
        pending[i].classList.add('is-in');
        pending.splice(i, 1);
      }
    }
  }

  /* If the user turns reduced motion on midway, stop hiding anything. */
  function onMotionChange() {
    if (!reduced()) return;
    while (pending.length) pending.pop().classList.add('is-in');
  }
  if (mqReduce.addEventListener) mqReduce.addEventListener('change', onMotionChange);
  else if (mqReduce.addListener) mqReduce.addListener(onMotionChange);

  /* --- 2. Current-section marker ------------------------------------------ */

  var sections = document.querySelectorAll('main section[id]');
  var navLinks = document.querySelectorAll('[data-nav]');
  var currentId = '';

  function markNav(id) {
    if (id === currentId) return;
    currentId = id;
    for (var i = 0; i < navLinks.length; i++) {
      if (navLinks[i].getAttribute('data-nav') === id) {
        navLinks[i].setAttribute('aria-current', 'true');
      } else {
        navLinks[i].removeAttribute('aria-current');
      }
    }
  }

  /* A section becomes current once its top passes the reading line. */
  function activeSection() {
    var line = window.innerHeight * 0.32;
    var found = '';
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= line) found = sections[i].id;
    }
    if (!found && sections.length) found = sections[0].id;
    return found;
  }

  /* --- 3. Status bar ------------------------------------------------------ */

  var elSection = document.getElementById('st-section');
  var elBuffer = document.getElementById('st-buffer');
  var elClock = document.getElementById('st-clock');
  var elRender = document.getElementById('st-render');

  function sectionLabel(id) {
    var s = document.getElementById(id);
    if (!s) return '';
    return ((s.getAttribute('data-num') || '') + ' ' +
            (s.getAttribute('data-name') || '')).trim();
  }

  function scrollPercent() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    if (max <= 0) return 100;
    var p = (window.pageYOffset || doc.scrollTop) / max;
    return Math.max(0, Math.min(100, Math.round(p * 100)));
  }

  /* --- 4. One throttled pass drives all of the above ---------------------- */

  var ticking = false;
  function pass() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      pumpReveal();
      if (!sections.length) return;
      var id = activeSection();
      markNav(id);
      if (elSection) elSection.textContent = sectionLabel(id);
      if (elBuffer) elBuffer.textContent = scrollPercent() + '%';
    });
  }

  /* requestAnimationFrame does not run while the document is hidden, so the
     first pass is also made synchronously. */
  function passNow() {
    pumpReveal();
    if (!sections.length) return;
    var id = activeSection();
    markNav(id);
    if (elSection) elSection.textContent = sectionLabel(id);
    if (elBuffer) elBuffer.textContent = scrollPercent() + '%';
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function updateSlow() {
    if (elClock) {
      var d = new Date();
      elClock.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes());
    }
    if (elRender) {
      /* The canvas reports its own measured rate; em dash when it is paused. */
      var fps = window.__signal && window.__signal.fps;
      elRender.textContent = fps ? fps + 'FPS' : '—';
    }
  }

  armReveal();
  passNow();

  window.addEventListener('scroll', pass, { passive: true });
  window.addEventListener('resize', pass, { passive: true });
  document.addEventListener('visibilitychange', passNow);

  if (elClock || elRender) {
    updateSlow();
    window.setInterval(updateSlow, 1000);
  }

  /* --- 5. Year stamp ------------------------------------------------------ */

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
