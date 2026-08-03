# Design

<!-- impeccable:design-schema 1 -->

## Direction contract — THE FLOODLIGHT ARRAY

**THESIS.** Payments infrastructure is the floodlight, not the match: nobody in the stadium ever looks at it, and without it there is no game after dark. ChampPay lights markets that others leave unlit. This surface refuses the category default — the floating dashboard screenshot on near-black with a neon gradient orb — and refuses its opposite, the cream/serif/terracotta editorial page.

**OWN-WORLD.** The lamp array. A saturated floodlit-pitch green ground (never neutral black), ruled by a visible hairline lattice into discrete cells. Two lamp temperatures carry all accent: cool metal-halide mint for *lit*, warm sodium amber for *live*. Type is engineered, not editorial — Archivo Expanded for structural display, Archivo for text, Martian Mono for codes and figures. Panels are frames in a truss, not cards with shadows.

**STORY.** A gaming operator, bank, investor or introducer arrives, understands within one viewport that this is African payment infrastructure built for the gaming vertical, sees a company that speaks precisely about what it is building rather than overclaiming, and makes contact.

**FIRST VIEWPORT.** Full-bleed pitch field. Wordmark top-left, mono nav and one primary action top-right. Left two-thirds: mono eyebrow with a lit-cell marker, then a three-line Archivo Expanded headline at display scale, one line of body, primary action. Right: the floodlight array — a real cell grid that warms bank-by-bank on load and throws an elliptical pool of light across the lower field. A mono corridor ribbon (LOS · ABV · ACC · JNB · LDN) runs along the bottom edge like a scoreboard strip.

**FORM.** Grounded direction 7 of 7 (floodlight arrays), assigned by seed key `3cf65498`, scope direction, mode persuade. Challengers weighed and rejected: collider event display lost on audience identification and lands in the near-black-plus-neon rut; paper automata, raku, character sheet, risograph and minihompy room all fail institutional credibility for a bank risk reader.

## Colour

Strategy: **Committed** — a saturated green field owns 40–60% of every surface. This is not "dark mode with an accent"; the ground is a hue.

| Token | Value | Role |
|---|---|---|
| `--pitch-void` | `#05100C` | Page ground, deepest |
| `--pitch-deep` | `#0A1A13` | Section ground |
| `--pitch-mid` | `#0F2A1F` | Raised panels, cells |
| `--lattice` | `#22453A` | Hairline rules, cell borders, truss structure |
| `--halide` | `#E4F7EF` | Primary text, full illumination |
| `--beam` | `#7FE3BE` | Lit state, primary accent, active cells |
| `--sodium` | `#FFB347` | Live/warm state, secondary accent — used sparingly |
| `--dim` | `#7A9A8C` | Muted text, dormant cells |

Rules: `--sodium` never exceeds ~5% of a viewport. Never place `--beam` and `--sodium` adjacent at equal weight. No gradients except the single radial light-pool, which is a physical effect, not decoration. No glow/bloom filters — illumination is expressed through value and cell state, not blur.

## Type

- **Display:** Archivo Expanded, 600/700. Structural, wide, engineered — the truss head. Tight tracking at large sizes.
- **Text:** Archivo, 400/500.
- **Technical:** Martian Mono, 400/500 — corridor codes, figures, eyebrows, labels, nav. Uppercase with wide tracking at small sizes.

Two families only. Deliberately avoids the training-default display faces (Fraunces, Playfair, Cormorant, Space Grotesk, Inter-as-display, DM, Outfit, Plus Jakarta, Instrument).

## Composition

The lamp grid is the compositional law. Content aligns to a visible cell structure; hairline `--lattice` rules articulate it. Sections are *banks* of the array. Asymmetry is normal — the array is wider than the text column and content sits inside it off-centre.

Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128 / 192. More space above a heading than below it. Density varies deliberately: a dense technical passage earns a quiet full-bleed one.

## Motion

Native motion of the world: **the switch-on.** Metal-halide lamps do not fade in — they come up in stages, bank by bank, with a warm-up. Motion is therefore *stepped and staggered*, never a smooth uniform fade.

- Section entry: cells illuminate in a staggered sequence, 40–60ms apart, ease-out, no bounce.
- The hero array runs its warm-up once on load.
- Corridor ribbon: continuous slow marquee, pauses on hover.
- No parallax, no scroll-jacking, no counters spinning up (there are no real figures to count).
- `prefers-reduced-motion`: every cell renders lit at rest, marquee static, all content immediately visible. The page must be complete and legible with zero animation.

## Components

Frames, not cards: panels are defined by `--lattice` hairlines and cell geometry, never by drop shadows or glassmorphism. Buttons are rectangular with a 2px lit edge on the action side. Inputs are cells in the grid with a lattice underline that lights on focus. Nav is mono uppercase with a lit-cell marker on the active item.

## Identity

Mark: a floodlight head — a 4×4 grid of lamp cells inside a subtly tapered housing, where the lit cells describe a **C**. Reads as a solid geometric mark at favicon scale and resolves into the C at display scale. Fuses the championship motif with the floodlight world without any literal crown or trophy clipart.

Wordmark: **CHAMPPAY** in Archivo Expanded 700, tight tracking, with `PAY` carrying the beam colour at reduced opacity — or set solid where contrast demands.

## Content law

Per PRODUCT.md: no customers, no logos, no volumes, no certifications, no testimonials, no statistics. Not one number on this site describes ChampPay's own performance, because none exists yet. Trust is carried entirely by precision of language and quality of execution. Any figure that appears describes the *market*, is sourced, and is labelled as such.
