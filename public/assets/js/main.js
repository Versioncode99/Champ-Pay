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
    // The home page opens on a photographic hero; interior pages open on the
    // compact night band. Either one is the dark ground the bar sits over.
    var hero = document.getElementById('hero') || document.querySelector('.phead');
    var stuck = null;
    addJob(function () {
      // Flip once the bar would otherwise sit on the light page rather than the dark head.
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

  /* -------------------------------------------------- Nav groups (dropdowns)
     On pointer devices CSS :hover opens the menu. The button exists for touch
     and for keyboard users, and is the only mechanism in the mobile drawer. */
  var groups = Array.prototype.slice.call(document.querySelectorAll('.navgroup'));
  groups.forEach(function (group) {
    var btn = group.querySelector('.navgroup__btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var open = !group.classList.contains('is-open');
      groups.forEach(function (g) {
        g.classList.remove('is-open');
        var b = g.querySelector('.navgroup__btn');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      group.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* Clicking away, or Escape, closes any open menu. */
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.navgroup')) {
      groups.forEach(function (g) {
        g.classList.remove('is-open');
        var b = g.querySelector('.navgroup__btn');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    groups.forEach(function (g) { g.classList.remove('is-open'); });
    if (nav && nav.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      if (toggle) { toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); }
    }
  });

  /* ---------------------------------------------------------- Reveal
     Content must never be left invisible. If the observer has not fired for an
     element within a short grace period — an off-screen render, a headless
     screenshot, a browser that never scrolls the page — it is shown anyway. */
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if (items.length) {
    var showAll = function () { items.forEach(function (el) { el.classList.add('is-in'); }); };

    if (reduced || !('IntersectionObserver' in window)) {
      showAll();
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
      items.forEach(function (el) { io.observe(el); });

      window.addEventListener('load', function () { setTimeout(showAll, 2500); });
    }
  }
})();
