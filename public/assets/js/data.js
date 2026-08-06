/* ==========================================================================
   ChampPay — reference data (FX · World Bank · edge)
   --------------------------------------------------------------------------
   Three keyless public sources, each answering something the site previously
   asserted without evidence:

     1. open.er-api.com  → USD/NGN and the majors. The multi-currency line is
        the second of three business lines and carried no data at all.
     2. World Bank Open Data → Nigeria population, mobile subscriptions per 100
        people, GDP. A named third-party publisher, which is what PRODUCT.md
        requires of any figure on this site: it describes Nigeria, not ChampPay.
        Mobile penetration in particular is the SoftPOS argument stated as fact
        rather than as adjective.
        Read through our own Worker at /api/indicators, not directly: the World
        Bank API sends no Access-Control-Allow-Origin and a browser cannot call
        it (verified 2026-08-06). The Worker fetches it and caches it for a day.
     3. Cloudflare /cdn-cgi/trace → the visitor's own edge colo. Same-origin,
        one request, and true.

   All three are read by the visitor's browser. Nothing needs a key and nothing
   about a visitor reaches us. Every target degrades to the em-dash that is
   already in the markup, so a blocked network costs the page nothing.
   ========================================================================== */
(function () {
  'use strict';

  var FX = 'https://open.er-api.com/v6/latest/USD';
  var WB = '/api/indicators';       /* our Worker — see the header note */
  var TRACE = '/cdn-cgi/trace';

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el && text) el.textContent = text;
  }

  /* ------------------------------------------------------------------ 1. FX */
  function loadFx() {
    if (!document.querySelector('[data-fx]')) return;

    fetch(FX, { headers: { accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (j) {
        if (!j || j.result !== 'success' || !j.rates) throw new Error('bad payload');

        var nodes = document.querySelectorAll('[data-fx]');
        for (var i = 0; i < nodes.length; i++) {
          var code = nodes[i].getAttribute('data-fx');
          var rate = j.rates[code];
          if (rate === undefined) continue;

          /* Naira prints whole; the majors want decimals to mean anything. */
          nodes[i].textContent = rate >= 100
            ? rate.toLocaleString('en-US', { maximumFractionDigits: 0 })
            : rate.toFixed(4);
        }

        var when = j.time_last_update_utc
          ? new Date(j.time_last_update_utc).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
          : null;
        setText('fxStamp',
          'Mid-market reference rates against the US dollar' + (when ? ', published ' + when : '') +
          '. Source: open.er-api.com. Indicative only — not a ChampPay quote or a dealable rate.');
      })
      .catch(function () {
        setText('fxStamp', 'Reference rates are temporarily unavailable. They will resume automatically.');
      });
  }

  /* ---------------------------------------------------------- 2. World Bank */
  var INDICATORS = [
    { key: 'population', target: 'wbPopulation', format: 'compact' },
    { key: 'gdp',        target: 'wbGdp',        format: 'usd' }
  ];

  function compact(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'bn';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'm';
    return Math.round(n).toLocaleString('en-US');
  }

  function loadWorldBank() {
    if (!document.getElementById('wbPopulation') && !document.getElementById('wbMobile')) return;

    fetch(WB, { headers: { accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (j) {
        if (!j || !j.data) throw new Error('bad payload');

        var years = [];

        INDICATORS.forEach(function (ind) {
          var el = document.getElementById(ind.target);
          var d = j.data[ind.key];
          if (!el || !d || d.value === null || d.value === undefined) return;

          var v = Number(d.value);
          if (ind.format === 'compact') el.textContent = compact(v);
          else if (ind.format === 'perhundred') el.textContent = Math.round(v);
          else el.textContent = '$' + (v / 1e9).toFixed(0) + 'bn';

          if (d.year && years.indexOf(d.year) === -1) years.push(d.year);
        });

        if (!years.length) throw new Error('no values');

        years.sort();
        /* The block mixes two publishers, so both are named. */
        setText('wbStamp',
          'Population and GDP: World Bank Open Data, Nigeria (' +
          (years[0] === years[years.length - 1] ? years[0] : years[0] + '–' + years[years.length - 1]) +
          '). Rates: open.er-api.com, indicative. These figures describe Nigeria, not ChampPay.');
      })
      .catch(function () {
        /* The em-dashes in the markup stand — better an honest blank than a
           number nobody can source. */
        setText('wbStamp', 'Published Nigeria indicators are temporarily unavailable.');
      });
  }

  /* ---------------------------------------------------------------- 3. Edge */
  function loadEdge() {
    var el = document.getElementById('edgeColo');
    if (!el) return;

    fetch(TRACE, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : Promise.reject(); })
      .then(function (txt) {
        var colo = /(?:^|\n)colo=([A-Z]{3})/.exec(txt);
        if (colo) el.textContent = colo[1];
      })
      .catch(function () { /* leave the placeholder */ });
  }

  loadFx();
  loadWorldBank();
  loadEdge();
})();
