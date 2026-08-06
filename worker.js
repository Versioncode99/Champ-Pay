/**
 * ChampPay — Worker entry point.
 *
 * Serves everything in public/ as static assets, and handles the one dynamic
 * route the site has. `functions/` is a Pages convention that the Workers
 * runtime does not read on its own, so the contact handler is wired up here.
 */
import { onRequestPost } from './functions/api/contact.js';

/**
 * World Bank indicators for Nigeria, proxied.
 *
 * The World Bank API sends no `Access-Control-Allow-Origin`, so a browser
 * cannot call it directly — verified 2026-08-06, it fails CORS preflight from
 * any origin. Fetching it here instead is the whole reason this route exists.
 * Nothing about the visitor is forwarded: the Worker makes its own request.
 *
 * These are annual figures, so they are cached hard at the edge. One origin
 * fetch serves every visitor for a day.
 */
// Verified against the live API 2026-08-06: both return a current 2025 value.
// IT.CEL.SETS.P2 (mobile subscriptions per 100) was tried and dropped — the
// endpoint returns an HTML error page for it rather than JSON, and then hangs.
// Do not re-add an indicator without checking it actually resolves.
const INDICATORS = {
  population: 'SP.POP.TOTL',
  gdp: 'NY.GDP.MKTP.CD'
};

async function nigeriaIndicators() {
  const entries = await Promise.all(
    Object.entries(INDICATORS).map(async ([key, code]) => {
      try {
        const res = await fetch(
          `https://api.worldbank.org/v2/country/NGA/indicator/${code}?format=json&mrnev=1`,
          { cf: { cacheTtl: 86400, cacheEverything: true } }
        );
        if (!res.ok) return [key, null];
        const json = await res.json();
        // Shape is [metadata, rows]; mrnev=1 returns a single row.
        const row = Array.isArray(json) && Array.isArray(json[1]) ? json[1][0] : null;
        if (!row || row.value == null) return [key, null];
        return [key, { value: Number(row.value), year: row.date }];
      } catch {
        // One failed indicator must not take the other two down.
        return [key, null];
      }
    })
  );

  return Object.fromEntries(entries);
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === '/api/contact') {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', {
          status: 405,
          headers: { Allow: 'POST' }
        });
      }
      return onRequestPost({ request, env });
    }

    if (pathname === '/api/indicators') {
      const data = await nigeriaIndicators();
      const anything = Object.values(data).some(Boolean);

      return new Response(JSON.stringify({ source: 'World Bank Open Data', country: 'Nigeria', data }), {
        status: anything ? 200 : 503,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          // A day in the browser, a week at the edge while it revalidates.
          'cache-control': anything ? 'public, max-age=86400, s-maxage=604800' : 'no-store'
        }
      });
    }

    return env.ASSETS.fetch(request);
  }
};
