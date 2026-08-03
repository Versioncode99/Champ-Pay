/* ==========================================================================
   ChampPay — behaviour
   Quiet by design. The masthead flips from reversed to solid as it leaves the
   photographic hero; one statement paints in as it is read; sections settle in.
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Scroll work is coalesced into a single rAF pass. */
  var jobs = [];
  var ticking = false;
  function run() { ticking = false; for (var i = 0; i < jobs.length; i++) jobs[i](); }
  function onFrame() { if (!ticking) { ticking = true; requestAnimationFrame(run); } }
  function addJob(fn) { jobs.push(fn); fn(); }
  window.addEventListener('scroll', onFrame, { passive: true });
  window.addEventListener('resize', onFrame);

  /* ---------------------------------------------------------------- Year */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------ Masthead */
  var masthead = document.getElementById('masthead');
  if (masthead) {
    var hero = document.getElementById('hero');
    var stuck = null;
    addJob(function () {
      // Flip once the bar would otherwise sit on the light page rather than the photo.
      var trigger = hero ? hero.offsetHeight - 96 : 24;
      var next = window.scrollY > trigger;
      if (next === stuck) return;
      stuck = next;
      masthead.classList.toggle('is-stuck', next);
      if (hero) masthead.classList.toggle('is-over', !next);
    });
  }

  /* ----------------------------------------------------------- Nav toggle */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ------------------------------------------- Statement — paints as read */
  var statement = document.getElementById('statement');
  if (statement) {
    var words = statement.textContent.trim().split(/\s+/);
    statement.innerHTML = words.map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    var els = Array.prototype.slice.call(statement.querySelectorAll('.w'));

    if (reduced) {
      els.forEach(function (w) { w.classList.add('is-read'); });
    } else {
      var last = -1;
      addJob(function () {
        var r = statement.getBoundingClientRect();
        var vh = window.innerHeight;
        if (r.bottom < -200 || r.top > vh + 200) return;
        var start = vh * 0.85, end = vh * 0.32;
        var p = Math.max(0, Math.min(1, (start - r.top) / (start - end)));
        var upto = Math.floor(p * els.length);
        if (upto === last) return;
        var from = Math.min(last < 0 ? 0 : last, upto);
        var to = Math.max(last, upto);
        for (var i = from; i <= to && i < els.length; i++) {
          if (i >= 0) els[i].classList.toggle('is-read', i < upto);
        }
        last = upto;
      });
    }
  }

  /* ---------------------------------------------------------- Reveal */
  var items = document.querySelectorAll('[data-reveal]');
  if (items.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
      items.forEach(function (el) { io.observe(el); });
    }
  }
})();
