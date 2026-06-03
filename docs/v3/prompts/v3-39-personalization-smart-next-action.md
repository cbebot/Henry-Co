# V3-39 — Personalization: Smart Next Action

**Pass ID:** V3-39  ·  **Phase:** E (Personalization & Predictive)  ·  **Pillar:** P3 (Personalization), P5 (Automation)
**Dependencies:** V3-34 (personalization-home)  ·  **Effort:** M  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role
You are the V3 next-action engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass turns the existing account-wide `nextAccountSteps` recommender into a *per-page, context-aware* "do this next" signal that deep-links the user into the exact workflow step — and stitches cross-division journeys ("you booked Care; here's a caregiver Job"). The line you must not cross: the resolver is server-side and respects RLS and trust state; it never surfaces a sensitive next-action (KYC document, wallet move, destructive action) out of context, and it never nags past a user's opt-out.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/39-personalization-smart-next-action` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
`packages/intelligence/src/index.ts` already exports `nextAccountSteps(ctx: UserContext): Recommendation[]` — a deterministic, account-scoped recommender returning up to five `Recommendation`s (`{ id, division, title, reasonCodes, confidence, ctaHref, ctaLabel }`) keyed off `trustState`, `profileCompleteness`, and saved-item signals. `UserContext`, `RecommendationReasonCode`, and `RecommendationConfidence` are defined there. The `@henryco/lifecycle` package (`LifecycleContinuePanel`) already renders "continue your journey" prompts on the account home, and the `HenryEventNames` registry carries `LIFECYCLE_RECOMMENDATION_CLICKED`.

What does NOT exist: a *per-page* next-action — the current recommender only knows the account, not the page the user is standing on. There is no "Continue: <action>" affordance on a marketplace listing, a care service page, a jobs detail, or a studio brief; no cross-division stitch that reads a just-completed action and proposes the natural next one in a sibling division; and no per-user opt-out for these prompts. This pass adds the page-contextual resolver, the subtle floating chip, and the stitch — building strictly on the existing `Recommendation` shape so V3-36 (recommendations) and the lifecycle package stay the single source of truth for *what* is recommendable.

## Mandatory scope

### S1 — Page-context next-action resolver (`packages/intelligence/src/next-action.ts`)
New module, exported from `packages/intelligence/src/index.ts`. Extends — does not replace — `nextAccountSteps`.
```ts
export type PageContextKind =
  | "account_home" | "marketplace_listing" | "care_service" | "jobs_detail"
  | "studio_brief" | "learn_course" | "property_listing" | "logistics_booking";

export interface PageContext {
  kind: PageContextKind;
  division: HenryDivision;
  entityId?: string;                 // listing/service/job/brief id
  recentCompletedActions?: { kind: string; division: HenryDivision; at: string }[];
}
export interface NextAction extends Recommendation {
  placement: "inline" | "floating_chip";
  contextKind: PageContextKind;
  sensitive: boolean;                // gates floating-chip eligibility
}
export function resolveNextAction(
  ctx: UserContext,
  page: PageContext
): NextAction[];                     // 0–2 actions, most-relevant first
```
Rules: reuse `nextAccountSteps` for account-level signals; add per-`PageContextKind` candidates (S2); a `sensitive: true` action (KYC, wallet, delete) may render **inline** in its own surface but is NEVER eligible for the floating chip. Deterministic and pure (no AI call) — the AI-hybrid variant is V3-36's domain. Server-resolved (ANTI-CLONE Principle 1): the candidate catalog and user signals never ship to the client; the page receives only the final 0–2 `NextAction` objects.

### S2 — Per-page candidate catalog (seed set)
Seed `resolveNextAction` with at least these page bindings (all `ctaHref` cross-division-safe via `@henryco/config`, all copy via i18n keys, not literals):
- **account_home**: defer to `nextAccountSteps` (trust/profile/saved). Sensitive items (KYC) render inline only.
- **marketplace_listing**: "Save for later" / "Compare with similar".
- **care_service**: "Book a Care provider near you" (deep-links the booking entry, respecting V3-38 availability if present).
- **jobs_detail**: "Apply now" (if profile-ready) else "Save for later".
- **studio_brief**: "Get a quote in 24h" → studio brief-submit step.
- **learn_course**: "Continue lesson <n>" (deep-link to resume point).
- **property_listing**: "Request an inspection" (gated to eligible listings) else "Save".
- **logistics_booking**: "Track your shipment" / "Book a return".
The catalog is intentionally a seed — note in code that it extends organically; do not attempt an exhaustive 30+ action matrix here.

### S3 — Cross-division stitch
When `page.recentCompletedActions` carries a just-finished action, propose the natural sibling-division next step, deep-linked:
- completed **care booking** → "Hiring help? See caregiver roles" (jobs) — delegates the *recommendable set* to V3-36 when present; falls back to a deterministic stitch when V3-36 has not shipped.
- completed **learn course** → "See employer roles that value this" (jobs).
- completed **marketplace purchase** → "Need it delivered? Book logistics".
Every stitch `ctaHref` is built with `henryDomain(targetDivision, path)` — never a hardcoded cross-division URL. Emit `henry.next_action.stitched` distinct from a same-division action so cross-division lift is measurable.

### S4 — Surfaces: floating chip + inline slot (`packages/ui`)
- `<NextActionChip action={NextAction} />` — a subtle bottom-right floating chip ("Continue: <action>") rendered only for `placement === "floating_chip"` and `sensitive === false`. One chip max per page; dismissible; persists dismissal per `(userId, contextKind, actionId)`; honors `prefers-reduced-motion`; respects the user opt-out (S5). Tokens only, Fraunces for the label, light+dark, mobile+desktop, CLS ≈ 0, never overlaps the chrome's support/notification affordances.
- `<NextActionInline action={NextAction} />` — inline slot for sensitive and surface-anchored actions, embedded in the relevant page region.
Wire the chip into the relevant page shells (account, marketplace listing, care service, jobs detail, studio brief, learn course, property listing, logistics booking) via a single shared host so behavior is identical everywhere.

### S5 — Opt-out + dismissal persistence
New column or preference row: `public.user_preferences.next_action_prompts_enabled boolean not null default true` (or extend the existing notification-preferences row if one is canonical — check `packages/notifications` before adding a table). A settings toggle ("Show 'do this next' suggestions") under the account settings notifications surface. Per-prompt dismissals stored in `public.next_action_dismissals (user_id, context_kind, action_id, dismissed_at)` with RLS `user_id = auth.uid()`. The resolver suppresses dismissed and opted-out prompts server-side.

### S6 — Telemetry
Via `packages/intelligence` analytics, register and emit: `henry.next_action.surfaced`, `henry.next_action.clicked`, `henry.next_action.dismissed`, `henry.next_action.stitched`. Add constants to `HenryEventNames` in `packages/intelligence/src/index.ts`. Properties carry `{ context_kind, division, action_id, sensitive, placement }`.

## Out of scope
- The full 30+ per-page action matrix — seed set only; extend organically in later passes.
- AI-hybrid / learned recommendation ranking — **V3-36** (cross-division recommendations).
- A/B testing the chip copy/placement — **V3-91** (experiment framework).
- Abandoned-task recovery via email/push — **V3-37** (this pass is in-app, present-tense only).

## Dependencies
Depends on **V3-34** (personalization context). Consumes **V3-36**'s recommendable set when present (graceful deterministic fallback otherwise). Does not block any pass; complements **V3-37** (recovery), **V3-45** (auto-remind).

## Inheritance
- `packages/intelligence` — `nextAccountSteps`, `UserContext`, `Recommendation`, `RecommendationReasonCode`, analytics envelope, `HenryEventNames`.
- `@henryco/lifecycle` — `LifecycleContinuePanel` patterns; reuse the "continue" idiom rather than inventing a parallel one.
- `packages/ui` + chrome shells — for the chip host.
- `@henryco/config` — `henryDomain()` / `henryWebRoot()` for every cross-division `ctaHref`.
- `packages/notifications` — preference-row canonical location (check before adding a table).

## Implementation requirements
### Files
- `packages/intelligence/src/next-action.ts` (new) + export from `index.ts`
- `packages/intelligence/src/__tests__/next-action.test.ts` (new)
- `packages/ui/src/next-action-chip.tsx`, `next-action-inline.tsx` (new) + barrel export
- `apps/hub/supabase/migrations/<ts>_next_action_prompts.sql` (preference column/row + `next_action_dismissals` + RLS)
- Page-shell wiring in the eight host surfaces (single shared host component)
- Settings toggle in the account notifications surface
- i18n copy keys under `surface:next_action`

### Trust / safety / compliance
- Resolver server-side; candidate catalog and user signals never client-shipped (ANTI-CLONE Principle 1).
- `sensitive: true` actions never eligible for the floating chip; inline-only, in their own surface.
- Respects `trustState` (no "withdraw" prompt to a `restricted`/`frozen` account) and RLS on every entity the action references.
- Opt-out and per-prompt dismissal honored server-side; `next_action_dismissals` RLS scoped to `auth.uid()`.

### Mobile + desktop parity
Floating chip is responsive (bottom-right desktop, above the mobile nav bar on web mobile, never colliding with chrome affordances). Expo super-app: the `/next-action` resolver contract is consumed by native screens in V3-87; note the contract, do not build native here.

### i18n
Namespace `surface:next_action`. Every action title, CTA label, and chip prefix ("Continue:") flows through `@henryco/i18n` Pattern A typed keys. Interpolated entity names (course title, service name) come from translated/owned data — never hardcoded. 12 locales.

### Brand & design system
Cross-division CTA hrefs via `henryDomain(division, path)`; zero `henrycogroup.com` literals. Brand strings via `@henryco/config`. Chip and inline slot: tokens only (`--site-*` / `--accent`), Fraunces for the label, light + dark + mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed, `prefers-reduced-motion` honored.

## Validation gates
1. **Standard CI** — typecheck, lint, test, build green across touched apps/packages.
2. **Resolver unit suite** (~15 cases) — each `PageContextKind` returns a relevant action; sensitive actions never get `placement: "floating_chip"`; opted-out/dismissed prompts suppressed; cross-division stitch fires on `recentCompletedActions`.
3. **Per-page smoke** — the eight seed pages each render a relevant, deep-linked next-action.
4. **Cross-division stitch e2e** — a fixture user who completes a care booking sees the jobs stitch with a working `henryDomain('jobs', ...)` href.
5. **Opt-out + dismissal** — toggling off suppresses all chips; dismissing one prompt suppresses only that `(context_kind, action_id)`; both verified server-side.
6. **RLS verification** — `next_action_dismissals` and the preference row readable/writable only by the owning user.
7. **Real-browser UI** — chip light + dark, mobile + desktop, CLS ≈ 0, reduced-motion respected, no chrome collision.

## Deployment gate
All gates green; PR squash-merged to `main` via CI. 14-day soak monitoring `henry.next_action.surfaced → clicked` click-through and `dismissed` rate; a high dismiss rate is a copy/placement signal to feed V3-91, not a blocker.

## Final report contract
`.codex-temp/v3-39-personalization-smart-next-action/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion).

## Self-verification
- [ ] `resolveNextAction` extends `nextAccountSteps`, server-only, 0–2 actions, pure/deterministic.
- [ ] Seed catalog covers the eight page kinds; sensitive actions inline-only.
- [ ] Cross-division stitch deep-links via `henryDomain()`; emits `henry.next_action.stitched`.
- [ ] `<NextActionChip>` (one per page, dismissible, reduced-motion, opt-out aware) + `<NextActionInline>` token-only.
- [ ] Opt-out toggle + `next_action_dismissals` with `auth.uid()` RLS; suppression server-side.
- [ ] Four telemetry events registered and emitted with full properties.
- [ ] Zero hardcoded domains/strings; brand via `@henryco/config`.
- [ ] Report written.
