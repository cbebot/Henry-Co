# V3-52 — Marketplace Discovery + Ranking at Scale

**Pass ID:** V3-52
**Phase:** G (PRODUCT EXPANSION)
**Pillar:** P1 (Product Expansion), P3 (Personalisation)
**Dependencies:** V3-12 (Foundation Lock acceptance)
**Effort:** XL (4+ weeks across 5 sub-PRs)
**Parallel-safe:** YES (with other Phase G passes after V3-12)
**Owner gate:** None at start
**Risk class:** None

---

## Role

You are the V3 Marketplace engineer. Execute this one pass (split into 5 sub-PRs per V5-2 hand-off architecture), then stop.

This pass closes the marketplace discovery + ranking at scale work specified in V5-2 hand-off §1 — the owner's explicit concern about catalog growth, intelligent ranking, and trust-weighted visibility.

---

## Project, audit, anti-patterns

Audit lift from AUDIT-BASELINE.md §2.4 + V5-5 owner framing:

Owner quote (from V5-5):
> "when the marketplace and property website grows wide are those long big cards still needed or recreated? When thousands of goods are there it will not be easy for users to find their choice easily. The system should know or guess what user might need intelligently — not randomly shuffle like a fool. The higher the trust the luckier to show users."

---

## Mandatory scope (5 sub-PRs)

### Sub-PR A — Compact card variant + density toggle + responsive grid

- Add compact card variant to marketplace listing components.
- User-toggleable density (compact / comfortable / spacious).
- Persisted in `user_home_layouts` from V3-34.
- Responsive grid: 1-col mobile / 2-col tablet / 3–4-col desktop with proper breakpoints.
- A11y verified.

### Sub-PR B — Merit-weighted shuffle + diversity guard + cold-start logic

- Server-side ranking formula (in `@henryco/intelligence/marketplace-ranking` — new submodule).
- Inputs: seller trust, listing freshness, conversion rate, in-stock signal.
- Formula proprietary (ANTI-CLONE Principle 1 — never client-exposed).
- Diversity guard: enforce category mix even when one seller's listings rank highest, so a single seller can't dominate the homepage.
- Cold-start logic: brand-new listings get a temporary boost to gather signal.
- A/B-testable via V3-91 framework (gated; for this pass, just deterministic).

### Sub-PR C — Personalisation re-rank

- Anonymous re-rank based on session signals (recently viewed, search terms).
- Signed-in re-rank with cross-division signals (booked Care → suggest related marketplace items).
- Uses V3-34 personalization context.
- Optional V3-26 AI-call for explainable reason codes (not for the ranking math itself, just the "why").

### Sub-PR D — Editorial overlays + curation UI in staff

- Staff-only UI to pin a listing to top of a category.
- Editorial badges ("Editor's pick", "New from verified seller").
- Curation overrides ranking but never breaks diversity guard.

### Sub-PR E — Discovery telemetry + staff-facing dashboards

- Events: `henry.marketplace.search.executed`, `henry.marketplace.listing.impressed`, `henry.marketplace.listing.clicked`, `henry.marketplace.discovery.cold_start_boost`.
- Staff dashboard: search analytics, ranking-formula-version, A/B holdout results, top under-performing categories.

---

## Out of scope

- Property ranking (mirrors this pattern; separate pass).
- Jobs ranking (similar pattern; separate pass).

## Dependencies / Inheritance / Trust / Mobile / i18n / Gates / Deployment / Report

Standard pattern.

Key trust requirement: ANTI-CLONE Principles 1, 2, 9. Ranking formula server-only; results behind auth where appropriate; per-IP rate limit on search; no formula in client.

Diversity guard prevents trust-based ranking from creating a "winner takes all" homepage.

---

## Self-verification

- [ ] All 5 sub-PRs shipped.
- [ ] Density toggle working.
- [ ] Server-side ranking + diversity guard + cold-start.
- [ ] Personalisation re-rank wired (anonymous + signed-in).
- [ ] Editorial curation UI for staff.
- [ ] 4+ new telemetry events + staff dashboard.
- [ ] Report written.
