# Customer Account Dashboard — Design Language

**Pass:** ACCOUNT-PREMIUM-01 · Phase 2 deliverable
**Audience:** Every engineer rebuilding an inner-page surface (sessions 2/3 of this pass; future related work)
**Primitives shipped:** `packages/dashboard-shell/src/surfaces/{HeroCard, NextStepRow, MetricStrip, TimelineCard, EmptyStateCard, DivisionLanding}`
**Stylesheet:** `packages/dashboard-shell/src/surfaces/surfaces.css` (mount once at app layout root)
**Tokens:** consumed via the existing `--acct-*` and `--hc-*` CSS variables (THEME-01).

This document captures the **interaction grammar** for the inner-shell. It is the shared lens every rebuild must apply. If a page violates one of these patterns it MUST justify the violation in PR comments.

---

## 1. Two questions, answered before the user scrolls

Every page is graded on whether it answers, ABOVE THE FOLD:

1. **"What's happening with my stuff?"** — answered by the `<HeroCard />` band (eyebrow, state-driven headline, tile row).
2. **"What should I do next?"** — answered by the `<NextStepRow />` immediately below the hero, OR by the primary CTA inside the hero.

Pages that fail Q1 read as templates; pages that fail Q2 read as dashboards-for-the-sake-of-dashboards. Both happen when the engineer ships a generic title bar instead of the editorial hero.

**Where the next-step lives:**
- **Division landings** (`/care`, `/marketplace`, `/jobs`, etc.): hero's primary CTA answers Q2; `<NextStepRow />` is reserved for when there's a specific in-flight item that needs the user's attention (e.g. "Pay balance for service on Friday — N3,000").
- **Cross-division surfaces** (`/`, `/messages`, `/activity`, `/notifications`): hero answers Q1; `<NextStepRow />` answers Q2 by surfacing the highest-ranked next action.

---

## 2. The hero-card content algorithm

The HeroCard headline / blurb / CTA pivots on the page's **state**. Every page implements a `pageState(stats): "empty" | "calm" | "active" | "attention"` function. The four states drive copy:

| State | When | Headline voice | Primary CTA |
|---|---|---|---|
| **empty** | First-run, no data | Welcoming, capability-evidence ("X organises everything in one place") | "Get started" / "Set up X" |
| **calm** | Some history, nothing pending | Reflective, count-of-thing ("You have N completed services") | Most likely-useful next ("Book another", "Browse Y") |
| **active** | In-flight items present, no problems | Live, present-tense ("N bookings in flight") | The in-flight surface ("Track them") |
| **attention** | Items need user action | Direct, count-of-action ("N items need your attention") | The attention surface ("Resolve now") |

**State picker contract** (see e.g. `apps/account/components/care/helpers.ts:heroState`):
- Empty if `stats.total === 0`.
- Attention if `stats.needsPayment > 0 || stats.needsAttention > 0` (or division equivalent).
- Active if `stats.inFlight > 0`.
- Calm otherwise.

The picker is **page-local** because the definition of "attention" differs per division (care = `needsPayment`; jobs = `appsAwaitingDecision`; wallet = `pendingFundingCount > 0`). The pattern is shared; the predicates are not.

---

## 3. The data-loading contract

Three loading strategies, in this order of preference:

### a) Server-rendered (default)

Every `(account)/**/page.tsx` is a server component, `export const dynamic = "force-dynamic"`. Data is fetched server-side via typed fetchers in `lib/`. The page renders the resolved data — no client-side useEffect / SWR / React Query.

```tsx
// ✓ correct
export default async function CarePage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const bookings = await getCareBookings(user.id);  // typed return
  return <CareLanding bookings={bookings} locale={locale} />;
}
```

If a third-party query is slow, the page still renders the rest above the fold and falls through to a Suspense boundary at the slow widget.

### b) `<StructuredSkeleton />` for true Suspense boundaries (V3-05)

When a section's data CANNOT be eagerly resolved (e.g. it depends on a viewer-issued action), wrap it in `<Suspense fallback={<StructuredSkeleton variant="..." />}>`. The skeleton renders the shape the data will fill — never a generic spinner.

### c) Live-refresh

Pages whose data changes during the user's session mount `<RouteLiveRefresh intervalMs={...} />` from `@henryco/ui`. Intervals:
- 12000ms — high-frequency (notifications, support, tasks).
- 20000ms — medium (messages).
- 30000ms — low (calendar, generic).

Optimistic optimism is reserved for client-component mutations (e.g. mark-read action). It is NEVER used to fake server data in a page render.

---

## 4. Empty states that teach, not apologise

Two rules for every empty state:

1. **Name the missing thing.** "You haven't booked a service yet." NOT "Nothing here yet."
2. **Surface the next action.** Either a CTA button, or a one-line "browse to X" link.

The single canonical pattern is `<EmptyStateCard />`. Three slots:

```tsx
<EmptyStateCard
  kicker="Care · empty"
  title="No bookings yet"
  body="When you book a service through care.henrycogroup.com, it appears here with status and the next action you need to take."
  cta={{ label: "Book a service", href: careBookUrl }}
/>
```

Tones:
- `tone="page"` (default) — full-card surface; use when the empty state IS the section content.
- `tone="ghost"` — transparent, nested inside another panel.

If the page has multiple sections each with their own empty state, USE THE SAME PRIMITIVE for each. Do not write three different empty divs.

---

## 5. Loading is honest

Per V3-05, the loading shape mirrors the data shape:
- Metric strip → `<StructuredSkeleton variant="metric" />`.
- Timeline list → `<StructuredSkeleton variant="list" />`.
- Hero band → `<StructuredSkeleton variant="hero" />`.

If a query exceeds 3 seconds, the skeleton transitions to "Still loading — this is unusual" with a retry button (the V3-05 escalation pattern). Never use `<div>Loading...</div>` or a bare spinner.

---

## 6. The motion budget

Every animation is calm and short:

| Pattern | Duration | Easing |
|---|---:|---|
| Page enter (fade-in) | 280ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` (ease-out) |
| Hover lift on CTA | 120ms | ease-out |
| Hero eyebrow pulse | 2600ms loop, attention/active state → 1800ms | ease-in-out |
| Progress bar fill | 480ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| Drawer / sheet open (DESIGN-01) | ≤280ms | spring |

**Reduced motion respected universally.** Inside `@media (prefers-reduced-motion: reduce)` blocks, animations strip to opacity-only fades. The HeroCard's eyebrow dot drops to `animation: none`. Tested on every primitive.

---

## 7. The accent palette

| Token | Visible role |
|---|---|
| `var(--acct-gold)` | Primary CTA fill, eyebrow text accent, focus ring |
| `var(--acct-gold-strong)` / `var(--acct-gold-text)` | Hover state, WCAG-AA on-white text accent |
| `var(--acct-gold-soft)` | Chip background, icon surround |
| `var(--acct-ink)` | Primary text on light, hero band background |
| `var(--acct-bg-soft)` | Primary text on dark (hero text color), surface tone |
| `var(--acct-muted)` | Secondary text, kicker labels |
| `var(--acct-line)` | Hairline border, divider |
| `var(--acct-green)` / `var(--acct-red)` / `var(--acct-blue)` | Status accents — chips/timeline tones only, NOT CTAs |

**The gold accent is reserved for intentional surfaces.** It appears on:
- The primary CTA in the hero (filled gold).
- The active-route indicator in the shell (rail).
- The eyebrow dot (gold→bg-soft color-mix).
- The progress strip fill in HeroCard.
- The Next-Step CTA pill.

It does NOT appear on every divider, every chip, or every active state of every list row — those are status accents.

---

## 8. Typography ladder

5 tokens settle every size; anything bigger is a special case justified in the PR:

| Token | Where | Family |
|---|---|---|
| caption (10/12) | All-caps eyebrow / chip / meta | Sans (Manrope) |
| body-sm (12.5/14) | Section body, list detail | Sans |
| body (13.5/14) | Hero blurb, CTA label | Sans |
| h3 (18–22) | Section title | **Serif** (Iowan Old Style / Newsreader fallback) |
| h2 (26–38) | Hero headline | **Serif** |

Numeric values in metric tiles and hero tiles use the serif family with `font-variant-numeric: oldstyle-nums proportional-nums` so figures sit editorial, not stencil. (See `displayValueStyle` in `MetricCard`.)

---

## 9. The page-scaffold pattern

Every inner page follows the SAME outer shape:

```tsx
import { DivisionLanding, HeroCard, NextStepRow, MetricStrip } from "@henryco/dashboard-shell/surfaces";

export default async function ExamplePage() {
  const { hero, nextStep, metrics, sections } = await buildPageData();
  return (
    <DivisionLanding
      className="acct-fade-in"
      hero={<HeroCard {...hero} />}
      nextStep={nextStep ? <NextStepRow {...nextStep} /> : null}
      metrics={metrics ? <MetricStrip {...metrics} /> : null}
      sections={sections}
    />
  );
}
```

`buildPageData` is a page-level helper that:
1. Fetches the typed data fetcher.
2. Derives the state (`empty | calm | active | attention`).
3. Returns the props in one typed shape so the page body is a thin compose.

This pattern eliminates the 100+ LOC of inline `if (state === "active") { heroHeadline = ... }` chains that currently litter division-page bodies.

---

## 10. The interaction quality bar (acceptance for every rebuild)

Before merging a rebuilt page:

- [ ] The hero answers Q1 + Q2 above the fold.
- [ ] Every number rendered is real data from a typed fetcher; no static placeholders.
- [ ] The empty state names the missing thing + the next action.
- [ ] The error state is V3-10 canonical (the page's `error.tsx` handles unhandled throws).
- [ ] The loading state is a V3-05 `<StructuredSkeleton>` matching the data shape.
- [ ] All strings flow through `@henryco/i18n` (V3-07 strict gate stays green).
- [ ] No hardcoded Tailwind palette colors where a THEME-01 token exists.
- [ ] Light + Dark mode visual parity confirmed.
- [ ] Renders cleanly at 360px (no horizontal scroll; tiles stack 2-up).
- [ ] Touch targets ≥44px (V3-09).
- [ ] The 10-question self-audit answered in the PR body.

---

## 11. The 10-question self-audit

Every page rebuild ships with answers to these 10 questions in its PR. Not a checklist — the lens.

1. If I were a returning customer landing here, what is the single most useful sentence I could read?
2. What is the next clearest action they want to take? Is it surfaced above the fold?
3. What metric makes them feel "this product knows me"?
4. What part looks template-filled — what should I curate?
5. What would I delete that adds noise without signal?
6. Where am I using generic copy I could replace with real data + a personal next-step?
7. Where am I assuming setup — what's the graceful path if they haven't?
8. Light + dark parity?
9. Cramped at 360px or breathable?
10. 8-second takeaway?

---

**End of design language.** The primitives are the contract; this doc is the lens. Sessions 2 and 3 of ACCOUNT-PREMIUM-01 execute against both.
