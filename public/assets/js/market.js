/* ==========================================================================
   ChampPay — market depth (CoinGecko)
   --------------------------------------------------------------------------
   The socket in live.js carries price and 24h change, and carries them tick by
   tick. It does not carry market capitalisation or a 7-day change, so this
   fills those in on a slow poll — they are slow-moving figures and do not want
   a socket.

   Rewritten 2026-08-06. The previous version rebuilt the whole <tbody> and the
   whole marquee with innerHTML on every refresh, which (a) fought live.js for
   the same cells and (b) restarted the marquee animation every two minutes.
   Rows are now authored in the HTML and every source patches only its own
   fields. Nothing here destroys markup it does not own.

   Public endpoint, no key, called from the visitor's browser.
   ========================================================================== */
(function () {
  'use strict';

  var ENDPOINT =
    'https://api.coingecko.com/api/v3/coins/markets' +
    '?vs_currency=usd' +
    '&ids=bitcoin,ethereum,tether,solana,ripple,usd-coin,binancecoin,tron' +
    '&order=market_cap_desc&sparkline=false&price_change_percentage=24h,7d';

  var REFRESH = 120000;  /* comfortably inside the free tier */

  /* CoinGecko id → the data-sym used in the markup. */
  var ID_TO_SYM = {
    bitcoin: 'BTC', ethereum: 'ETH', tether: 'USDT', solana: 'SOL',
    ripple: 'XRP', 'usd-coin': 'USDC', binancecoin: 'BNB', tron: 'TRX'
  };

  /* Symbols the socket does not stream — this file owns their price too. */
  var PRICE_OWNED_HERE = { USDT: true, USDC: true };

  var stamp = document.getElementById('mktStamp');
  /* Descendant selector — data-sym is on the row, data-field on the cell. */
  if (!document.querySelector('[data-sym] [data-field]')) return;

  function cap(n) {
    if (!n) return '—';
    if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    return '$' + n.toLocaleString('en-US');
  }

  /* Matches live.js exactly — two sources writing the same cell must agree on
     format, or a failover looks like a data error. */
  function money(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    var d = n >= 1 ? 2 : 4;
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function pct(n) {
    if (n === null || n === undefined) return null;
    return { text: (n >= 0 ? '+' : '') + n.toFixed(2) + '%', cls: n >= 0 ? 'up' : 'down' };
  }

  function paint(sym, field, text, cls) {
    var nodes = document.querySelectorAll('[data-sym="' + sym + '"] [data-field="' + field + '"]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = text;
      if (cls !== undefined) {
        nodes[i].classList.remove('up', 'down');
        if (cls) nodes[i].classList.add(cls);
      }
    }
  }

  function load() {
    if (document.hidden) return;

    fetch(ENDPOINT, { headers: { accept: 'application/json' }, cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (rows) {
        if (!Array.isArray(rows) || !rows.length) throw new Error('empty');

        rows.forEach(function (c) {
          var sym = ID_TO_SYM[c.id];
          if (!sym) return;

          paint(sym, 'mcap', cap(c.market_cap));

          var w = pct(c.price_change_percentage_7d_in_currency);
          if (w) paint(sym, 'ch7d', w.text, w.cls);

          /* Only touch price and 24h for the assets live.js does not stream —
             otherwise a two-minute-old figure would overwrite a live one. */
          if (PRICE_OWNED_HERE[sym]) {
            paint(sym, 'price', money(c.current_price));
            var d = pct(c.price_change_percentage_24h_in_currency);
            if (d) paint(sym, 'ch24', d.text, d.cls);
          }
        });

        if (stamp) {
          stamp.textContent =
            'Price and 24h change stream from Binance. Market cap and 7d from CoinGecko, updated ' +
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
            '. Public data, shown for market context only.';
        }
      })
      .catch(function () {
        if (stamp) {
          stamp.textContent =
            'Depth data (market cap, 7d) is temporarily unavailable. It will resume automatically.';
        }
      });
  }

  load();
  setInterval(load, REFRESH);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) load(); });
})();
