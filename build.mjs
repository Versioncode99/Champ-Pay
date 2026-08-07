/* ==========================================================================
   ChampPay — static site build
   --------------------------------------------------------------------------
   The site is plain HTML by design (Cloudflare Workers serves ./public as
   static assets — see wrangler.jsonc). But a fifteen-page site cannot have
   its navigation hand-copied fifteen times, so pages are authored as content
   fragments in src/pages/ and wrapped in src/shell.html here.

   Run:  node build.mjs        (then commit the generated public/*.html)

   IMPORTANT: public/*.html is generated. Edit src/pages/*.html instead.
   ========================================================================== */

import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'public');

const SITE = 'https://champ-pay.com';

/* -------------------------------------------------------------- navigation
   One definition, used by the masthead, the mobile drawer and the footer. */
const NAV = [
  {
    label: 'What we do',
    items: [
      ['/merchants', 'Merchant payments', 'QR and SoftPOS acceptance for Nigerian businesses'],
      ['/multi-currency', 'Multi-currency', 'Dollar balances, virtual cards, cross-border'],
      ['/crypto', 'Digital assets', 'Institutional digital-asset liquidity'],
    ],
  },
  {
    label: 'Who we work with',
    items: [
      ['/merchants-and-operators', 'Merchants & operators', 'Businesses taking payments every day'],
      ['/banks-and-sponsors', 'Banks & sponsors', 'Licensed institutions and scheme partners'],
      ['/investors', 'Investors', 'The market thesis and private diligence route'],
      ['/introducers', 'Referral partners', 'Origination and protected referral relationships'],
      ['/partners', 'Partners', 'Technology, distribution and specialist fit'],
    ],
  },
  {
    label: 'Company',
    items: [
      ['/about', 'About us', 'Why we exist and how we think'],
      ['/newsroom', 'Newsroom', 'Announcements and market notes'],
      ['/careers', 'Careers', 'Open roles and how we hire'],
      ['/contact', 'Contact', 'Start a conversation'],
    ],
  },
];

const FOOTER = [
  ['What we do', [
    ['/merchants', 'Merchant payments'],
    ['/multi-currency', 'Multi-currency'],
    ['/crypto', 'Digital assets'],
  ]],
  ['Who we work with', [
    ['/merchants-and-operators', 'Merchants & operators'],
    ['/banks-and-sponsors', 'Banks & sponsors'],
    ['/investors', 'Investors'],
    ['/introducers', 'Referral partners'],
    ['/partners', 'Partners'],
  ]],
  ['Company', [
    ['/about', 'About us'],
    ['/newsroom', 'Newsroom'],
    ['/careers', 'Careers'],
    ['/contact', 'Contact'],
    ['/legal', 'Legal & privacy'],
  ]],
];

const MARK = `<svg class="brand__mark" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
        <circle cx="43" cy="18" r="8.6"/><circle cx="66" cy="18" r="8.6"/><circle cx="89" cy="18" r="8.6"/>
        <circle cx="20" cy="39" r="8.6"/><circle cx="20" cy="61" r="8.6"/>
        <circle cx="43" cy="82" r="8.6"/><circle cx="66" cy="82" r="8.6"/><circle cx="89" cy="82" r="8.6"/>
      </svg>`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Wide editorial tables become labelled record cards on small screens. The
   labels are authored once in <th> and copied into data-label at build time,
   so the mobile version remains understandable without client-side scripting. */
function labelTableCells(html) {
  return html.replace(/<table\b[\s\S]*?<\/table>/g, (table) => {
    const head = table.match(/<thead\b[\s\S]*?<\/thead>/);
    if (!head) return table;
    const labels = Array.from(head[0].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g), (m) =>
      m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().replace(/"/g, '&quot;')
    );
    if (!labels.length) return table;
    return table.replace(/<tbody\b[\s\S]*?<\/tbody>/, (tbody) =>
      tbody.replace(/<tr\b[\s\S]*?<\/tr>/g, (row) => {
        let column = 0;
        return row.replace(/<td\b([^>]*)>/g, (cell, attrs) => {
          const label = labels[column++] || '';
          return /\bdata-label=/.test(attrs) ? cell : `<td${attrs} data-label="${label}">`;
        });
      })
    );
  });
}

/* ------------------------------------------------------------- the device
   The 3D phone is ~25 lines of structural markup — five faces, four rails and
   three buttons — none of which a page author should be re-typing. Pages write
   <!--device:merchant--> and get the whole object with the right screen in it.

   The screens are DRAWN, and every one carries the illustrative caption,
   because there is no shipped app and a faked screenshot would be a
   capability claim. See DESIGN.md and PRODUCT.md. */
const MARK_SM = `<svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
                    <circle cx="43" cy="18" r="8.6"/><circle cx="66" cy="18" r="8.6"/><circle cx="89" cy="18" r="8.6"/>
                    <circle cx="20" cy="39" r="8.6"/><circle cx="20" cy="61" r="8.6"/>
                    <circle cx="43" cy="82" r="8.6"/><circle cx="66" cy="82" r="8.6"/><circle cx="89" cy="82" r="8.6"/>
                  </svg>`;

const WAVE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M5 8.5a10 10 0 0 1 14 0"/><path d="M8 12a6 6 0 0 1 8 0"/><path d="M11 15.4a1.6 1.6 0 0 1 2 0"/>
              </svg>`;

const SCREENS = {
  /* Tap-to-pay: the flagship acceptance moment. */
  merchant: {
    alt: 'An illustration of a phone running the ChampPay merchant app, showing a five thousand naira charge awaiting a contactless tap',
    body: `<p class="scr__label">Amount due</p>
                <p class="scr__amt">&#8358;5,000.00</p>
                <p class="scr__merchant">Adeola&rsquo;s Kitchen &middot; Lekki Phase 1</p>
                <div class="tapzone" aria-hidden="true">
                  <span class="tapzone__ring"></span><span class="tapzone__ring"></span><span class="tapzone__ring"></span>
                  <span class="tapzone__core">${WAVE}</span>
                </div>
                <div class="scr__foot"><p class="code">Tap card or phone</p><span class="pill">Ready</span></div>`
  },

  /* Settlement: what the operator sees the morning after trading. */
  settle: {
    alt: 'An illustration of a phone showing a merchant settlement summary — the day’s takings, transaction count and settlement status',
    body: `<p class="scr__label">Settled today</p>
                <p class="scr__amt">&#8358;418,250</p>
                <p class="scr__merchant">Cleared 06:12 &middot; 214 transactions</p>
                <div class="scrlist" aria-hidden="true">
                  <div class="scrrow"><span>Card</span><b>&#8358;236,400</b></div>
                  <div class="scrrow"><span>QR</span><b>&#8358;131,900</b></div>
                  <div class="scrrow"><span>Transfer</span><b>&#8358;49,950</b></div>
                  <div class="scrrow scrrow--tot"><span>Fees</span><b>&#8358;2,140</b></div>
                </div>
                <div class="scr__foot"><p class="code">Next cycle 18:00</p><span class="pill">Settled</span></div>`
  },

  /* Multi-currency: the same account holding more than one shape of money. */
  wallet: {
    alt: 'An illustration of a phone showing a multi-currency account with dollar and naira balances',
    body: `<p class="scr__label">US dollar balance</p>
                <p class="scr__amt">$12,480.00</p>
                <p class="scr__merchant">Held against supplier invoices</p>
                <div class="scrlist" aria-hidden="true">
                  <div class="scrrow"><span>NGN</span><b>&#8358;3,140,000</b></div>
                  <div class="scrrow"><span>USD</span><b>$12,480.00</b></div>
                  <div class="scrrow"><span>Virtual card</span><b>&middot;&middot;&middot;&middot; 4417</b></div>
                  <div class="scrrow scrrow--tot"><span>Rate held</span><b>Mid-market</b></div>
                </div>
                <div class="scr__foot"><p class="code">Two currencies, one account</p><span class="pill">Active</span></div>`
  }
};

function deviceMarkup(name) {
  const s = SCREENS[name] || SCREENS.merchant;
  return `<div class="device" role="img" aria-label="${esc(s.alt)}">
            <div class="device__back" aria-hidden="true"></div>
            <div class="device__side device__side--l" aria-hidden="true"></div>
            <div class="device__side device__side--r" aria-hidden="true"></div>
            <div class="device__side device__side--t" aria-hidden="true"></div>
            <div class="device__side device__side--b" aria-hidden="true"></div>
            <div class="device__btn device__btn--vol" aria-hidden="true"></div>
            <div class="device__btn device__btn--vol2" aria-hidden="true"></div>
            <div class="device__btn device__btn--pwr" aria-hidden="true"></div>
            <div class="device__face" aria-hidden="true"></div>
            <div class="device__notch" aria-hidden="true"></div>
            <div class="device__screen">
              <div class="scr">
                <p class="scr__brand">${MARK_SM} CHAMPPAY</p>
                ${s.body}
              </div>
            </div>
          </div>`;
}

/* Marks the current page in the nav so people know where they are. */
const isCurrent = (href, url) => href === url || (href !== '/' && url.startsWith(href + '/'));

function buildNav(url) {
  const groups = NAV.map((g) => {
    const open = g.items.some(([href]) => isCurrent(href, url));
    const links = g.items
      .map(
        ([href, label, blurb]) =>
          `<a href="${href}"${isCurrent(href, url) ? ' aria-current="page"' : ''}>
              <span class="menu__label">${esc(label)}</span>
              <span class="menu__blurb">${esc(blurb)}</span>
            </a>`
      )
      .join('\n            ');
    return `<div class="navgroup${open ? ' is-active' : ''}">
          <button class="navgroup__btn" aria-expanded="false">${esc(g.label)}<svg class="navgroup__chev" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5"/></svg></button>
          <div class="menu">
            ${links}
          </div>
        </div>`;
  }).join('\n        ');

  return `${groups}
        <a class="btn btn--primary nav__cta" href="/contact">Start a conversation</a>
        <a class="nav__email" href="mailto:contact@champ-pay.com">contact@champ-pay.com</a>`;
}

function buildFooter(url) {
  return FOOTER.map(
    ([title, links]) => `<nav class="foot__nav" aria-label="${esc(title)}">
        <p class="code foot__navtitle">${esc(title)}</p>
        ${links
          .map(([href, label]) => `<a href="${href}"${isCurrent(href, url) ? ' aria-current="page"' : ''}>${esc(label)}</a>`)
          .join('\n        ')}
      </nav>`
  ).join('\n      ');
}

/* ------------------------------------------------------------------ build */
async function build() {
  const shell = await readFile(join(SRC, 'shell.html'), 'utf8');
  const files = (await readdir(join(SRC, 'pages'))).filter((f) => f.endsWith('.html'));

  const pages = [];

  for (const file of files) {
    const raw = await readFile(join(SRC, 'pages', file), 'utf8');
    const m = raw.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
    if (!m) throw new Error(`${file} is missing its <!--meta { ... } --> block`);
    const meta = JSON.parse(m[1]);
    let body = raw
      .slice(m[0].length)
      /* <!--device:merchant--> expands to the full 3D phone with that screen. */
      .replace(/<!--device:([a-z]+)-->/g, (_, name) => deviceMarkup(name));

    body = labelTableCells(body);

    /* A page head with no photograph behind it is a flat slab of near-black
       green filling the first viewport — which is exactly the thing that made
       the site feel cheap. Declaring "headimg" in the page meta injects the
       photographic ground, so this is one field per page rather than the same
       four lines pasted fourteen times. */
    if (meta.headimg) {
      const day = meta.headday ? ' phead--day' : '';
      body = body.replace(
        /<section class="phead">/,
        `<section class="phead phead--photo${day}">
    <div class="phead__media"><img src="${meta.headimg}" alt="" aria-hidden="true" fetchpriority="high" width="1344" height="768"></div>`
      );
    }

    const out = meta.out || file;
    const url = meta.url ?? '/' + out.replace(/\.html$/, '').replace(/^index$/, '');

    let html = shell
      .replace(/{{title}}/g, esc(meta.title))
      .replace(/{{description}}/g, esc(meta.description))
      .replace(/{{url}}/g, SITE + url)
      .replace(/{{ogimage}}/g, SITE + (meta.image || '/assets/img/og-default.png'))
      .replace(/{{robots}}/g, meta.noindex ? '<meta name="robots" content="noindex,nofollow">' : '')
      .replace(/{{bodyclass}}/g, meta.bodyclass || '')
      .replace(/{{mastheadclass}}/g, meta.darkhero ? ' is-over' : '')
      .replace(/{{mark}}/g, MARK)
      .replace(/{{nav}}/g, buildNav(url))
      .replace(/{{footernav}}/g, buildFooter(url))
      .replace(/{{head}}/g, meta.head || '')
      .replace(/{{scripts}}/g, (meta.scripts || []).map((s) => `<script src="${s}" defer></script>`).join('\n'))
      .replace(/{{schema}}/g, meta.schema ? `<script type="application/ld+json">${JSON.stringify(meta.schema)}</script>` : '')
      .replace(/{{body}}/g, body);

    await mkdir(dirname(join(OUT, out)), { recursive: true });
    await writeFile(join(OUT, out), html, 'utf8');
    if (!meta.noindex) pages.push({ url, priority: meta.priority ?? 0.6 });
    console.log('  ✓', out.padEnd(34), url);
  }

  /* ---------------------------------------------------------- sitemap.xml */
  const today = new Date().toISOString().slice(0, 10);
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    pages
      .sort((a, b) => b.priority - a.priority)
      .map((p) => `  <url><loc>${SITE}${p.url}</loc><lastmod>${today}</lastmod><priority>${p.priority.toFixed(1)}</priority></url>`)
      .join('\n') +
    `\n</urlset>\n`;
  await writeFile(join(OUT, 'sitemap.xml'), xml, 'utf8');

  await writeFile(
    join(OUT, 'robots.txt'),
    `User-agent: *\nAllow: /\nDisallow: /logos\nDisallow: /brand\n\nSitemap: ${SITE}/sitemap.xml\n`,
    'utf8'
  );

  console.log(`\n  ${files.length} pages · sitemap.xml · robots.txt\n`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
