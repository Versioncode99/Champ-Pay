# Product

<!-- impeccable:product-schema 1 -->

> **Revised 2026-08-04.** The first version of this file described ChampPay as a
> payments company for the gaming/high-risk vertical, positioned against Adyen,
> Checkout.com and Nuvei. That was a materially narrower reading than the
> business, and the site built on it was rebuilt. ChampPay is a **multi-service,
> multi-currency** company; gaming and nightlife are one *target merchant
> segment* inside phase-one go-to-market, not the thesis.

## Platform

web

## Users

Five audiences, all B2B, all deciding whether ChampPay is credible enough to
enter a conversation with. None are consumers; nobody signs up self-serve.

1. **Merchants & operators** — restaurants and QSR, retail chains, events,
   hospitality and nightlife, high-transaction SMEs. Situation: paying for
   terminal hardware they must buy, carry, charge and replace, waiting days for
   settlement, reconciling by hand. Job: get paid faster with less equipment.
2. **Banks & sponsor partners** — the licensed institutions whose permissions
   the regulated parts of the product run on. Job: decide whether this
   counterparty is a credible risk, and defend that decision internally.
3. **Investors** — funding the build. Job: understand the wedge, the market and
   the sequencing without wading through padding.
4. **Introducers** — relationship-led originators. Job: decide whether ChampPay
   is safe to put their own name behind, and get terms in writing first.
5. **Partners** — technology, settlement, distribution and advisory
   counterparties. Job: understand where the boundary sits.

The common job: *decide whether to take a meeting.* Site success is a qualified
inbound enquiry, not a conversion.

## Product Purpose

ChampPay is building acceptance, settlement and treasury infrastructure for
African businesses, starting with Nigeria domestic. Three lines, one company:

1. **Merchant payment infrastructure** *(flagship)* — QR (static and dynamic),
   Android **SoftPOS** (the merchant's own NFC phone is the terminal), proximity
   P2P transfers, instant/same-day settlement, and a merchant operating system.
   Positioned as *"not another wallet — a new layer in the payment stack."*
   Real competitor set: **OPay, PalmPay, Moniepoint.**
2. **Multi-currency** *(phase two of the same product)* — USD balances, virtual
   USD cards, cross-border. FX spread is a named revenue line. Launched with
   licensed partners, in step with the CBN.
3. **Institutional digital-asset liquidity** — B2B only, served to exchanges,
   fintechs and treasury desks under written agreement. **Deliberately the least
   public line on the site** — direction only, no rates, no counterparties, no
   structure. Detail goes under NDA, not on a web page.

**PADSCE / the Mauritius exchange venture stays off the website entirely** —
standing instruction, unchanged.

## Positioning

A multi-service, multi-currency payments company built from inside the Nigerian
market rather than approaching it from outside. The wedge is removing the
terminal from acceptance; the compounding advantage is that a company already in
the flow earns the right to hold the merchant's currency and treasury.

Not positioned on price. Market evidence is that businesses in these corridors
now prioritise **settlement speed over rate**, so a rate-led argument fights
yesterday's battle.

## Operating Context

Evaluation happens in an inbox or a meeting, often on mobile, often forwarded.
The site is usually the second thing seen after an email — it confirms or
destroys a first impression, and it will be opened next to competitor sites
during diligence.

## Capabilities and Constraints

**Real today:** Nigeria-incorporated company (Champ Pay Nigeria Limited); an
in-market network of operator, banking and government relationships; a
documented commercial framework (introducer agreements, NCNDA, non-circumvention
and tail terms); primary market research across African exchanges; the domain
and infrastructure.

**Not held — must never be claimed as present capability:**

- Card-scheme acquiring registration (ISO/PayFac under Visa/Mastercard)
- Gaming-authority licensing in any jurisdiction
- Bank facilitation / EMI / payment-institution permissions
- PCI DSS certification
- VASP or other digital-asset licensing — status unconfirmed
- Own pay-in, payout or settlement rails

**Terminology:** "acquiring", "processing", "licensed", "regulated" and "PCI
compliant" are reserved words. They may describe the industry or the road ahead.
They may never describe ChampPay's present capability.

### On disclaimers — changed 2026-08-04

The previous site carried an explicit two-column *"what we hold / what we do not
hold"* ledger on the homepage plus a regulatory negative-disclaimer in the
footer and on the legal page. **These were removed at Videen's instruction** —
they read as a company apologising for itself and were costing credibility with
investors.

**Removing the disclaimer did not relax the rule above.** The constraint is now
carried by never making the positive claim in the first place, rather than by
publishing a denial next to it. The copy speaks in terms of what is being built,
who it runs on ("licensed partners"), and what stage it is at. If a future
revision introduces a capability claim, the claim is the problem — do not
re-solve it by re-adding a disclaimer.

## Brand Commitments

- **Name:** ChampPay. Legal entity in footer: **Champ Pay Nigeria Limited**.
- **Slogan (binding):** "Pay Like a Champ".
- **Voice:** institutional, conservative, counterparty-appropriate. Assume a
  bank's risk team reads every word.
- **Logo undecided.** Seven directions at `/logos` (internal, `noindex`).
- **Third parties are not named** until an agreement is executed *and* they have
  agreed to be named. This includes partners, counterparties and introducer-chain
  entities.

## Evidence on Hand

Usable: the domain and infrastructure; the contract suite; primary market
research; published third-party Nigerian market data (NIBSS/industry figures on
POS terminals, POS value, instant-payment volume, total e-payment value).

**Absences that must never be fabricated — the most important section here:**

- **No customers.** No client logos, case studies or testimonials.
- **No processing volume.** No transaction counts, no "$X processed", no uptime
  or approval-rate statistics.
- **No certifications, licences, memberships or regulatory badges.**
- **No press coverage or awards.**
- **No named partners** until executed and agreed.

Market figures on the site describe *Nigeria*, are attributed to the third party
that published them, and are labelled as such. Inventing a statistic here is not
a design shortcut — it is a false statement to a bank.

## Product Principles

1. **Never claim capability that does not exist.** Present tense for direction,
   market understanding and intent; road-ahead tense for licensed activity.
2. **Credibility comes from precision, not volume of claims.**
3. **Design carries the trust that proof points normally would.** With no logos
   or numbers available, execution quality *is* the argument.
4. **Speed and understanding over price.** Never lead with rate.
5. **Written for someone who will check.**
6. **Say less about the digital-asset line than you could.** Vagueness there is
   deliberate, not a gap to be filled in later.

## Accessibility & Inclusion

Public B2B site; target WCAG 2.2 AA. Verified 2026-08-04: no AA contrast
failures across all 19 pages, no horizontal overflow at 390/768/1440, full
content renders with JavaScript disabled, `prefers-reduced-motion` honoured.
Read on mobile as often as desktop.
