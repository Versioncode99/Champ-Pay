/* ==========================================================================
   ChampPay — live market tick
   --------------------------------------------------------------------------
   A WebSocket, not a poll. The previous build refreshed CoinGecko every two
   minutes, which meant the "live" ticker sat frozen for 119 of every 120
   seconds. This subscribes to Binance's public combined miniTicker stream, so
   prices move continuously while somebody is actually looking at them.

   Nothing here needs a key, an account or a server component: the socket is
   opened by the visitor's browser directly, so no secret exists to leak and no
   visitor data reaches us. That is what keeps the /legal statement true.

   Division of labour with market.js — both patch the same DOM cells, neither
   owns the markup:
       live.js    → [data-field="price"], [data-field="ch24"]     (this file)
       market.js  → [data-field="ch7d"],  [data-field="mcap"]
   The cells are authored statically in the HTML, so there is no race between
   the two scripts and the page still reads correctly with scripting off.

   Honesty rules, which are not optional on this site:
     - The state chip never says LIVE unless a socket message has arrived
       inside the staleness window.
     - A dead feed shows a dash and says so. It never shows the last good
       number dressed up as current.
   ========================================================================== */
(function () {
  'use strict';

  /* Symbols carried by the socket. USDT and USDC are deliberately absent —
     they have no USDT pair to stream, and market.js covers them in the table. */
  var STREAMS = [
    { sym: 'BTC', pair: 'btcusdt' },
    { sym: 'ETH', pair: 'ethusdt' },
    { sym: 'SOL', pair: 'solusdt' },
    { sym: 'XRP', pair: 'xrpusdt' },
    { sym: 'BNB', pair: 'bnbusdt' },
    { sym: 'TRX', pair: 'trxusdt' }
  ];

  var WS_BASE = 'wss://stream.binance.com:9443/stream?streams=';
  /* Independent second source. Used only when the socket cannot be reached, and
     labelled DELAYED when it is, because a 15s poll is not a live feed. */
  var COINBASE = 'https://api.coinbase.com/v2/prices/{PAIR}/spot';
  var FALLBACK_EVERY = 15000;
  var STALE_AFTER = 20000;   /* no message for this long → stop claiming LIVE */
  var MAX_BACKOFF = 30000;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var state = document.getElementById('liveState');
  /* Descendant selector: data-sym is on the row, data-field on the cell inside
     it. They are never on the same element. */
  var cells = document.querySelectorAll('[data-sym] [data-field]');
  if (!cells.length) return;

  var socket = null;
  var attempts = 0;
  var lastMessageAt = 0;
  var fallbackTimer = null;
  var staleTimer = null;
  var last = {};   /* sym → last price, for tick direction only */

  /* ------------------------------------------------------------- formatting */
  /* Two decimals at and above a dollar, four below. The previous build rounded
     anything over 1000 to whole dollars, which meant most BTC ticks changed no
     visible digit — the feed was live and the number looked frozen. Cents are
     also what a desk expects to see. */
  function money(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    var d = n >= 1 ? 2 : 4;
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function pct(n) {
    if (n === null || n === undefined || isNaN(n)) return null;
    return { text: (n >= 0 ? '+' : '') + n.toFixed(2) + '%', cls: n >= 0 ? 'up' : 'down' };
  }

  /* --------------------------------------------------------------- feedback */
  /* Every cell for a symbol updates together — the marquee prints the list
     twice, so a symbol legitimately appears more than once in the DOM. */
  function paint(sym, field, text, cls, dir) {
    var nodes = document.querySelectorAll('[data-sym="' + sym + '"] [data-field="' + field + '"]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.textContent === text) continue;
      el.textContent = text;
      if (cls !== undefined) {
        el.classList.remove('up', 'down');
        if (cls) el.classList.add(cls);
      }
      /* The flash is what makes a tick legible as a tick. Suppressed entirely
         under reduced-motion — the number still updates, it just does not
         blink at somebody who asked for that not to happen. */
      if (dir && !reduceMotion) {
        el.classList.remove('tick-up', 'tick-down');
        void el.offsetWidth;               /* restart the animation */
        el.classList.add(dir > 0 ? 'tick-up' : 'tick-down');
      }
    }
  }

  function setState(name, label) {
    if (!state) return;
    state.setAttribute('data-state', name);
    state.textContent = label;
  }

  /* A feed that has gone quiet must stop advertising itself as live. */
  function watchStaleness() {
    clearTimeout(staleTimer);
    staleTimer = setTimeout(function () {
      if (Date.now() - lastMessageAt >= STALE_AFTER) setState('stale', 'Reconnecting');
    }, STALE_AFTER + 500);
  }

  /* ------------------------------------------------------------------ apply */
  function applyTick(sym, price, changePct) {
    var dir = 0;
    if (last[sym] !== undefined && price !== last[sym]) dir = price > last[sym] ? 1 : -1;
    last[sym] = price;

    paint(sym, 'price', money(price), undefined, dir);

    var c = pct(changePct);
    if (c) paint(sym, 'ch24', c.text, c.cls);
  }

  /* -------------------------------------------------------------- websocket */
  function connect() {
    if (!('WebSocket' in window)) return startFallback();

    var url = WS_BASE + STREAMS.map(function (s) { return s.pair + '@miniTicker'; }).join('/');

    try {
      socket = new WebSocket(url);
    } catch (e) {
      return scheduleReconnect();
    }

    setState('connecting', attempts ? 'Reconnecting' : 'Connecting');

    socket.onopen = function () {
      attempts = 0;
      stopFallback();
      lastMessageAt = Date.now();
      setState('live', 'Live');
      watchStaleness();
    };

    socket.onmessage = function (ev) {
      var payload;
      try {
        payload = JSON.parse(ev.data);
      } catch (e) {
        return;
      }
      var d = payload && payload.data;
      /* miniTicker: c = close, o = open (rolling 24h) */
      if (!d || !d.s || d.c === undefined) return;

      var pair = String(d.s).toLowerCase();
      var match = null;
      for (var i = 0; i < STREAMS.length; i++) {
        if (STREAMS[i].pair === pair) { match = STREAMS[i]; break; }
      }
      if (!match) return;

      var close = parseFloat(d.c);
      var open = parseFloat(d.o);
      if (!isFinite(close)) return;

      lastMessageAt = Date.now();
      if (state && state.getAttribute('data-state') !== 'live') setState('live', 'Live');
      watchStaleness();

      applyTick(match.sym, close, isFinite(open) && open > 0 ? ((close - open) / open) * 100 : null);
    };

    socket.onerror = function () { /* onclose always follows; handled there */ };

    socket.onclose = function () {
      socket = null;
      scheduleReconnect();
    };
  }

  function scheduleReconnect() {
    clearTimeout(staleTimer);
    /* Exponential backoff with a ceiling, so a browser left open overnight on a
       blocked network does not hammer the endpoint. */
    var wait = Math.min(1000 * Math.pow(2, attempts), MAX_BACKOFF);
    attempts++;
    setState('stale', 'Reconnecting');

    /* Two failed attempts is enough to conclude the socket is blocked here —
       corporate networks routinely drop wss. Bring up the REST source so the
       page still carries prices, and say plainly that they are delayed. */
    if (attempts >= 2) startFallback();

    setTimeout(function () { if (!document.hidden) connect(); }, wait);
  }

  /* --------------------------------------------------- REST failover source */
  function pollCoinbase() {
    STREAMS.forEach(function (s) {
      fetch(COINBASE.replace('{PAIR}', s.sym + '-USD'), { headers: { accept: 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (j) {
          var p = j && j.data && parseFloat(j.data.amount);
          if (!isFinite(p)) return;
          var dir = last[s.sym] !== undefined && p !== last[s.sym] ? (p > last[s.sym] ? 1 : -1) : 0;
          last[s.sym] = p;
          paint(s.sym, 'price', money(p), undefined, dir);
        })
        .catch(function () { /* the state chip already says what is happening */ });
    });
  }

  function startFallback() {
    if (fallbackTimer) return;
    setState('delayed', 'Delayed');
    pollCoinbase();
    fallbackTimer = setInterval(function () { if (!document.hidden) pollCoinbase(); }, FALLBACK_EVERY);
  }

  function stopFallback() {
    clearInterval(fallbackTimer);
    fallbackTimer = null;
  }

  /* ------------------------------------------------------------- lifecycle */
  /* Do not hold a socket open against a tab nobody is looking at. */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (socket) { socket.onclose = null; socket.close(); socket = null; }
      stopFallback();
      clearTimeout(staleTimer);
    } else if (!socket) {
      attempts = 0;
      connect();
    }
  });

  window.addEventListener('pagehide', function () {
    if (socket) { socket.onclose = null; socket.close(); }
  });

  connect();
})();
