# Studio Agency — Autonomous Build Agent, Orchestration & Owner-AI Operator

**Pass:** V3-STUDIO-AGENCY-DESIGN-01 · **Type:** Design / architecture only (no feature code, no migration) · **Risk class:** M (money-adjacent; metered AI + deploys) · **Status:** RATIFIED 2026-07-18 — defaults + confirmations ([OWNER-DECISIONS.md](./OWNER-DECISIONS.md)); build passes proceeding, SA-1 first · **Base:** `origin/main @ 5f1139ff`

> This folder is the blueprint for the **autonomous Studio build agency**: an approved brief spawns a coding agent that builds the client's site in a sandbox, returns it for review, and — only after a human one-tap approval — deploys it; one orchestration layer walks every job through request → review → build → QA → deploy → aftercare; and an **Owner-AI operator** (an extension of the shipped Founder Intelligence) runs the preparation, coordination, and monitoring that continue while the owner is offline. It introduces **no code and no migration**; it specifies them, phase by phase, on top of what is actually on `main`.

---

## Executive summary

The Studio division already sells websites: three intake lanes converge on one brief (`apps/studio/lib/studio/workflows.ts#submitStudioBrief`), a deterministic pricer issues a proposal, a live card rail collects money, and a client portal carries messaging, milestones, and deliverables. What is missing is the middle: **after the deposit, every delivery step is a manual staff action**. This design adds the missing middle as three composed systems:

1. **The build agent** — a sandboxed, budget-capped coding agent (Claude-family, provider-opaque to clients) that takes an approved brief and produces a *reviewable artifact*: a built site + preview URL + QA report. It runs **outside** the product runtime (there is no container/sandbox infrastructure anywhere in the repo — see [ARCHITECTURE §2](./ARCHITECTURE.md#2-the-build-agent-runtime)), holds **no production credentials**, and can never deploy anything itself.
2. **The orchestration layer** — a Postgres-backed job state machine (`studio_build_jobs`, design contract) driven by the repo's proven outbox-plus-cron idiom, with every transition audited, every failure path explicit, and the client messaged at each stage through Studio's existing project thread + email templates.
3. **The Owner-AI operator** — new `owner.studio.*` actions and `studio.*` lookups in the **existing** Founder Intelligence catalogs, plus the first *server-initiated* proposals: the operator prepares reviews, watches job health, drafts client replies, and queues one-tap decisions in the owner's command portal — autonomously for reversible work, **never** for consequential actions, which always wait for the owner's tap (and, where already required, a fresh password step-up).

The company earns because the build is a **metered Studio service**: the client pays a quoted package price through the existing Studio payment rail (ledgered), while every AI call inside the job is metered into a per-job cost envelope with hard caps — margin is governed through the same `pricing_rule_books` pattern the AI rate card already uses. Money never moves outside the guarded `payments_private` RPCs and the balanced double-entry ledger. See [MONEY-MODEL.md](./MONEY-MODEL.md).

The load-bearing principle throughout is the owner's own: **"escalate only high-level decisions."** Made concrete: the AI does reversible work autonomously (draft, sandbox-build, QA, prepare, monitor) and stops at a hard human gate before anything irreversible or outward-facing (deploy to prod, client-facing sends it authored, spend beyond budget, publishing, any computer control). [SAFETY-MODEL.md](./SAFETY-MODEL.md) is the contract.

## Read in this order

| # | Doc | What it answers |
|---|-----|-----------------|
| 1 | **[README.md](./README.md)** (this) | Orientation + the real spine on `main` this design binds to. Read first. |
| 2 | **[ARCHITECTURE.md](./ARCHITECTURE.md)** | The build-agent runtime (spawn/sandbox/monitor), the orchestration state machine (stages, transitions, failure handling), the Owner-AI operator (autonomous vs escalated), and how the three compose with the gateway, Studio, deploy infra, and notifications. |
| 3 | **[SAFETY-MODEL.md](./SAFETY-MODEL.md)** | The load-bearing safety contract: reversible-autonomous vs consequential-one-tap, sandbox isolation, cost governance, the human review gate, security of generated output and the deploy path, audit-every-action. |
| 4 | **[MONEY-MODEL.md](./MONEY-MODEL.md)** | How the company earns (package price + metered agent cost envelope + margin, through the ledger + VAT) and the capped, non-billable internal budget for owner-invoked operations. |
| 5 | **[PHASED-PLAN.md](./PHASED-PLAN.md)** | SA-1 Studio Brief Refactor (the input layer — domain-lookup fix, AI-adaptive brief) → SA-2 build agent → SA-3 orchestration → SA-4 Owner-AI operator → SA-5 computer-use + auto-social (last, most gated). Dependencies, risk, gates. |
| 6 | **[OWNER-DECISIONS.md](./OWNER-DECISIONS.md)** | The decisions only the owner can make — approval boundary, per-job budget & pricing, sandbox/deploy automation level, social policy — each with a recommended default. |

---

## The real spine on `main @ 5f1139ff` (what this design builds on)

Every claim below was re-derived against the PR base, not memory. App-file line numbers drift — trust the named symbols and re-verify before building.

### The governed AI gateway — built, live-billed, single-call

`@henryco/ai-gateway` is the only sanctioned path to a model. `runAiTask` (`packages/ai-gateway/src/server/index.ts`) enforces: surface policy (`AI_SURFACES`, **19** registered surfaces in `src/surfaces.ts`), the `ai_gateway` flag kill switch, the authenticated-actor gate, rate limits, a pre-flight upper-bound estimate, wallet reservation, one Anthropic dispatch (non-streaming, 12s outer timeout; tier→model map in `src/server/config.ts`: fast/standard/deep), metered settle **hard-capped at the reservation**, and a whitelisted receipt (`redactReceipt` + `assertClientSafe`) that never names a provider, model, cost, or margin. Tiers surface to users only as **Onyx Swift / Core / Prime** (`src/tier-brand.ts`).

The money loop behind it is **applied to prod** (`docs/v3/ai/APPLY-v3-ai-01-metered-billing.md`, stamped 2026-07-03): `public.customer_wallet_ai_holds` + `public.ai_usage_events` + three guarded `payments_private` RPCs (`reserve_wallet_for_ai_usage` / `post_ai_usage_charge` / `release_wallet_ai_hold`, `apps/hub/supabase/migrations/20260627120000_v3_ai_01_metered_billing.sql`), settling `DR customer_wallet_liability / CR platform_revenue / CR vat_output_payable` through `payments_private.post_ledger_entry`. The rate card is a live-tunable `pricing_rule_books` row (`ai-usage-rate-card-v1`, margins 10/10/35% by tier, per-call floors and ceilings) mirrored by `defaultAiUsageRules()` in `packages/pricing/src/ai-usage.ts`.

**The structural limit this design must respect:** the gateway is strictly **one model call per task** — every surface has `maxCalls: 1`, there is no tool-use loop, no streaming, no background execution, and holds default to 5 minutes. A minutes-long coding agent cannot ride `runAiTask`; the job envelope in [ARCHITECTURE §2](./ARCHITECTURE.md#2-the-build-agent-runtime) exists precisely because of this. (The levers for longer, bigger reservations already exist: `MeteredUsage.calls`, `estimateUsageUpperBound`'s `maxCalls` scaling, and `reserve_wallet_for_ai_usage`'s caller-set `p_expires_at`.)

### Studio — a working agency funnel with no delivery engine

- **Three intake lanes, one sink.** `/request/build` (manual composer), `/request/guided` (wizard), `/request/copilot` (AI chat) all converge on `submitStudioBriefAction` → `submitStudioBrief` (`apps/studio/lib/studio/workflows.ts`), which is anonymous-capable and **synchronously auto-prices a proposal** (`estimateStudioPricing`) with keyword-scored team matching — **no human reviews a brief before a priced proposal exists** (the staff queue is a flat list carrying a literal `TODO(wave1)` comment).
- **The copilot is already gateway-governed**: surfaces `studio.brief.coach` (multi-turn, free) and `studio.brief.staff` (one-shot synthesis, free) with a 6-layer anti-abuse ledger in `studio_brief_drafts`; the **metered `studio.brief.client` surface is registered and live** in `apps/studio/lib/portal/refine-draft-action.ts` (message refine). Coach transcripts are deliberately **not** persisted — only counters; the lane handoff is a frozen-v1 `localStorage` envelope, so drafts don't survive a device change.
- **The broken domain lookup, precisely**: the brief's Commercial step calls `POST /api/studio/domain-check` (anonymous, unrate-limited), which does a real availability check **only** when env `STUDIO_DOMAIN_RDAP_ENABLED` is truthy **and** the name is a bare `.com` (Verisign RDAP). That flag is read in exactly one file (`apps/studio/lib/studio/domain-intelligence.ts`) and set nowhere in the repo — so in practice every check returns "unconfigured" advisory copy, and `.ng`/`.com.ng` (the home market) short-circuits even with the flag on. Nothing downstream ever registers or connects a domain. This is SA-1's first target ([PHASED-PLAN §SA-1](./PHASED-PLAN.md#sa-1)).
- **Money is real**: card via `/api/studio/pay/card` → `@henryco/payment-router` → `payment_intents` (the live rail, settled through the frozen account webhook); `studio_invoices` with tokenized pay links; bank-transfer proof + finance verification. Two spine quirks the money model must respect: `studio_payments.amount` is **integer major-unit naira** (converted at every boundary), and the studio **wallet** debit is an app-layer CAS that posts **no ledger entry** (`apps/account/app/api/studio/payments/[id]/wallet/route.ts`) — unlike the AI settle and wallet top-up.
- **Client comms**: project-thread messaging on `studio_project_messages` (typed `message_type` including `approval_request` and `system`; a DB trigger already seeds a **system-authored welcome message** — the precedent for orchestrator-authored thread messages), 19 email template keys via Postmark-only `@henryco/email` (ledgered in studio-local `studio_notifications`, *not* the ecosystem spine), and the generic `studio.project.update` event through `publishNotification`.
- **A heartbeat exists**: `/api/cron/studio-automation` (every 6h, `CRON_SECRET`-gated) runs reminder sweeps — the slot the orchestrator's tick extends.

### Founder Intelligence — the shipped approval spine the operator extends

On `main` (flag-dark, 5 env gates): a closed catalog of **10 `owner.*` actions** (`apps/hub/lib/founder-intelligence/action-governance.ts` + `action-catalog.ts`), where the AI can only *name* an action + strict-schema params; the server persists one row in **`founder_action_proposals`** (RLS-deny, owner-only read, 15-min TTL, pending-dedupe) and execution happens **only** when the owner taps confirm — a separate route that re-runs `requireOwner`, CAS-claims the row, demands a fresh password step-up for sensitive actions (`hc_last_reauth`, 5-min window), re-reads true state and aborts on drift, then executes through the existing guarded write core with **audit-first-abort**. F4 adds 6 read-only lookups run server-side inside the same chat POST (≤2 per turn). The model can never fill a money amount (`FORBIDDEN_MONEY_PARAM_KEYS`, test-gated; `moneyAdjacent ⇒ requiresReauth` asserted).

**What does not exist** — and is exactly the operator gap: no background agent loop (the only autonomous AI invocation in the codebase is the morning-brief narrative inside the daily `owner-reports` cron), no server-initiated proposals (rows are created only inside owner-initiated chat turns; the 15-min TTL makes them ephemeral cards, not a work inbox), no auto-execute tier at any risk level, and no proactive escalation channel to an offline owner (no owner push — `@henryco/push` serves customers via the account app; the threat engine `assessThreats` runs only on page/chat demand).

### Deploy & runtime reality — serverless-only, no sandbox, no queue service

- 12 Next.js apps each carry a `vercel.json` with the identical monorepo install/build *pattern* (per-app crons and hub's rewrites differ — don't template one file over another) and map to Vercel projects deployed by **GitHub git integration** (playbook: `docs/v3/handoff/vercel-migration-playbook.md`; 10 documented production projects). Hub's host-based rewrites (`hq.` / `workspace.` / `staff.henryonyx.com` → path prefixes of one app) are the repo's only **multi-site-on-one-project** precedent.
- **CI is the quality bar** any generated code inside the monorepo must pass: `lint:all`, `typecheck:all`, `prove:receipts`, `schema-drift:check`, `care-money:check`, `i18n:check:strict`, `tone:check`, `font:*`, `test:workspace`, `build:all`, plus the postgres:17 money-migration invariant job (`.github/workflows/ci.yml`). GitHub **environment approval** already gates privileged automation (`eas-build.yml`, environment `production`).
- **Scheduling** = Vercel crons only (16 routes across 9 apps; fastest every minute at `maxDuration 60`); the queue idiom = a Postgres outbox drained by a cron (`search_index_outbox` → hub search-index-worker). **No pg_cron, no queue service, no Dockerfile, no container/sandbox runtime, no programmatic Vercel provisioning anywhere in the repo.** The one always-on component is a dependency-free Cloudflare Email Worker that HMAC-signs inbound mail to a hub endpoint (`workers/owner-inbound-email`) — the precedent for executor→orchestrator callbacks.
- **Observability**: `writeAuditLog` → `add_audit_log_v2` (SECURITY DEFINER, grant-locked), `emitEvent`/`persistEvent` → `henry_events`, Sentry keyed to `VERCEL_GIT_COMMIT_SHA`; AI telemetry is provider/model-free by a pure tested mapping. Customer notifications = `customer_notifications` + `notification_delivery_log` + push for urgent/security + an account email-fallback cron (there is **no** literal `notification_queue` table — division email queues are per-division). All outbound email is **Postmark-only, as a code invariant**.

---

## Prime Directives (inherited, non-negotiable)

1. **Any AI call inherits all money Prime Directives** — metered, priced through the governed rate card, settled via guarded `payments_private` RPCs, balanced double-entry ledger, VAT via the existing engine, idempotent, pre-paid where wallet-billed. The build agent adds **job-level** governance on top; it never bypasses call-level governance.
2. **Human-in-the-loop on every irreversible action.** Deploy to prod, client-facing sends authored by the AI, publishing/social, spend beyond an approved envelope, any computer control: one-tap owner (or delegated staff) approval, always. This is what makes autonomy safe on a real company. No auto-execute tier exists in this design at any phase.
3. **Provider + model opacity to clients.** The client sees "Henry Onyx Intelligence" and tier brand names only; generated artifacts are scanned so the provider never leaks through the *output* either ([SAFETY-MODEL §5](./SAFETY-MODEL.md#5-security-of-generated-output)).
4. **The sandbox owns no production power.** The build agent runs with zero production credentials, in an isolated executor, and its output reaches prod only through the orchestrator's gated deploy step.
5. **Audit every action.** Every job transition, every agent call, every proposal, every approval, every deploy writes `add_audit_log_v2` + `henry_events`, correlation-keyed by job id.
6. **Do not touch** `payments_private` existing functions, the payment-router providers, the money RPCs, or `packages/search-ui`. New money behavior (if any phase needs it) is **added alongside**, per the phased plan's gates.
7. **Brand + voice + register.** Client-facing surfaces are Register-L, i18n Pattern A, calm authority (`tone:check`); "Henry Onyx" is the only user-facing brand.

## Scope boundary

Documentation only. No package, table, surface, cron, or worker is built by this pass. [PHASED-PLAN.md](./PHASED-PLAN.md) specifies what each build pass creates, and [OWNER-DECISIONS.md](./OWNER-DECISIONS.md) lists what must be ratified first.
