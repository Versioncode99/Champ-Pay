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

  /* ------------------------------------------------- Scroll progress (2026-08-06)
     A hairline across the top. Built here rather than in the shell so a page
     without scripting never renders a progress bar that cannot progress. */
  if (!reduced) {
    var bar = document.createElement('div');
    bar.className = 'progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    addJob(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    });
  }

  /* --------------------------------------------- Device tilt (2026-08-06)
     The one pointer-tracked object on the site. Deliberately singular: a page
     where everything follows the cursor reads as a demo, not as a document.
     Touch devices get the resting angle and nothing else. */
  var stage = document.querySelector('.stage--rig');
  var device = stage && stage.querySelector('.device');
  if (stage && device && !reduced && window.matchMedia('(hover: hover)').matches) {
    var REST_X = 8, REST_Y = -19, RANGE = 7;
    var tx = REST_X, ty = REST_Y, cx = REST_X, cy = REST_Y;
    var raf = null;

    function ease() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      device.style.setProperty('--rx', cx.toFixed(2) + 'deg');
      device.style.setProperty('--ry', cy.toFixed(2) + 'deg');
      if (Math.abs(tx - cx) > 0.01 || Math.abs(ty - cy) > 0.01) raf = requestAnimationFrame(ease);
      else raf = null;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(ease); }

    /* The transition is for the return-to-rest; while tracking, rAF owns it. */
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - 0.5;
      var ny = (e.clientY - r.top) / r.height - 0.5;
      device.style.transitionDuration = '0s';
      tx = REST_X - ny * RANGE * 2;
      ty = REST_Y + nx * RANGE * 2;
      kick();
    });
    stage.addEventListener('pointerleave', function () {
      device.style.transitionDuration = '';
      tx = REST_X; ty = REST_Y;
      kick();
    });
  }

  /* ----------------------------------------------- Stat odometer (2026-08-06)
     Counts a figure up once, on entry. The element's authored text is the
     source of truth and is restored exactly at the end, so prefixes, suffixes
     and units cannot drift — and with scripting off the real figure is what
     was in the HTML all along. */
  var figures = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  if (figures.length && !reduced && 'IntersectionObserver' in window) {
    var fio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        fio.unobserve(el);

        var final = el.textContent;
        var m = final.match(/^(\D*?)([\d.,]+)(.*)$/);
        if (!m) return;
        var target = parseFloat(m[2].replace(/,/g, ''));
        if (!isFinite(target)) return;

        var decimals = (m[2].split('.')[1] || '').length;
        var grouped = m[2].indexOf(',') > -1;
        var t0 = performance.now();
        var DUR = 1100;

        (function step(now) {
          var p = Math.min(1, (now - t0) / DUR);
          /* ease-out-cubic: fast commitment, soft landing */
          var v = target * (1 - Math.pow(1 - p, 3));
          if (p < 1) {
            el.textContent = m[1] +
              (grouped
                ? v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
                : v.toFixed(decimals)) +
              m[3];
            requestAnimationFrame(step);
          } else {
            el.textContent = final;
          }
        })(t0);
      });
    }, { threshold: 0.4 });
    figures.forEach(function (el) { fio.observe(el); });
  }
})();
