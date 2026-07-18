# Phased Plan — Brief First, Then the Agent, Then the Orchestra, Then the Operator

**Pass:** V3-STUDIO-AGENCY-DESIGN-01 · Design only. Order honors the owner's brief: **the input layer first** (the brief is what the agent eats — fix it before automating what it feeds), computer-use + auto-social **last and most carefully**. Every phase lands flag-dark, ships its own tests + adversarial review, and respects the CI bar (`.github/workflows/ci.yml`) including `i18n:check:strict` baseline refresh and `tone:check` for all new copy. Risk class **M** overall (money-adjacent + deploys). Anchors against `origin/main @ 5f1139ff`.

| Phase | Ships | Depends on | Gate to proceed |
|---|---|---|---|
| **SA-1** Brief refactor | honest domain lookup + AI-adaptive, server-persisted brief + review gate | nothing (SA-D5 default) | owner ratifies SA-D5; funnel metrics not degraded |
| **SA-2** Build agent MVP | job envelope + executor E1 + sandbox + QA + review gate + **manual** deploy | SA-1; SA-D1..D3 ratified | 3 real sites shipped via one-tap flow; envelope math verified |
| **SA-3** Orchestration | full state machine + client comms + tick + failure handling | SA-2 | jobs run end-to-end with zero manual DB touches |
| **SA-4** Owner-AI operator | `owner.studio.*` catalog + operator tick + decisions inbox + owner push | SA-3; founder flags live | a week of offline-owner operation with clean audit |
| **SA-5** Computer-use + auto-social | draft-and-approve social; gated computer-control | SA-4; SA-D4 | separate ratification per capability |

---

## SA-1 — Studio Brief Refactor (the input layer) {#sa-1}

*The brief flow already converges on one sink (`submitStudioBrief`) with gateway-governed AI in the copilot lane — SA-1 makes it honest, durable, adaptive, and reviewable.*

1. **Domain lookup — fix or hide (both, in order):**
   - **Hide when dark (immediate honesty):** `getDomainLookupMode` already knows the mode; when `off`, the Commercial step renders the domain section **without** the "Check this name" affordance (paths new/have/later + advisory copy stay). Today's behavior — a button that always answers "not turned on yet" — is friction shipped to every brief.
   - **Turn it on properly:** set `STUDIO_DOMAIN_RDAP_ENABLED` in the studio Vercel project (and document it — the flag is currently read in exactly one file and set nowhere); add rate limiting + short-TTL caching to `POST /api/studio/domain-check` (it is anonymous and unmetered today — a free RDAP proxy) using the copilot's guard idiom; handle non-`.com` honestly (`.ng`/`.com.ng`: "we confirm availability with the registrar during onboarding" — advisory, never fake-available); RDAP failures degrade to the same advisory, never block submit.
   - **Close the loop later (SA-3):** `domain_intent` currently dead-ends as a proposal bullet; the orchestrator's aftercare stage turns `checkStatus` into a real onboarding task (registrar purchase remains a human step — it spends money).
2. **AI-adaptive brief (infer, then ask):** promote the copilot lane to the primary path. Persist the coach conversation server-side (a `studio_brief_conversations` table following the `intelligence_conversations` idiom — deny-RLS, service-role writes, session/user ownership; the shipped table's `division` CHECK already includes `'studio'` but its persistence lib is account-app-internal, so studio gets its own until the extraction lands). Replace the localStorage-only handoff with a server-side draft keyed by the copilot session cookie (device-change survives; the frozen-v1 envelope stays as the composer's read format). The coach infers everything inferable from what the client already said (the `BriefCopilotStructured` synthesis with `confidence`/`uncertainties` fields already models this) and asks **only** the uncertain fields — turn count drops, completion rises. Surfaces stay the shipped free ones (`studio.brief.coach`/`studio.brief.staff`) with their 6-layer abuse ledger.
3. **The review gate (SA-D5):** add `'in_review'` to the proposal lifecycle — an app-level change only for the tables this gate touches: the `studio_leads`/`studio_proposals`/`studio_projects` status columns carry **no DB CHECK constraints** (plain `text` in `20260402190000_studio_init.sql`; lifecycle enums live in `apps/studio/lib/studio/types.ts`). Do **not** generalize that rule — `studio_invoices` and `studio_brief_drafts` *do* carry status CHECKs on prod. Default per SA-D5: template packages keep instant auto-send (the funnel's strength); **agency-build** briefs hold in `in_review` for a one-tap release (`owner.studio.proposal.send` once SA-4 lands; a plain staff button meanwhile — the `TODO(wave1)` sales queue gets its first real workflow). The client sees an honest "being reviewed by the team" state, not silence.
4. **The discriminator (load-bearing across SA-1/SA-2):** a brief is classified `template` vs `agency` at submit — seeded from the existing `studio_briefs.package_intent` field (`'package'` → template, `'custom'` → agency), refined by the package resolution + estimated total that **feed** `estimateStudioPricing` (the pricer's summary is `{currency, total, deposit, lines}` — it emits no tier field; adding one to the summary is SA-1 work if wanted), and **persisted on the brief** as `brief_class`. The same field drives SA-D5 routing (auto-send vs `in_review`), the SA-2 track selection (Track 1 vs, later, Track 2), and the Mode-A envelope defaults.

*Deliverable checkpoints:* funnel conversion tracked before/after; zero new PII exposure (the domain route logs no query PII today — keep it that way); i18n + tone gates green.

## SA-2 — Build agent MVP (sandbox + review gate; deploy still human-handed) {#sa-2}

- `studio_build_jobs` + `studio_build_events` + `studio_build_usage` migrations (deny-RLS, service-role writes — the `founder_action_proposals` discipline); `studio_agency` flag, dark.
- **Executor E1** (GitHub Actions in a dedicated repo, per SA-D3): the caps harness, the dedicated provider key, HMAC callbacks (timestamped + sequence-numbered heartbeats), `BuildJobSpec`/`BuildJobReport` contracts, the spec-render PII scrubber, the fine-grained `actions:write` dispatch token + signed spec-fetch URL, and `executor_run_ref` capture for stall-kill.
- **Track 1 renderer** (`apps/studio-sites`, one Vercel project, host-based serving per the hub rewrite precedent) + the bundle schema — the artifact boundary that makes generated output safe by construction.
- QA gates (no-secrets, provider-opacity scan, bundle validation, dead-link, a11y smoke) + the `studio.build.qa` free gateway surface for the verdict narrative.
- The **deploy approval gate, SA-2 form**: a role-gated owner-console confirm demanding password step-up via `requireSensitiveAction` (`@henryco/auth` — platform-level, so SA-2 does **not** depend on the flag-dark founder stack), fully audited; SA-4 replaces this surface with the `owner.studio.deploy.approve` founder proposal, gate properties unchanged. The deploy step itself (publish bundle → flip host pointer; custom-domain attach staff-manual per [ARCHITECTURE §2.6](./ARCHITECTURE.md#2-the-build-agent-runtime)) is **run manually by staff at first** (the state machine records it either way).
- **Interim client review (SA-2 only)**: the orchestrator publishes the token-gated preview; staff post it into the project thread as an `approval_request` message and record the client's approval by staff action. The purpose-built portal review UX ships in SA-3 — SA-2's gate below is therefore the **owner** one-tap with client review staff-mediated.
- Money: `studio-build-rate-card-v1` rule-book row; Mode-A envelope accrual (**off-ledger operational metering in v1** — finance reconciles the provider invoice against `Σ studio_build_usage`; [MONEY-MODEL §3](./MONEY-MODEL.md#3-the-job-cost-envelope)); **card-rail-only** enforcement for agency packages (the unledgered wallet path is not widened — [MONEY-MODEL §2](./MONEY-MODEL.md#2-package-price)).
- **SA-2b (after Track 1 proves):** Track 2 codegen — sites GitHub org + programmatic Vercel provisioning (new vendor-API surface; its own security review) for the custom tier.
- *Gate:* three real client sites shipped through brief→build→staff-mediated client review→**owner one-tap**→live; envelope accounting reconciles against the provider invoice; adversarial review of the callback route (HMAC, idempotency, heartbeat replay, spoofed-report resistance).

## SA-3 — Orchestration (the machine runs the machine) {#sa-3}

- The tick cron (`/api/agency/tick`, 1–5 min, `timingSafeEqual` auth like account crons) + CAS job claims; full legal-transition enforcement in one choke-point function.
- Failure handling live: bounded retries, stall detection on heartbeat gap, budget-breach stall, cancellation + refund path (existing machinery only). Escalation recipient pre-SA-4: `publishStaffNotification` urgent + direct owner email via Postmark (both exist today — [ARCHITECTURE §3.3](./ARCHITECTURE.md#3-the-orchestration-state-machine)).
- Client comms at every stage: system thread messages (`studio_project_messages`, `approval_request` for preview review), new email template keys, `studio.project.update` events; per-stage event types + the `customer_notifications_category_check` widening migration if per-stage granularity is wanted.
- Client review UX in the portal (preview + approve/request-changes with bounded rounds per package).
- *Gate:* N consecutive jobs with zero manual DB intervention; every transition present in `studio_build_events` + audit; stall drill (kill an executor mid-run) recovers cleanly.

## SA-4 — Owner-AI operator (the digital executive) {#sa-4}

- Catalog extensions (tranche 3, dark until `FOUNDER_ACTIONS_TRANCHE≥3`): the `owner.studio.*` actions + `studio.*` lookups of [ARCHITECTURE §4.1](./ARCHITECTURE.md#4-the-owner-ai-operator); facts-pack grounding with exact IDs.
- **Server-initiated proposals**: `origin` column + per-origin TTL on `founder_action_proposals`; the decisions inbox in the command portal. (Drift re-check at confirm is what makes long-lived proposals safe — shipped semantics, new lifetime.)
- The operator tick (hub cron, 15–30 min): prep · monitor · summarize · escalate; morning-brief agency section (extends `composeMorningBriefNarrative`, the codebase's one autonomous-AI precedent).
- **Owner escalation channel**: owner **push** for urgent conditions. Precision on what's new: push *dispatch* already runs ecosystem-wide (`packages/notifications/publish.ts` calls `@henryco/push` for urgent/security severities), but subscription *registration* is account-app-only (`apps/account/app/api/push/subscribe` is the sole surface) and nothing hub/operator-originated reaches an offline owner between daily report emails. SA-4 adds a hub command-portal registration surface for the owner's devices, with the Postmark owner-email path as permanent fallback.
- Operator internal-spend ceiling (the `ai_free_spend_ledger` idiom) — [MONEY-MODEL §5](./MONEY-MODEL.md#5-internal-spend).
- *Gate:* a full week where intake→review-prep→monitoring→escalation ran without the owner's browser open, with every decision still human-tapped and the audit trail complete.

## SA-5 — Computer-use + auto-social (last, most gated) {#sa-5}

Deliberately last: both act on **external, irreversible, ToS-bearing surfaces**.

- **Social:** draft-and-approve only (SA-D4 default — matches the shipped `owner.social.post`, already reauth-gated). The operator drafts launch posts per shipped site; the owner taps to publish. No autonomous posting tier is designed; revisiting that is a future owner decision with platform-ToS review in hand.
- **Computer-use:** only for tasks with no API alternative (e.g. a registrar without an API), inside a dedicated sandboxed browser session with per-task scope, session recording attached to the proposal, owner one-tap + reauth to *start* each session, and no stored credentials the model can reach. Each concrete capability ships behind its own flag and its own ratification. If an API exists, the API is used instead — computer-use is the fallback of last resort, not the platform.

---

**Cross-phase invariants:** everything dark by default behind runtime-checkable flags; every phase's new copy through i18n Pattern A + `tone:check`; every new table deny-RLS with service-role writes; every write core audit-first-abort; per-phase adversarial review before merge (the FIRE calibration rules apply — live probes before any severity claim). The deferred list — ledgered studio wallet-spend RPC, the Mode-A per-job COGS-posting RPC ([MONEY-MODEL §3](./MONEY-MODEL.md#3-the-job-cost-envelope)), Vercel domains-API automation for custom-domain attach, per-job escrow, non-NGN pricing, Track-2 marketplace of stacks — stays deferred until its own pass.
