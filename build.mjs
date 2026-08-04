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
      ['/investors', 'Investors', 'Capital backing the build'],
      ['/introducers', 'Introducers', 'Origination and referral relationships'],
      ['/partners', 'Partners', 'Who we build alongside'],
    ],
  },
  {
    label: 'Company',
    items: [
      ['/about', 'About us', 'Who we are and how we got here'],
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
    ['/introducers', 'Introducers'],
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
        <a class="btn btn--primary nav__cta" href="/contact">Start a conversation</a>`;
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
    const body = raw.slice(m[0].length);

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
