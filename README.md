# champ-pay.com

Static marketing site for ChampPay. Plain HTML, CSS and JS — no build step, no framework.

## Run locally

```bash
node server.mjs
```

Then open <http://localhost:4173>.

## Layout

`public/` is the web root and the only thing deployed as static assets.

| File | Purpose |
|---|---|
| `public/index.html` | Main site |
| `public/contact.html` | Contact form |
| `public/legal.html` | Legal notice, regulatory status, privacy |
| `public/brand.html` | Brand system reference (internal, `noindex`) |
| `public/logos.html` | Logo direction options for review (internal, `noindex`) |
| `worker.js` | Worker entry: routes `/api/contact`, serves everything else from `public/` |
| `wrangler.jsonc` | Deployment config (assets binding, compatibility date) |
| `functions/api/contact.js` | Contact handler, imported by `worker.js` |
| `qa-responsive.html` | Responsive QA harness — dev only, not deployed |

`functions/` is a Cloudflare **Pages** convention. This project deploys as a **Worker**, which does not read that directory automatically, so `worker.js` wires the handler up explicitly. Moving or renaming either file breaks the contact form.

`PRODUCT.md` holds the product record; `DESIGN.md` holds the design direction contract and tokens. Read both before changing anything.

## Deploying

Cloudflare Pages, Direct Upload, onto the existing `champ-pay.com` zone.

### Contact form — needs configuration before it delivers

`functions/api/contact.js` is a Cloudflare Pages Function. Until these environment
variables are set in the Pages project it returns 503 and the form tells the visitor
it could not send, rather than silently dropping enquiries:

- `RESEND_API_KEY` — API key from [resend.com](https://resend.com) (free tier is enough)
- `CONTACT_TO` — where enquiries should arrive
- `CONTACT_FROM` — optional; defaults to a Resend sandbox sender until a sending
  domain is verified on `champ-pay.com`

## Content rules

The site makes **no claim** to hold acquiring, processing, gaming or banking licences,
because none are held. It publishes no customer names, volumes, or performance figures,
because there are none. See the "Our position" section on the homepage and `PRODUCT.md`.
Do not add trust signals that are not real.
