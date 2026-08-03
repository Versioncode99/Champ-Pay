/* ==========================================================================
   ChampPay — behaviour
   The authored motion is the switch-on: metal-halide lamps do not fade in,
   they come up in stages. Everything else stays quiet.
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Scroll work is coalesced into one rAF pass so listeners never run per-event. */
  var scrollJobs = [];
  var ticking = false;
  function runJobs() {
    ticking = false;
    for (var i = 0; i < scrollJobs.length; i++) scrollJobs[i]();
  }
  function onScrollFrame() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(runJobs);
    }
  }
  function addScrollJob(fn) {
    scrollJobs.push(fn);
    fn();
  }
  window.addEventListener('scroll', onScrollFrame, { passive: true });
  window.addEventListener('resize', onScrollFrame);

  /* ---------------------------------------------------------------- Year */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------- Masthead */
  var masthead = document.getElementById('masthead');
  if (masthead) {
    var stuck = null;
    addScrollJob(function () {
      var next = window.scrollY > 24;
      if (next !== stuck) {
        stuck = next;
        masthead.classList.toggle('is-stuck', next);
      }
    });
  }

  /* ------------------------------------------------------------ Nav toggle */
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

  /* --------------------------------------------------- The floodlight array */
  var head = document.getElementById('arrayHead');
  if (head) {
    // Cells are authored in the HTML so the array still renders without JS.
    // Only build them here if the markup did not supply them.
    var CELLS = 24;
    if (!head.children.length) {
      var frag = document.createDocumentFragment();
      for (var i = 0; i < CELLS; i++) {
        var c = document.createElement('span');
        c.className = 'cell';
        frag.appendChild(c);
      }
      head.appendChild(frag);
    }

    var cells = Array.prototype.slice.call(head.children);
    // A few lamps run warm — real arrays mix sodium and halide.
    var warmIdx = [7, 16];
    // Lamps fire bank by bank (column pairs), not in reading order.
    var order = [];
    var COLS = 6, ROWS = 4;
    [0, 3, 1, 4, 2, 5].forEach(function (col) {
      for (var row = 0; row < ROWS; row++) order.push(row * COLS + col);
    });
    var label = document.querySelector('.array__label');
    var hero = document.getElementById('hero');

    var lightUp = function () {
      if (hero) hero.classList.add('is-lit');

      if (reduced) {
        cells.forEach(function (c, i) {
          c.classList.add(warmIdx.indexOf(i) > -1 ? 'is-on--warm' : 'is-on');
        });
        if (label) label.textContent = 'Array 01 · at power';
        return;
      }

      order.forEach(function (idx, n) {
        setTimeout(function () {
          cells[idx].classList.add(warmIdx.indexOf(idx) > -1 ? 'is-on--warm' : 'is-on');
          if (n === order.length - 1 && label) {
            setTimeout(function () { label.textContent = 'Array 01 · at power'; }, 420);
          }
        }, 620 + n * 78);
      });
    };

    if (document.readyState === 'complete') lightUp();
    else window.addEventListener('load', lightUp);
  }

  /* ---------------------------------------------- Corridor ribbon (scoreboard) */
  var track = document.getElementById('ribbonTrack');
  if (track) {
    // `focus` marks a primary-focus corridor. Nothing here is operational, and
    // the ribbon must never imply otherwise.
    var items = [
      { code: 'LOS', name: 'Lagos', focus: true },
      { code: 'ABV', name: 'Abuja', focus: true },
      { code: 'ACC', name: 'Accra', focus: false },
      { code: 'NBO', name: 'Nairobi', focus: false },
      { code: 'LDN', name: 'London', focus: false },
      { code: 'JNB', name: 'Johannesburg', focus: false }
    ];
    var html = '';
    // Rendered twice so the marquee loops seamlessly at -50%.
    for (var pass = 0; pass < 2; pass++) {
      items.forEach(function (it) {
        html +=
          '<span class="ribbon__item' + (it.focus ? ' ribbon__item--live' : '') + '">' +
          '<span class="ribbon__dot"></span>' +
          '<span class="figure-mono">' + it.code + '</span>' +
          '<span class="code">' + it.name + '</span>' +
          '</span>';
      });
    }
    track.innerHTML = html;

    // Stop the marquee whenever it scrolls out of view — no reason to keep the
    // compositor busy animating something nobody can see.
    var ribbon = track.parentElement;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          track.style.animationPlayState = e.isIntersecting ? 'running' : 'paused';
        });
      }, { threshold: 0 }).observe(ribbon);
    }
  }

  /* ------------------------------------------- Thesis — scroll-linked value */
  var thesis = document.getElementById('thesisText');
  if (thesis) {
    var words = thesis.textContent.trim().split(/\s+/);
    thesis.innerHTML = words
      .map(function (w) { return '<span class="w">' + w + '</span>'; })
      .join(' ');
    var wordEls = Array.prototype.slice.call(thesis.querySelectorAll('.w'));

    if (reduced) {
      wordEls.forEach(function (w) { w.classList.add('is-read'); });
    } else {
      var lastUpto = -1;
      addScrollJob(function () {
        var r = thesis.getBoundingClientRect();
        var vh = window.innerHeight;
        // Only measure while the block is anywhere near the viewport.
        if (r.bottom < -200 || r.top > vh + 200) return;
        // Progress runs from the block entering the lower third to leaving the upper third.
        var start = vh * 0.82;
        var end = vh * 0.3;
        var p = (start - r.top) / (start - end);
        p = Math.max(0, Math.min(1, p));
        var upto = Math.floor(p * wordEls.length);
        if (upto === lastUpto) return;
        // Only touch the words that actually changed state.
        var from = Math.min(lastUpto < 0 ? 0 : lastUpto, upto);
        var to = Math.max(lastUpto, upto);
        for (var i = from; i <= to && i < wordEls.length; i++) {
          if (i < 0) continue;
          wordEls[i].classList.toggle('is-read', i < upto);
        }
        lastUpto = upto;
      });
    }
  }

  /* ----------------------------------------------------------- Reveal */
  var revealables = document.querySelectorAll('[data-reveal]');
  if (revealables.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      revealables.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
      revealables.forEach(function (el) { io.observe(el); });
    }
  }
})();
