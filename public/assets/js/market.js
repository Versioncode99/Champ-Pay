/* ==========================================================================
   ChampPay — live reference market data
   --------------------------------------------------------------------------
   Public CoinGecko endpoint. No key, no account, no server component: the
   request is made from the visitor's browser, so nothing here needs a secret
   and nothing about a visitor reaches us.

   If the request fails or is rate-limited, the page keeps a plain, honest
   fallback rather than showing stale or invented numbers. This data is
   market context only — see the copy on /crypto.

   To move to a keyed plan later: set ENDPOINT to the pro host and append
   &x_cg_demo_api_key=... — the render code below does not change.
   ========================================================================== */
(function () {
  'use strict';

  var ENDPOINT =
    'https://api.coingecko.com/api/v3/coins/markets' +
    '?vs_currency=usd' +
    '&ids=bitcoin,ethereum,tether,solana,ripple,usd-coin,binancecoin,tron' +
    '&order=market_cap_desc&sparkline=false&price_change_percentage=24h,7d';

  var REFRESH = 120000; /* two minutes — comfortably inside the free tier */

  var body = document.getElementById('mktBody');
  var track = document.getElementById('tickerTrack');
  var stamp = document.getElementById('mktStamp');
  if (!body && !track) return;

  /* --------------------------------------------------------------- format */
  function money(n) {
    if (n === null || n === undefined) return '—';
    var d = n >= 1000 ? 0 : n >= 1 ? 2 : 4;
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function cap(n) {
    if (!n) return '—';
    if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    return '$' + n.toLocaleString('en-US');
  }
  function pct(n) {
    if (n === null || n === undefined) return { text: '—', cls: '' };
    return { text: (n >= 0 ? '+' : '') + n.toFixed(2) + '%', cls: n >= 0 ? 'up' : 'down' };
  }
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); };

  /* --------------------------------------------------------------- render */
  function renderTable(rows) {
    if (!body) return;
    body.innerHTML = rows
      .map(function (c) {
        var d = pct(c.price_change_percentage_24h_in_currency);
        var w = pct(c.price_change_percentage_7d_in_currency);
        return (
          '<tr>' +
          '<td>' + esc(c.name) + '<span class="sym">' + esc((c.symbol || '').toUpperCase()) + '</span></td>' +
          '<td>' + money(c.current_price) + '</td>' +
          '<td class="' + d.cls + '">' + d.text + '</td>' +
          '<td class="' + w.cls + '">' + w.text + '</td>' +
          '<td>' + cap(c.market_cap) + '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  function renderTicker(rows) {
    if (!track) return;
    var one = rows
      .map(function (c) {
        var d = pct(c.price_change_percentage_24h_in_currency);
        return (
          '<div class="tick">' +
          '<span class="tick__sym">' + esc((c.symbol || '').toUpperCase()) + '</span>' +
          '<span class="tick__px">' + money(c.current_price) + '</span>' +
          '<span class="tick__ch ' + d.cls + '">' + d.text + '</span>' +
          '</div>'
        );
      })
      .join('');
    /* The marquee translates by exactly -50%, so the list is written twice. */
    track.innerHTML = one + one;
  }

  function fail() {
    if (body && !body.querySelector('tr td:not([colspan])')) {
      body.innerHTML =
        '<tr><td colspan="5" style="text-align:left;color:var(--halide-soft)">' +
        'Live market data is unavailable right now. It will resume automatically.' +
        '</td></tr>';
    }
    if (track && track.children.length <= 1) {
      track.innerHTML = '<div class="tick"><span class="tick__sym">Reference market data unavailable</span></div>';
    }
  }

  /* ----------------------------------------------------------------- load */
  function load() {
    /* Do not poll a page nobody is looking at. */
    if (document.hidden) return;

    fetch(ENDPOINT, { headers: { accept: 'application/json' }, cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (rows) {
        if (!Array.isArray(rows) || !rows.length) throw new Error('empty');
        renderTable(rows);
        renderTicker(rows);
        if (stamp) {
          stamp.textContent =
            'Source: CoinGecko public API · updated ' +
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      })
      .catch(fail);
  }

  load();
  setInterval(load, REFRESH);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) load(); });
})();
