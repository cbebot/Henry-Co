# V3-59 — Product Expansion: Concierge / Guided Assistant

**Pass ID:** V3-59  ·  **Phase:** G (Product Expansion)  ·  **Pillar:** P1 (Products & Services), P4 (AI Intelligence)
**Dependencies:** V3-28  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none (inherits the AI provider/pricing decisions D3/D4 ratified for V3-26/27 — confirm, don't re-litigate)  ·  **Risk class:** Identity (AI acts on behalf of a signed-in user)

---

## Role
You are the V3 Concierge engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass ships the cross-division **guided assistant** — a Henry Onyx Intelligence-powered concierge that meets a first-time (or stuck) user, asks what they want to accomplish, and walks them through the exact next step in the right division: book a service, list on the marketplace, apply to a job, brief the studio. It is the conversational front door that stitches the whole ecosystem together. The line you must not cross: the concierge is a **thin guidance layer over the V3-28 governed chat surface and the existing deterministic flow rails** — it never spins up a second AI runtime, never names the underlying provider, never bypasses the V3-27 billing/gating rules, and never performs a money or identity mutation on the user's behalf without handing control back to the real, guarded flow.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/59-product-concierge-guided-assistant` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The AI layer exists in spine form. V3-26 ships the vendor-agnostic AI provider router (`@henryco/intelligence` carries the event/envelope schema today; the chat runtime is the router's concern). V3-27 ships per-call metering + wallet auto-debit + hard wallet-zero cap + the free-vs-metered task split. **V3-28 ships the single governed chat surface labelled "Henry Onyx Intelligence" only** — it declines competing-brand and anti-company prompts and carries the per-context preset. `@henryco/chat-composer` is the real composer primitive; `@henryco/lifecycle` already encodes draft preservation, continue-where-you-left-off selectors, and rules for resuming flows. Cross-division next-step logic is V3-39 (smart-next-action); cross-division recommendations are V3-36.

> Note: the older stub for this pass referenced a `@henryco/intelligence-chat` package and the brand "HenryCo Intelligence". Neither is correct. There is **no** `@henryco/intelligence-chat` package — the chat surface is V3-28's, built on `@henryco/intelligence` + `@henryco/chat-composer`. The user-facing brand is **"Henry Onyx Intelligence"** (the platform's 2026-06 identity unification). Build against the real primitives and the real brand.

What is missing: a **guided, intent-first entry experience**. Today a first-time user lands on a division surface and must self-navigate. This pass adds the concierge surface + floating widget, four guided flows, cross-division stitching, and the trigger logic that decides when to offer help — all delegating reasoning to V3-28 and execution to the existing guarded flows.

## Mandatory scope

### S1 — Concierge surface + floating widget
- A route `apps/account/app/(account)/concierge/page.tsx` (full experience) **and** a floating widget mountable across division public + account chromes (`packages/ui` concierge launcher → opens the V3-28 chat panel preset to the concierge context).
- The widget renders the V3-28 governed chat surface with a `concierge` preset (system context that frames the assistant as a cross-division guide). It does **not** instantiate its own model client — it calls V3-28's surface with a preset id.
- First-time users see a warm welcome with the four intent entry points; returning users see "continue where you left off" sourced from `@henryco/lifecycle` selectors.
Acceptance: the widget opens on every division chrome, renders the governed surface, and never exposes a provider name.

### S2 — Four guided flows
Each flow is a deterministic state machine that uses the chat to **gather intent**, then **deep-links into the real, guarded division flow** — the concierge never replaces the actual booking/listing/application/intake flow, it routes into it via `henryDomain(division, path)`:
1. **"I want to book a service"** → asks needs → suggests Henry Onyx Fabric Care / service options (via V3-36 recs) → opens the real slot picker (deep-link into the care booking flow).
2. **"I want to sell something"** → asks category → routes into the marketplace listing-creation flow (`apps/marketplace/app/(public)/sell`).
3. **"I'm looking for a job"** → asks skills → recommends jobs (V3-36) → routes into the Henry Onyx Jobs apply flow.
4. **"I need design help"** → asks scope → routes into the Henry Onyx Studio intake.

Flow state persists through `@henryco/lifecycle` drafts so a refresh/return resumes mid-flow. Acceptance: each flow smoke-completes from intent → deep-linked real flow; an interrupted flow resumes from the saved draft.

### S3 — Cross-division stitching
On flow completion, surface 1–3 related next steps from **other** divisions using V3-39 smart-next-action + V3-36 recommendations (e.g., "Booked Care → here's a relevant Henry Onyx Job"). Each suggestion deep-links into the exact workflow step via `henryDomain()`. The stitch is explainable (reason code shown), not a black-box upsell. Acceptance: completing a flow surfaces a cross-division suggestion that deep-links correctly; suggestions respect the user's RLS scope.

### S4 — Trigger logic
The concierge is offered, never forced:
- **New-user onboarding** — first authenticated session offers the concierge once (dismissible, remembered).
- **User-initiated** — the floating launcher is always available.
- **Surface-triggered** — a "Need help completing this?" CTA appears on designated hard pages (e.g., a stalled multi-step form), respecting a per-user frequency cap so it is never nagging.
Trigger state persists per user; dismissals are honoured. Acceptance: the onboarding offer shows once and respects dismissal; the surface CTA respects the frequency cap.

### S5 — Billing + gating discipline (inherited, enforced here)
Concierge reasoning calls route through V3-27's metering and V3-33's personal-task gating exactly as any other Henry Onyx Intelligence call. Per the AI-layer rules:
- **Company-critical flows are FREE** — guiding a user through registering/booking/listing on a service they are paying Henry Onyx for is a sales-aiding task, not a metered personal task.
- **Personal exploration is METERED** — open-ended "help me think about X" turns bill per V3-27.
- **Unauthenticated users get zero personal-task usage** (V3-33) — the concierge offers only public navigation help to anonymous visitors; any reasoning call requires auth + wallet check.
The concierge declares per-turn whether the turn is company-critical (free) or personal (metered) and passes that classification to the billing engine; it never decides pricing itself. Acceptance: a company-critical guided turn is not billed; a personal-exploration turn is metered; an anonymous user cannot trigger a billed call.

### S6 — Telemetry
Emit through `@henryco/intelligence` (envelope validated by `henryEventNameSchema`, `henry.<domain>.<noun>.<verb>`):
- `henry.concierge.session.opened`
- `henry.concierge.flow.started`
- `henry.concierge.flow.completed`
- `henry.concierge.referral.created`  *(cross-division stitch)*

Add the four names to `HenryEventNames` in `packages/intelligence/src/index.ts`.

## Out of scope
- The governed chat surface + provider router + decline-rules themselves (V3-28, V3-26 — this pass consumes them).
- AI metering / wallet debit / margin engine (V3-27 — this pass classifies turns; it does not bill).
- Personal-task gating middleware (V3-33 — this pass relies on it).
- Customer support drafting (V3-29 support assist) and business message drafting (V3-30).
- AI personality depth / system-prompt authoring beyond the concierge preset (extends V3-28).
- The underlying recommendation + next-action engines (V3-36, V3-39 — consumed, not built).

## Dependencies
**Depends on:** V3-28 (governed Henry Onyx Intelligence chat surface). **Soft-depends on:** V3-27 (billing), V3-33 (gating), V3-36 (recs), V3-39 (next-action) — degrade gracefully (static suggestions) if a soft dep is unshipped, and note it. **Blocks:** nothing directly; it is a consumer surface.

## Inheritance
- **V3-28 governed chat surface** ("Henry Onyx Intelligence") — the concierge mounts it with a `concierge` preset; never a second runtime.
- `@henryco/intelligence` — event envelope + telemetry; the AI router lives behind V3-26.
- `@henryco/chat-composer` — composer primitive.
- `@henryco/lifecycle` — flow-draft persistence + "continue where you left off" selectors.
- V3-39 smart-next-action + V3-36 recommendations — cross-division stitching.
- `@henryco/config` — `henryDomain()` deep-links + Henry Onyx brand.
- `@henryco/observability/audit-log` — every concierge-initiated routing into a guarded flow is audited.
- `@henryco/i18n` — all copy.

## Implementation requirements

### Files
- `apps/account/app/(account)/concierge/page.tsx` (full experience).
- Concierge launcher widget in `@henryco/ui` (mountable across chromes) + a `concierge` preset registered with the V3-28 surface.
- Flow state machines (4) under `apps/account` (or a shared `@henryco/lifecycle` flow module) backed by lifecycle drafts.
- `packages/i18n/src/concierge-copy.ts` (+ index export); `packages/intelligence/src/index.ts` (4 event names).

### Trust / safety / compliance
- Same guardrails as V3-28 — declines competing-brand + anti-company prompts; never names the provider.
- The concierge **never** mutates money/identity on the user's behalf — it deep-links into the real guarded flow and hands over control (so `requireSensitiveAction` and the flow's own guards apply at the point of mutation).
- Anonymous users blocked from billed reasoning calls (V3-33); auth + wallet check on every personal-task turn (V3-27).
- `writeAuditLog` on each routing handoff into a guarded division flow.
- RLS respected for all recommendations + cross-division suggestions — the concierge never reveals data the user cannot see.

### Mobile + desktop parity
The floating widget + full concierge page are responsive on web mobile (safe-area, keyboard avoidance, modal escape per V3-09). Super-app: the concierge surfaces through the existing chat-composer integration where present; native concierge parity is V3-87 — state explicitly.

### i18n
All copy through `@henryco/i18n` namespace **`surface:concierge`** (Pattern A typed keys for the flow prompts/CTAs/labels; Pattern B runtime fallback for non-en locales). Welcome copy, the four intent labels, flow prompts, cross-division suggestion reason codes, and error/decline messages are all translated. Zero hardcoded user-facing strings.

### Brand & design system
The assistant is **"Henry Onyx Intelligence"** everywhere user-facing — read the label from `@henryco/config`, never hardcode it, never the provider name, never the retired "Henry & Co.". Division names in suggestions are "Henry Onyx <Division>" from `company.ts`. Locked design tokens + per-division accent; Fraunces where editorial; light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` clean. Zero hardcoded domains — all deep-links via `henryDomain()`.

## Validation gates
1. **CI** green: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
2. **Flow smoke** (4 flows): each completes intent → deep-linked real division flow; interrupted flow resumes from lifecycle draft.
3. **Cross-division stitching**: completing a flow surfaces a correct, RLS-respecting, deep-linking suggestion with a reason code.
4. **Trigger correctness**: onboarding offer shows once + honours dismissal; surface CTA respects the frequency cap.
5. **Billing/gating**: company-critical turn not billed; personal turn metered; anonymous user cannot trigger a billed call; provider name never appears.
6. **i18n gate** passes; `surface:concierge` in 12 locales.
7. **Real-browser UI**: widget + full page in light + dark, mobile + desktop, CLS ≈ 0, contrast clean.

## Deployment gate
All gates green; the billing/gating + provider-name-never-shown checks are mandatory (Identity/AI surface). Owner review of the concierge experience from screenshots. Branch off `origin/main` → PR → CI green → squash-merge; no force-push. 14-day soak on the guided-flow + billing-classification path.

## Final report contract
`.codex-temp/v3-59-product-concierge-guided-assistant/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification (provider name absent; company-critical free vs personal metered) · telemetry baseline (the 4 `henry.concierge.*` events) · deferred items (native concierge → V3-87; graceful degradation where soft deps unshipped) · pass-closure assertion.

## Self-verification
- [ ] S1: concierge surface + floating widget mount the V3-28 governed surface with a `concierge` preset; no second AI runtime; provider name never shown.
- [ ] S2: four guided flows complete intent → deep-link into the real guarded division flow via `henryDomain()`; flows resume from `@henryco/lifecycle` drafts.
- [ ] S3: cross-division stitching surfaces RLS-respecting, deep-linking, reason-coded suggestions.
- [ ] S4: trigger logic (onboarding-once + dismissal + surface-CTA frequency cap) honoured.
- [ ] S5: company-critical turns free, personal turns metered (V3-27), anonymous billed calls blocked (V3-33).
- [ ] S6: 4 `henry.concierge.*` telemetry events added to `HenryEventNames` and firing.
- [ ] Brand = "Henry Onyx Intelligence" via `@henryco/config`; zero hardcoded domains/strings; `surface:concierge` in 12 locales.
- [ ] CI + flow-smoke + stitching + trigger + billing/gating + i18n + real-browser gates green.
- [ ] `.codex-temp/v3-59-product-concierge-guided-assistant/report.md` written with all 9 sections.
