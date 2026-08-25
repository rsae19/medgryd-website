/* ══════════════════════════════════════════════════════════════════
   MedGryd — shared site behaviour
   1. Starfield: the app's ambient canvas, ported from App.jsx so the
      marketing site sits on the same sky the app does.
   2. Reveal: IntersectionObserver-driven stagger for .mg-reveal.
   Both are no-ops under prefers-reduced-motion.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ── 1. STARFIELD ─────────────────────────────────────────────────
     Same numbers as the app: stars drift upward at a fraction of their
     own radius, breathe on an individual sine, and occasionally fire a
     short twinkle burst on top of that. One shooting star crosses every
     ~5-7s at a random angle. Colour is read from --accent-rgb each
     frame so the field repaints instantly if the accent ever changes. */
  function startStarfield() {
    if (reduced.matches) return null;

    var canvas = document.getElementById('mg-starfield');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'mg-starfield';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.insertBefore(canvas, document.body.firstChild);
    }

    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1, stars = [], raf = null, t = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      if (!W || !H) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // The app uses 100 stars in a viewport-sized canvas. Scale by area
      // off that same density so a 27" display is not visibly emptier
      // than a laptop, then clamp so phones stay cheap to paint.
      var target = Math.round(100 * (W * H) / (1440 * 900));
      var count = Math.max(60, Math.min(240, target));
      if (stars.length !== count) stars = makeStars(count);
    }

    function makeStars(count) {
      var out = [];
      for (var i = 0; i < count; i++) {
        out.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.1 + 0.15,
          phase: Math.random() * Math.PI * 2,
          spd: Math.random() * 0.01 + 0.003,
          twStep: 0,
          twLen: 0
        });
      }
      return out;
    }

    // Shooting star state — one at a time, exactly like the app
    var ss = { active: false, countdown: Math.floor(Math.random() * 120 + 300) };

    function frame() {
      // Self-correct rather than trusting the resize event alone. A page
      // restored from bfcache, or laid out before the viewport reported a
      // size, can leave the canvas at the wrong dimensions with no resize
      // event ever firing — which shows up as an empty sky.
      if (W !== window.innerWidth || H !== window.innerHeight) resize();
      if (!W || !H) { raf = requestAnimationFrame(frame); return; }

      t++;
      ctx.clearRect(0, 0, W, H);

      var rgb = (getComputedStyle(document.documentElement)
        .getPropertyValue('--accent-rgb') || '56,189,248').trim();

      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.y -= s.r * 0.055;
        if (s.y < -2) { s.y = H + 2; s.x = Math.random() * W; }

        if (s.twLen === 0 && Math.random() < 0.0006) {
          s.twLen = 28 + Math.random() * 24;
          s.twStep = 0;
        }
        var twinkle = 0;
        if (s.twLen > 0) {
          s.twStep++;
          twinkle = Math.sin((s.twStep / s.twLen) * Math.PI);
          if (s.twStep >= s.twLen) { s.twLen = 0; s.twStep = 0; }
        }

        var a = Math.min(1, 0.06 + (Math.sin(s.phase + t * s.spd) + 1) / 2 * 0.32 + twinkle * 0.45);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * (1 + twinkle * 0.35), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgb + ',' + a + ')';
        ctx.fill();
      }

      if (!ss.active) {
        ss.countdown--;
        if (ss.countdown <= 0) {
          var ang = Math.random() * Math.PI * 2;
          var spd = Math.random() * 6 + 8;
          ss.x = Math.random() * W;
          ss.y = Math.random() * H;
          ss.vx = Math.cos(ang) * spd;
          ss.vy = Math.sin(ang) * spd;
          ss.tailLen = Math.random() * 60 + 40;
          ss.op = 0;
          ss.phase = 'in';
          ss.active = true;
        }
      } else {
        // Asymmetric fade: snaps in over ~12 frames, trails off over ~25
        if (ss.phase === 'in') { ss.op += 0.08; if (ss.op >= 1) ss.phase = 'out'; }
        else { ss.op -= 0.04; }
        ss.x += ss.vx;
        ss.y += ss.vy;
        var tx = ss.x - ss.vx * (ss.tailLen / 10);
        var ty = ss.y - ss.vy * (ss.tailLen / 10);
        var grad = ctx.createLinearGradient(tx, ty, ss.x, ss.y);
        grad.addColorStop(0, 'rgba(' + rgb + ',0)');
        grad.addColorStop(1, 'rgba(' + rgb + ',' + (ss.op * 0.8) + ')');
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        if (ss.op <= 0 || ss.x < -300 || ss.x > W + 300 || ss.y < -300 || ss.y > H + 300) {
          ss.active = false;
          ss.countdown = Math.floor(Math.random() * 120 + 300);
        }
      }

      raf = requestAnimationFrame(frame);
    }

    function play() { if (raf === null) raf = requestAnimationFrame(frame); }
    function pause() { if (raf !== null) { cancelAnimationFrame(raf); raf = null; } }

    resize();
    play();

    // Debounced so a drag-resize does not rebuild the field every frame
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 120);
    }, { passive: true });

    // A background tab should not burn a rAF loop
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pause(); else play();
    });

    return { pause: pause, play: play };
  }

  /* ── 2. SCROLL REVEAL ─────────────────────────────────────────────
     Anything tagged .mg-reveal fades and rises into place once. Items
     inside a shared [data-mg-stagger] container get an incrementing
     --mg-i so a grid cascades instead of landing all at once; the index
     is capped at 7 (≈385ms) so the tail of a long list never feels late.
     Rows are indexed from their position within the container, not the
     observer callback, so the cascade reads left-to-right regardless of
     which card tripped the observer first. */
  var STAGGER_CAP = 7;
  // Beyond this, assume the observer will never fire (a background tab that
  // never composites, an exotic embedded webview) and just show everything.
  // Hidden content is a far worse failure than a skipped animation.
  var FAILSAFE_MS = 2500;
  var revealObserver = null;

  function show(el) {
    if (el.hasAttribute('data-mg-in')) return;
    el.setAttribute('data-mg-in', '');
    var settle = setTimeout(finish, 1200);
    el.addEventListener('transitionend', finish);
    function finish() {
      clearTimeout(settle);
      el.removeEventListener('transitionend', finish);
      el.setAttribute('data-mg-done', '');
    }
  }

  function getRevealObserver() {
    if (revealObserver) return revealObserver;
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        revealObserver.unobserve(entry.target);
        show(entry.target);
      });
    }, {
      // Fire slightly before the element's top edge clears the fold, so
      // the motion is already underway by the time it is fully readable
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.05
    });
    return revealObserver;
  }

  function initReveal() {
    // Only nodes this pass has not already claimed — the MutationObserver
    // below re-runs this on every React render
    var nodes = document.querySelectorAll('.mg-reveal:not([data-mg-seen])');
    if (!nodes.length) return;

    // Stagger indices come from position within the group, so the cascade
    // reads in DOM order regardless of which card trips the observer first
    document.querySelectorAll('[data-mg-stagger]').forEach(function (group) {
      group.querySelectorAll(':scope > .mg-reveal').forEach(function (el, i) {
        el.style.setProperty('--mg-i', Math.min(i, STAGGER_CAP));
      });
    });

    nodes.forEach(function (el) {
      el.setAttribute('data-mg-seen', '');
      getRevealObserver().observe(el);
      setTimeout(function () { show(el); }, FAILSAFE_MS);
    });
  }

  /* ── Boot ─────────────────────────────────────────────────────────
     Reveal runs on a MutationObserver too: every page renders through
     React from a Babel-transformed inline script, so .mg-reveal nodes
     appear after DOMContentLoaded. */
  function boot() {
    startStarfield();

    // Arm the reveal only when we can actually drive it. Without this class
    // the hidden state in CSS never applies, so a failed script or a browser
    // without IntersectionObserver shows a plain, complete page.
    if ('IntersectionObserver' in window && !reduced.matches) {
      document.documentElement.classList.add('mg-anim');
    }
    initReveal();

    var pending = null;
    new MutationObserver(function () {
      clearTimeout(pending);
      pending = setTimeout(initReveal, 60);
    }).observe(document.getElementById('root') || document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
