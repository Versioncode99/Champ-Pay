# champ-pay.com

Marketing site for ChampPay. Plain HTML, CSS and JS — no framework, no bundler,
no client-side routing. There is one small build step (below) whose only job is
to stamp a shared header and footer onto each page.

## Run locally

```bash
node server.mjs
```

Then open <http://localhost:4173>. The dev server resolves extensionless paths
(`/about` → `about.html`) the same way the deployed Worker does.

## Build

```bash
node build.mjs
```

Pages are authored as content fragments in `src/pages/` and wrapped in
`src/shell.html`. The build writes `public/`, plus `sitemap.xml` and
`robots.txt`.

> **`public/*.html` is generated. Edit `src/pages/*.html` instead** — a change
> made directly in `public/` is silently destroyed by the next build.

Navigation lives in one place: the `NAV` and `FOOTER` arrays at the top of
`build.mjs`. Adding a page means adding a file in `src/pages/` and, if it should
appear in the menus, one line in those arrays.

Each page fragment opens with a `<!--meta { ... } -->` JSON block:

| Key | Purpose |
|---|---|
| `out` | Output path inside `public/` (e.g. `newsroom/my-post.html`) |
| `url` | Canonical URL; defaults to `out` minus the `.html` |
| `title`, `description` | `<title>`, meta description, Open Graph |
| `darkhero` | `true` when the page opens on a night ground, so the masthead starts reversed |
| `scripts` | Extra deferred scripts for that page |
| `schema` | JSON-LD object, emitted as `application/ld+json` |
| `noindex` | Adds `robots: noindex,nofollow` and omits the page from the sitemap |
| `priority` | Sitemap priority |

## Layout

`public/` is the web root and the only thing deployed.

| Path | Purpose |
|---|---|
| `src/shell.html` | Shared document shell — head, masthead, footer |
| `src/pages/*.html` | Page content fragments (the files you edit) |
| `build.mjs` | Build: nav definition, shell templating, sitemap, robots |
| `public/assets/css/main.css` | Design system — tokens, type, masthead, buttons, forms |
| `public/assets/css/pages.css` | Page architecture — page heads, cards, 3D device, ticker, newsroom |
| `public/assets/js/main.js` | Masthead state, nav menus, scroll reveal |
| `public/assets/js/market.js` | Live reference prices on `/crypto` (CoinGecko public API) |
| `public/assets/js/form.js` | Contact form validation and submission |
| `public/logos.html` | Logo direction options for review (internal, `noindex`, not in nav) |
| `worker.js` | Worker entry: routes `/api/contact`, serves everything else from `public/` |
| `wrangler.jsonc` | Deployment config (assets binding, compatibility date) |
| `functions/api/contact.js` | Contact handler, imported by `worker.js` |
| `og-card.html` | Dev-only harness for regenerating the social share image |
| `qa-responsive.html` | Responsive QA harness — dev only, not deployed |

`functions/` is a Cloudflare **Pages** convention. This project deploys as a
**Worker**, which does not read that directory automatically, so `worker.js`
wires the handler up explicitly. Moving or renaming either file breaks the
contact form.

`PRODUCT.md` holds the product record; `DESIGN.md` holds the design direction
contract and tokens. Read both before changing anything.

## Deploying

Cloudflare **Workers** (not Pages), project `champ-pay`, connected to the
GitHub repo. Every push to `main` rebuilds and redeploys automatically.

Run `node build.mjs` and commit the regenerated `public/` **before** pushing —
the deployment serves `public/` as-is and does not run this build itself.

### Contact form — needs configuration before it delivers

Until these environment variables are set on the Worker, the endpoint returns
503 and the form tells the visitor it could not send, rather than silently
dropping enquiries:

- `RESEND_API_KEY` — API key from [resend.com](https://resend.com) (free tier is enough)
- `CONTACT_TO` — where enquiries should arrive
- `CONTACT_FROM` — optional; defaults to a Resend sandbox sender until a sending
  domain is verified

> Verify a **subdomain** (e.g. `send.champ-pay.com`) rather than the root domain,
> so the SPF/DKIM records do not collide with the existing Google Workspace mail setup.

## Content rules

Read `PRODUCT.md` before writing copy. In short:

- **No invented trust signals.** No customer names, logos, testimonials, case
  studies, processing volumes, uptime figures or awards — because there are none.
- **Market figures are sourced.** Where the site cites market data it is
  attributed to the third party that published it and described as the market,
  not as ChampPay's own performance. Forward-looking figures are labelled indicative.
- **Capability is described at its actual stage.** In build means in build.
- **Third parties are not named** until an agreement is executed and they have
  agreed to be named.
