# Design

<!-- impeccable:design-schema 1 -->

**Current: v3 — "Day and Night", multi-page (2026-08-04).**
v1 was "The Floodlight Array" (an all-dark page with a drawn CSS lamp grid);
v2 kept its idea but carried it with real photography instead of drawn
furniture; v3 extends v2 across fifteen pages. The tokens, type and two grounds
below are v2's and are unchanged — v3 adds page architecture, not a new look.

## Direction contract — DAY AND NIGHT

**THESIS.** Payments infrastructure is the floodlight, not the match: nobody in
the stadium ever looks at it, and without it there is no game after dark. The
page is a **light institutional document punctuated by full-bleed African night
photography**. It refuses the category default — the floating dashboard
screenshot on near-black with a neon gradient orb — and refuses its opposite,
the cream/serif/terracotta editorial page.

**OWN-WORLD.** Two grounds, alternating. *Day* is paper with a deep-green
accent, ruled with hairlines, set in engineered type. *Night* is the pitch
palette with a metal-halide mint accent, carrying photography and the product.
Panels are frames in a truss, not cards with shadows.

**STORY.** A merchant, bank, investor, introducer or partner arrives, sees
within one viewport that this is a serious multi-service payments company,
finds the page written for *them* rather than a paragraph inside someone
else's, and makes contact.

**FIRST VIEWPORT (home).** Full-bleed floodlit night photograph — the
Lekki-Ikoyi bridge. Reversed masthead. Headline bottom-left at display scale,
one lead line, two actions, and a thin capability strip pinned to the base.

**FIRST VIEWPORT (interior).** A compact night band — not a second full hero —
carrying breadcrumb, kicker, title and lead. Interior pages get to the point
inside one screen and leave the scale advantage to the home page.

## Colour

Strategy: **two grounds, one accent family.** Never "dark mode with an accent".

| Token | Value | Role |
|---|---|---|
| `--paper` | `#fbfcfb` | Day ground |
| `--paper-alt` | `#eff3f0` | Alternate day band |
| `--ink` | `#08130f` | Day text |
| `--ink-soft` | `#4c5f58` | Day secondary text |
| `--rule` | `#d9e1dc` | Day hairlines |
| `--accent` | `#0a6b49` | Day accent |
| `--accent-hi` | `#08573b` | Day accent, pressed |
| `--night` | `#05100c` | Night ground |
| `--night-alt` | `#0a1a13` | Raised night panels |
| `--halide` | `#e9f5ef` | Night text |
| `--halide-soft` | `#9fb8ae` | Night secondary text |
| `--beam` | `#7fe3be` | Night accent |
| `--sodium` | `#ffb347` | Warm/live state — used sparingly |
| `--rule-night` | `#22453a` | Night hairlines |

### Semantic tokens — the rule that matters

Components read `--fg`, `--fg-soft`, `--bg`, `--line`, `--acc`, `--acc-hi` and
`--acc-on`, never the raw palette. Any night ground remaps that set:
`.on-night`, `.phead`, `.cta` and `.masthead.is-over` all do.

> **This is load-bearing.** A night section that sets only `color` and forgets
> the token remap renders day-mode secondary ink on near-black — around 2.8:1,
> which looks fine in a screenshot and fails in fact. That bug shipped in v3's
> first pass and was caught by the contrast sweep. Buttons in particular are
> now entirely token-driven, so a new night section cannot reintroduce
> deep-green-on-near-black.

No gradients except photographic scrims. No glow or bloom filters.

## Type

- **Display:** Archivo Expanded, 600/700 — structural, wide, engineered.
- **Text:** Archivo 400/500.
- **Technical:** Martian Mono 400/500 — codes, figures, kickers, labels. Upper
  case with wide tracking at small sizes.

Two families only. Deliberately avoids the training-default display faces
(Fraunces, Playfair, Cormorant, Space Grotesk, Inter-as-display, DM, Outfit,
Plus Jakarta, Instrument).

## Composition

Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128. More space above
a heading than below it. Density varies deliberately: a dense technical passage
earns a quiet full-bleed one. Sections alternate day and night so a long page
has rhythm rather than uniform scroll.

## The device — the one dimensional object

A phone rendered in CSS 3D (`perspective` + `rotateX/Y/Z`, real transforms, no
image), running a tap-to-pay screen with concentric rings pulsing from a lit
core, and status chips floating beside it on the same perspective plane.

It exists because the site described QR and SoftPOS while showing nothing, and
because a company with no shipped app has no honest screenshot to use. It is
**drawn**, and captioned as illustrative, precisely so it cannot be mistaken for
a photograph of a shipping product.

## Motion

Native motion of the world: **the switch-on** — stepped and staggered, never a
uniform smooth fade.

- Section entry: staggered reveal, 90ms apart, ease-out, no bounce.
- Tap rings: three-stage ping on a 2.8s cycle.
- Ticker: continuous slow marquee, pauses on hover.
- No parallax, no scroll-jacking, no spinning counters.
- `prefers-reduced-motion`: everything renders at rest, marquee static, rings
  static, all content immediately visible.

> **Reveal safety.** `[data-reveal]` starts at `opacity: 0` only when the `.js`
> class is present, and `main.js` force-shows every remaining element 2.5s after
> load. The live v2 site was found rendering 17 of 17 reveal elements at
> `opacity: 0` in a headless capture — content that exists but cannot be seen is
> worse than content that never animates.

## Components

Frames, not cards: defined by hairlines and geometry, never drop shadows or
glassmorphism. Buttons are rectangular, token-driven. Nav is a hover menu on
pointer devices and an accordion drawer under 1000px. Inputs are cells with a
hairline underline that lights on focus.

## Identity

Mark: a floodlight head — lamp cells whose lit cells describe a **C**. Reads as
a solid geometric mark at favicon scale.

Wordmark: **CHAMPPAY** in Archivo Expanded 700, tight tracking.

**Not final.** Seven directions live at `/logos` (internal, `noindex`) awaiting
a decision.

## Imagery

**Real photography only, and every image is checked for third-party marks
before use.** Five sourced photographs were rejected and deleted during v2 for
carrying NFL/Super Bowl, Mercedes-Benz, Paris Saint-Germain, Mastercard, Pepsi,
LaLiga and Athletic Bilbao branding. Stadium and crowd photography is almost
universally branded; African urban night and infrastructure is cleaner *and*
more on-brief. Repeat the contact-sheet check (`qa-images.html` pattern) for any
new image.

The social share card is generated from the brand system itself
(`og-card.html` → `public/assets/img/og-default.png`), not sourced.

## Content law

Per `PRODUCT.md`: no customers, logos, volumes, certifications, testimonials or
performance statistics — none exist. Any figure that appears describes the
*market*, is attributed to its publisher, and is labelled as such. Trust is
carried entirely by precision of language and quality of execution.
