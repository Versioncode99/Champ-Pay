// Minimal static dev server for local preview. Not part of the deployed site.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

// Mirrors the deployed layout: public/ is the web root. Dev-only pages that
// live outside it (the QA harnesses) are still reachable via the fallback.
const ROOT = join(process.cwd(), 'public');
const FALLBACK = process.cwd();
const PORT = 4173;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);

    if (path === '/cdn-cgi/trace') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('colo=DEV\n');
      return;
    }

    // Dev parity for the Worker's /api/indicators route. Kept deliberately
    // simple — the deployed implementation, including its edge caching, is in
    // worker.js. Without this, data.js cannot be tested locally at all, because
    // the World Bank API refuses cross-origin browser requests.
    if (path === '/api/indicators') {
      const codes = { population: 'SP.POP.TOTL', gdp: 'NY.GDP.MKTP.CD' };
      const data = {};
      await Promise.all(Object.entries(codes).map(async ([key, code]) => {
        data[key] = null;
        try {
          const r = await fetch(`https://api.worldbank.org/v2/country/NGA/indicator/${code}?format=json&mrnev=1`);
          if (!r.ok) return;
          const j = await r.json();
          const row = Array.isArray(j) && Array.isArray(j[1]) ? j[1][0] : null;
          if (row && row.value != null) data[key] = { value: Number(row.value), year: row.date };
        } catch { /* leave null */ }
      }));
      res.writeHead(Object.values(data).some(Boolean) ? 200 : 503, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ source: 'World Bank Open Data', country: 'Nigeria', data }));
      return;
    }

    if (path.endsWith('/')) path += 'index.html';
    if (!extname(path)) path += '.html';

    const safe = normalize(path).replace(/^(\.\.[/\\])+/, '');
    let file = join(ROOT, safe);
    try {
      await stat(file);
    } catch {
      file = join(FALLBACK, safe);
      await stat(file);
    }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404</h1>');
  }
}).listen(PORT, () => console.log(`ChampPay dev server → http://localhost:${PORT}`));
