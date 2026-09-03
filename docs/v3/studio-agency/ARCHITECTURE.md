# Architecture — Build Agent, Orchestration & Owner-AI Operator

**Pass:** V3-STUDIO-AGENCY-DESIGN-01 · Design only. Read [README.md](./README.md) first — especially "The real spine on `main`."

> Type shapes and SQL here are **design contracts**, not shipped code. They are written concretely so the build passes have no ambiguity. All anchors are against `origin/main @ 5f1139ff`; line numbers drift — trust the named symbols.

---

## 0. The one-paragraph shape

A client's **approved brief** becomes a row in a new **`studio_build_jobs`** table — a budget-capped, auditable job envelope owned by the **orchestrator** (Studio-side state machine + cron tick). The orchestrator dispatches the job to an **external, sandboxed executor** (no production credentials, hard cost caps) that runs the coding agent and reports back over an HMAC-signed callback — the same handshake pattern as the existing inbound-email worker. The executor's output is never live: it is an **artifact + preview + QA report** that flows into a **hard human review gate** (client review + owner/staff one-tap approval, using the shipped `founder_action_proposals` propose→confirm spine). Only the orchestrator — never the agent — executes the deploy, with its own scoped credential. The **Owner-AI operator** is the Founder Intelligence extended with `owner.studio.*` actions, `studio.*` lookups, and a scheduled tick that prepares reviews, watches job health, and queues one-tap decisions while the owner is offline. Every AI call is metered; every transition is audited; every irreversible step waits for a human.

```
 Client                    Studio (Vercel)                     Executor (sandboxed, external)
 ──────                    ───────────────────────────         ──────────────────────────────
 brief (3 lanes) ────────► submitStudioBrief ─┐
                                              ▼
                           [SA-1] AI-adaptive brief + review gate
                                              │ approved (one-tap, owner/staff)
                                              ▼
                           studio_build_jobs (queued) ────────► spawn: agent + caps harness
                           cron tick ◄──HMAC heartbeats──────── build in sandbox (no prod creds)
                                              │                 artifact + preview + QA + usage
                                              ▼
                           QA gates → client review → OWNER ONE-TAP (founder proposal spine)
                                              │ approved
                                              ▼
                           orchestrator deploys (scoped cred) ──► live site
                                              │
                           client notified ◄──┘   Owner-AI operator: prep · monitor · follow-up
```

---

## 1. Three systems, one composition

| System | Lives | Trusts | Can never |
|---|---|---|---|
| **Build agent** | external executor (per-job sandbox) | its job spec + its own workspace | touch prod, spend beyond caps, message anyone |
| **Orchestrator** | `apps/studio` (tables + cron + routes) | the DB state machine + HMAC'd executor reports | skip a gate, move money outside guarded RPCs |
| **Owner-AI operator** | `apps/hub` Founder Intelligence (+ operator tick) | closed catalogs + true-state reads | execute anything without the owner's tap |

The systems talk **only through durable state and governed seams**: the agent never writes Studio tables (it reports; the orchestrator writes); the operator never drives the executor (it proposes; the orchestrator acts after confirmation). This keeps each blast radius small and every hop auditable.

---

## 2. The build-agent runtime {#2-the-build-agent-runtime}

### 2.1 Why the agent cannot live in the product runtime

Grounded constraints, all verified on `main`:

- **No sandbox exists**: zero Dockerfiles/compose/devcontainers/VM references in the repo; all compute is Vercel serverless (heaviest observed `maxDuration 60`) plus one dependency-free Cloudflare Email Worker.
- **`runAiTask` is single-call**: every surface `maxCalls: 1`, non-streaming, 12s outer timeout, 5-minute default holds (`packages/ai-gateway/src/orchestrator.ts`, `src/surfaces.ts`). A multi-step coding agent (install → scaffold → iterate → build → test) runs for minutes and makes dozens of model calls.
- A real build (`pnpm install` + `next build`) alone exceeds any serverless window.

So the agent runs on an **executor** outside the product runtime, and the product side holds only the *envelope*: spec in, signed reports in-flight, artifact out.

### 2.2 The executor — grounded options (owner decision SA-D3)

| Option | What it is | Why / why not |
|---|---|---|
| **E1 — GitHub Actions runner (recommended for SA-2)** | A `workflow_dispatch` workflow in a **separate, dedicated repo** (not the monorepo) runs the agent harness in an ephemeral runner | Already in the estate: CI + `workflow_dispatch` + **GitHub environment approval** are proven here (`eas-build.yml` gates its production profile on a human environment approval). Ephemeral VM per run = real isolation; secrets scoped per environment; logs retained. Bounded to ~job-hours, fine for site builds. No new vendor. |
| **E2 — Managed sandbox service** (e.g. a container/VM sandbox provider) | Orchestrator calls a sandbox API per job | Cleaner API + faster spawn, but a new vendor, new secret surface, and nothing in the repo to build on. Candidate for SA-2+ once volume justifies it. |
| **E3 — Vercel-adjacent compute** | Background functions / longer-duration runtimes | Still capped well below build-agent needs on current config; no repo precedent. Not recommended. |

The executor contract below is identical whichever host is chosen — E1→E2 is a swap of the spawn adapter, not the design.

**E1 mechanics (so a builder isn't guessing):** the orchestrator holds a **fine-grained GitHub token** scoped to the dedicated repo only (`actions:write`), listed in the credentials inventory alongside the deploy credential. `workflow_dispatch` inputs are size-limited, so the dispatch carries only `jobId + attempt + a short-lived signed spec-fetch URL`; the runner pulls the frozen `BuildJobSpec` back over the same HMAC handshake as the callbacks. The runner's run id comes back on the first heartbeat and is stored as `executor_run_ref` on the job — that is what stall-kill (cancel-run) and log linkage bind to.

### 2.3 Input contract — the job spec

A job is created only from an **approved** brief (SA-1's review gate; see [PHASED-PLAN §SA-1](./PHASED-PLAN.md#sa-1)). The orchestrator renders a frozen, self-contained spec — the agent never reads production data:

```ts
// DESIGN CONTRACT — @: apps/studio/lib/agency/spec.ts (SA-2)
export interface BuildJobSpec {
  jobId: string;                    // uuid; correlation key for EVERYTHING (audit, usage, ledger)
  briefSnapshot: StudioBriefSnapshot; // frozen copy: goals, pages, features, brand inputs, domain intent
  track: "bundle" | "codegen";     // §2.6 — what kind of artifact to produce
  constraints: {
    budget: { maxProviderCostKobo: number; maxWallClockMinutes: number; maxModelCalls: number };
    tech: string[];                 // allowed stack (Track 2), pinned template version (Track 1)
    content: { locale: string; toneRules: string };  // calm-authority; no provider names — scanned later anyway
  };
  callbackUrl: string;              // studio /api/agency/executor-callback
  callbackKeyId: string;            // HMAC key id (rotation-friendly); secret delivered via executor env, never in spec
}
```

### 2.4 The sandbox contract (what the agent runs inside)

- **Zero production credentials.** No Supabase keys, no `PAYMENTS_DATABASE_URL`, no Postmark token, no Vercel token. The executor env carries exactly: a **dedicated build-agent Anthropic key** (separate from the ecosystem's `ANTHROPIC_API_KEY`, independently rate-limited and revocable), the HMAC callback secret, and the job spec.
- **The harness enforces the caps, not the model.** A thin supervisor process (the "caps harness") runs the agent, counts provider usage after every call, and kills the run at `maxProviderCostKobo`, `maxWallClockMinutes`, or `maxModelCalls` — whichever trips first. Budget enforcement must not depend on the agent's cooperation. Usage is reported per call in the final usage report (metering truth = provider-reported tokens, same principle as `ProviderResult.usage` in the gateway).
- **Egress policy**: package registries + the provider API + the callback URL only (enforced at the runner level where the host supports it; at minimum, the harness proxies the provider and the callback so unexpected egress is visible in the report).
- **Heartbeats**: the harness POSTs progress events (`stage`, `costSoFarKobo`, `note`, plus a **signed timestamp and a monotonic sequence number per `(jobId, attempt)`**) to `callbackUrl`, HMAC-signed — the exact handshake `workers/owner-inbound-email` already uses toward hub: `HMAC_SHA256(secret, "${timestamp}.${body}")` carried in `x-henry-timestamp` + `x-henry-signature` headers (the timestamp binding is what gives the verifier its replay window). The orchestrator rejects out-of-window or non-increasing heartbeats, so a replayed capture cannot keep a dead or hijacked run looking alive. Missed heartbeats are how the orchestrator detects a stalled job (§3.3).
- **Why the gateway is not in this loop**: the in-sandbox agent speaks to the provider directly under the harness (structural — §2.1). Governance parity is preserved by the envelope: metered usage lands in `studio_build_usage` (see [MONEY-MODEL §3](./MONEY-MODEL.md#3-the-job-cost-envelope)), caps are enforced by the harness, telemetry + audit land on the job, and **provider opacity is enforced at the artifact boundary** ([SAFETY-MODEL §5](./SAFETY-MODEL.md#5-security-of-generated-output)) — the client-visible surface never says anything but Henry Onyx. Every *product-side* AI call (brief conversation, QA verdicts, operator turns) still rides `runAiTask` unchanged.

### 2.5 Output contract — a reviewable artifact, never a deploy

```ts
// DESIGN CONTRACT — executor final report (HMAC-signed, idempotent by jobId+attempt)
export interface BuildJobReport {
  jobId: string; attempt: number;
  outcome: "built" | "failed" | "killed_budget" | "killed_timeout";
  artifact?: {
    kind: "bundle" | "repo";
    ref: string;                    // bundle: content-addressed archive ref · repo: branch+commit in the sites org
    previewUrl?: string;            // Track 2 ONLY (Vercel preview deployment). Track 1 previews are materialized
                                    // by the ORCHESTRATOR after QA (§2.6) — the credential-less executor cannot host one.
  };
  qa: QaReport;                     // machine gates: build ok, links, a11y smoke, no-secrets scan, provider-string scan
  usage: { calls: number; inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number;
           providerCostKobo: number };  // harness-counted; the job cost envelope settles from THIS
  log: string;                      // redacted run log ref for the review surface
}
```

### 2.6 What the agent builds — two tracks

- **Track 1 — site bundle (recommended first; default for packages).** The agent produces **validated structured content + theme tokens + assets** for a new multi-tenant renderer app (`apps/studio-sites`, one Vercel project) that serves every client site by host — the **hub host-rewrite precedent** (`apps/hub/vercel.json`) generalized. No arbitrary client-site code ever executes. The mechanics, precisely:
  - **Bundle store**: a **private Supabase Storage bucket** (or DB rows for small bundles) — content-addressed, service-role-only, explicitly **never** Cloudinary or any public-URL store (the FIRE audits named permanent public media URLs as the ecosystem's systemic risk; this design does not add a new instance).
  - **Preview**: after QA passes, the **orchestrator** (not the executor) publishes the bundle to a preview namespace of the renderer — a token-gated preview path/host keyed by `jobId`, readable only through the client's authenticated portal session (an unauthenticated preview URL would leak an unreleased site).
  - **Go-live**: the orchestrator flips the bundle pointer for the site's host (instant, and instantly reversible — rollback is repointing to the previous bundle). **Custom-domain attach is staff-manual in SA-2/SA-3** (Vercel dashboard: add domain to the `studio-sites` project) — the repo has no programmatic Vercel provisioning, and automating it via a minimal scoped domains-API token is an SA-2b deliverable with its own review. **DNS/registrar changes remain a human step throughout** (they may spend money and touch client-owned accounts; SA-1's domain-intent loop hands them to onboarding as tasks, never to the agent).
- **Track 2 — full codegen (custom tier, later).** The agent writes a real Next.js project in a **dedicated sites GitHub org/repo** (never the monorepo — generated code must not inherit the ecosystem CI surface, secrets, or blast radius), with its own Vercel project and **preview** deployments. Prod promotion stays with the orchestrator's gated deploy step. Requires programmatic Vercel/GitHub provisioning that does not exist in the repo today — scoped in [PHASED-PLAN §SA-2b](./PHASED-PLAN.md#sa-2).

Both tracks end at the same review gate; the choice per job comes from the package (owner decision SA-D3 sets the default posture).

---

## 3. The orchestration state machine {#3-the-orchestration-state-machine}

### 3.1 Substrate — Postgres state + outbox tick (the repo's own idiom)

No queue service exists; the proven idiom is **a Postgres table drained by a `CRON_SECRET`-gated cron** (`search_index_outbox` → hub's every-minute worker; Studio's own 6-hourly `runStudioAutomationSweep`). The orchestrator is exactly that:

```sql
-- DESIGN CONTRACT (SA-3 migration, apps/studio/supabase/migrations/) — RLS default-deny; service-role writes;
-- client SELECT limited to a projection of their own job's stage. Mirrors founder_action_proposals' discipline.
create table studio_build_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references studio_projects(id),
  brief_id uuid not null references studio_briefs(id),
  spec jsonb not null,                          -- frozen BuildJobSpec
  stage text not null default 'queued' check (stage in (
    'queued','dispatching','building','qa','client_review','owner_review',
    'approved_for_deploy','deploying','live','aftercare',
    'build_failed','qa_failed','changes_requested','stalled','cancelled')),
  attempt int not null default 0,               -- retry counter, capped (§3.3)
  budget_kobo bigint not null,                  -- job cost envelope ceiling
  cost_kobo bigint not null default 0,          -- harness-reported accrual
  claimed_by text, claimed_at timestamptz,      -- CAS claim for the tick (one worker per job)
  executor_run_ref text,                        -- runner run id (from first heartbeat) — stall-kill + log linkage
  last_heartbeat_at timestamptz, heartbeat_seq bigint not null default 0,  -- monotonic; replays rejected
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table studio_build_events (              -- append-only job log: every transition, heartbeat, gate verdict
  id bigint generated always as identity primary key,
  job_id uuid not null references studio_build_jobs(id),
  kind text not null, payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

The **tick** is a new Studio cron route (`/api/agency/tick`, every 1–5 min, `CRON_SECRET` with `timingSafeEqual` like the account crons) that: claims due jobs by CAS (`update … set claimed_by … where claimed_by is null` — the founder-confirm claim pattern), advances what can advance, detects stalls, and releases its claim. Executor reports arrive on `/api/agency/executor-callback` (HMAC-verified, idempotent by `jobId+attempt`) and only write state — the tick does the thinking. Every transition writes `studio_build_events` + `writeAuditLog` (`add_audit_log_v2`, `correlationId = jobId`) + `emitEvent/persistEvent` (`henry.studio.build.*` names added to the canonical registry).

### 3.2 Stages and transitions

| From | To | Trigger | Actor |
|---|---|---|---|
| *(brief approved — SA-1 gate)* | `queued` | job created with budget + frozen spec | orchestrator (after human approval) |
| `queued` | `dispatching` → `building` | tick spawns executor; first heartbeat | tick / executor |
| `building` | `qa` | `BuildJobReport.outcome = built` | executor callback |
| `building` | `build_failed` | report `failed` \| `killed_*` | executor callback |
| `qa` | `client_review` | machine gates pass (build, links, a11y smoke, no-secrets, provider-scan) | tick (+ gateway QA verdict surface, free) |
| `qa` | `qa_failed` | any hard gate fails | tick |
| `client_review` | `owner_review` | client approves preview (portal action). Client **silence never auto-advances**: after N days (SA-D2 default 7) the reminder trail ends in an **owner escalation** — the owner decides, because the safety rationale is that the owner approves a site the client has already seen ([SAFETY-MODEL §6](./SAFETY-MODEL.md#6-the-human-review-gate-why-it-cannot-be-skipped)) | client / tick |
| `client_review` | `changes_requested` | client requests changes (bounded rounds per package) | client |
| `changes_requested` | `queued` | revision spec appended; attempt++ | orchestrator |
| `owner_review` | `approved_for_deploy` | **one-tap owner/staff confirm — the hard gate.** SA-2 interim: a role-gated owner-console confirm demanding password step-up via `requireSensitiveAction` (`packages/auth/src/server/sensitive-action-guard.ts` — platform-level, independent of the founder flags) with the same audit; from SA-4 the founder proposal spine (`owner.studio.deploy.approve`) replaces that surface | **human** |
| `approved_for_deploy` | `deploying` → `live` | orchestrator runs the deploy step (scoped credential, §2.6 per track); post-deploy checks pass | orchestrator |
| `deploying` | `stalled` | deploy step fails post-checks | tick → escalate |
| `live` | `aftercare` | client notified; operator schedules a templated day-3 check-in + the domain-intent onboarding tasks (closing SA-1's loop); job closes at the end of the warranty window (SA-D2 default 14 days). A warranty fix is a **new internal-flagged job** (Mode-A envelope, no client payment leg, linked by `parent_job_id`) — never a mutation of the closed job | orchestrator / operator |
| any active | `stalled` | heartbeat gap > threshold, or budget accrual ≥ envelope | tick |
| any pre-deploy | `cancelled` | owner/client cancels; refund path per policy ([MONEY-MODEL §4](./MONEY-MODEL.md#4-refunds-and-failure-money)) | human |

### 3.3 Failure handling — explicit, bounded, escalating

- **Retries**: `build_failed` retries automatically up to **2** attempts with the failure log appended to the spec (the agent sees what broke). Third failure ⇒ `stalled` + operator escalation. Every attempt re-runs under the *remaining* budget — the envelope is per-job, not per-attempt.
- **Stall detection**: no heartbeat for 10 min during `building` ⇒ kill signal to executor (best-effort — E1: cancel-run via `executor_run_ref`), mark `stalled`, escalate. Idempotent reports make a late-arriving callback harmless (CAS on `attempt`).
- **Escalation channel before SA-4 exists**: `publishStaffNotification` (urgent severity — the `staff.support.handoff.requested` pattern) + a direct owner email through the existing Postmark rail (the studio `owner_alert` template idiom). SA-4 adds owner push on top; SA-2/SA-3 do not wait for it.
- **Budget breach**: the harness kills at the cap (§2.4); the tick also treats `cost_kobo ≥ budget_kobo` as a stall trigger (belt and braces). Resuming requires a **human-approved** budget increase (an `owner.studio.job.budget_increase` proposal — never automatic).
- **QA fail**: hard gates (secrets, provider leak, build broken) never auto-pass; `qa_failed` behaves like `build_failed` (bounded retry with findings attached).
- **Cancellation/refund**: pre-deploy cancel is clean (nothing shipped); money follows the refund policy through existing rails only.

### 3.4 Client communication at each stage

All client comms are **system-authored templated messages** (part of the service contract — not AI-authored free text, which stays behind the human gate; [SAFETY-MODEL §2](./SAFETY-MODEL.md#2-the-action-classification)):

- **Project thread**: a `studio_project_messages` row per stage transition (`message_type: 'system'` / `'milestone_update'` / `'approval_request'` for the preview-review ask) — the schema and the **system welcome-message trigger** already model exactly this; realtime delivery is free (table is in the `supabase_realtime` publication).
- **Email**: new template keys beside the existing 19 in `apps/studio/lib/studio/email/send.ts` (`build_started`, `preview_ready`, `changes_received`, `site_live`), Postmark-only, ledgered in `studio_notifications` as today.
- **In-app**: `publishNotification('studio.project.update')` as the shared-account bridge does today; per-stage event types are a registry + category-constraint widening noted in SA-3.

### 3.5 Concurrency & idempotency invariants

One active job per project (partial unique index on `project_id` where stage is active). Executor spawn is idempotent by `jobId+attempt`. Deploy is idempotent by job id (re-running a `deploying` job must be safe — the deploy step records its own completion event before flipping `live`). All money records key on `jobId` ([MONEY-MODEL §3](./MONEY-MODEL.md#3-the-job-cost-envelope)).

---

## 4. The Owner-AI operator {#4-the-owner-ai-operator}

The operator is **not a new AI system** — it is the shipped Founder Intelligence given Studio hands, Studio eyes, and a pulse that doesn't require the owner's browser.

### 4.1 Studio hands and eyes (catalog extensions, same governance)

New entries follow the existing shapes exactly (`FounderActionEntry` with `trueStateReader`, `driftKeys`, `confirmationCopy`, `executionBinding`, `auditAction`; strict zod params; tranche-gated dark until `FOUNDER_ACTIONS_TRANCHE≥3`):

| Kind | Key (design) | What it does | Gate |
|---|---|---|---|
| action | `owner.studio.brief.approve` | approve a reviewed brief → creates the build job | one-tap |
| action | `owner.studio.proposal.send` | release an AI-prepared proposal to the client | one-tap |
| action | `owner.studio.deploy.approve` | the production deploy gate for a job in `owner_review` | one-tap **+ reauth** |
| action | `owner.studio.job.pause` / `resume` / `cancel` | job control | one-tap (cancel + reauth) |
| action | `owner.studio.job.budget_increase` | raise a job's cost envelope | one-tap **+ reauth** (money-adjacent posture; amount chosen by the owner from preset steps — the model still never fills a money param, `FORBIDDEN_MONEY_PARAM_KEYS` unchanged) |
| action | `owner.studio.client.reply` | send an AI-drafted client message (project thread) | one-tap |
| lookup | `studio.briefs.pending.list` / `studio.brief.get` | intake queue with IDs | read-only |
| lookup | `studio.jobs.active.list` / `studio.job.get` | job stage, cost vs budget, heartbeat age, QA summary | read-only |

`getFounderActionQueue` / `buildCompanyFactsForFounderAI` extend so pending briefs and active jobs appear in the facts pack **with exact IDs**, annotated with the matching action key — the F4 grounding pattern as shipped.

### 4.2 Server-initiated proposals — the durable work inbox (the one real extension)

Today `founder_action_proposals` rows are born only inside owner chat turns and expire in 15 minutes — ephemeral confirmation cards. The operator needs the same row to serve as a **queued decision**:

- New columns (design contract): `origin text check (origin in ('chat','operator'))` and a per-origin TTL (`operator` proposals live until acted on or superseded, with drift re-checked **at confirm time** — the existing `driftKeys` re-read already provides exactly this safety, which is *why* long TTLs become acceptable).
- The confirm route is unchanged: same `requireOwner`, CAS claim, drift re-check, reauth where required, audit-first-abort. **Nothing about longer-lived proposals weakens the gate; the gate never trusted proposal freshness — it re-reads true state.**
- The command portal renders `origin='operator'` proposals as a **decisions inbox** (count-badged), so the owner returns to a triaged queue, not a chat scrollback.

### 4.3 The operator tick — what runs while the owner is offline

A hub cron (sibling of the existing daily `owner-reports`; 15–30 min cadence) runs the operator sweep — **read → assess → prepare → escalate**, never execute:

1. **Prep**: new briefs get an AI-prepared review (summary, risks, suggested package/price adjustments) attached as an `operator` proposal (`owner.studio.brief.approve` prefilled).
2. **Monitor**: active jobs checked for stalls, budget burn rate, aging client reviews; each anomaly becomes a proposal or a nudge (client reminder = templated system message, autonomous — it's part of the service contract).
3. **Summarize**: the shipped morning-brief narrative (`composeMorningBriefNarrative`, the codebase's one autonomous AI precedent) gains an agency section: jobs moved, decisions waiting, money accrued.
4. **Escalate**: urgent conditions (stall, budget breach, deploy-check failure, client complaint keywords) ring the owner through `publishStaffNotification` (the `staff.support.handoff.requested` urgent pattern) — plus, as a new SA-4 deliverable, **owner push**: the hub command portal registers a push subscription for the owner's devices (push *dispatch* already runs ecosystem-wide via `packages/notifications/publish.ts` for urgent/security severities — what's missing is a registration surface outside the account app, and any hub/operator-originated escalation), with the Postmark owner-email path as the always-on fallback. Today nothing operator-originated reaches an offline owner between report emails; this closes that.

Operator model turns run on `hub.founder.assist` (free surface, deep tier) or a sibling `hub.founder.operator` surface with its own allowance — metered as internal spend under the operator's daily budget ([MONEY-MODEL §5](./MONEY-MODEL.md#5-internal-spend)).

### 4.4 Autonomy boundary (summary; the contract is [SAFETY-MODEL §2](./SAFETY-MODEL.md#2-the-action-classification))

**Autonomous (reversible, logged):** read/monitor/summarize; draft briefs, reviews, proposals, replies, social copy; run QA; prepare deploy checklists; send *templated* stage notifications; schedule reminders.
**One-tap (consequential):** approve brief → spawn job (spends money); send proposals or AI-authored free-text to clients; production deploy (+reauth); budget increase (+reauth); cancel (+reauth); publish social; anything computer-use.
**Never (this design):** autonomous prod deploys, autonomous spend beyond an approved envelope, autonomous publishing, money-param filling by the model.

---

## 5. One job, end to end (composition walkthrough)

1. Client finishes the AI-adaptive brief (SA-1; free coach surfaces, server-persisted conversation). Operator tick prepares the review; owner taps **approve** (`owner.studio.brief.approve`) → proposal sent (or auto per SA-D5 for template packages) → client pays deposit on the **existing** card rail → `studio_build_jobs` row created (`queued`) with the SA-D2 budget envelope.
2. Tick dispatches the executor. The agent builds in the sandbox under the caps harness; heartbeats stream in; `studio_build_events` accumulates; the client sees an honest "building" stage in the portal.
3. Report arrives: artifact + preview + QA + usage. Machine gates pass → `client_review`: the portal shows the preview with an `approval_request` thread message; email `preview_ready` goes out.
4. Client approves → `owner_review`: the operator prepares the deploy checklist (QA summary, cost vs budget, diff-of-scope) as an `operator` proposal. Owner taps **approve deploy** (+password step-up) — the one hard gate.
5. Orchestrator deploys (Track 1: publish bundle + DNS; Track 2: promote preview → prod), runs post-deploy checks, flips `live`, messages the client (`site_live`), books the money records ([MONEY-MODEL §2–3](./MONEY-MODEL.md)), and schedules aftercare. The morning brief tells the owner what shipped and what it cost.

## 6. Where everything lands (integration table)

| Concern | Reuse / extend | Anchor on `main` |
|---|---|---|
| Job state + events | **new** `studio_build_jobs` / `studio_build_events` (+ `studio_build_usage`, money doc) | idiom: `search_index_outbox` + `founder_action_proposals` |
| Orchestrator tick | **new** Studio cron route | `apps/studio/app/api/cron/studio-automation/route.ts` + `apps/studio/vercel.json` |
| Executor callback | **new** HMAC route in studio | handshake precedent: `workers/owner-inbound-email` → hub `/api/inbound/email` |
| Human approval spine | **reuse** propose→confirm + reauth | `apps/hub/lib/founder-intelligence/*`, `founder_action_proposals`, `requireSensitiveAction` |
| Product-side AI calls | **reuse** `runAiTask` + new surfaces (`studio.build.qa`, operator) | `packages/ai-gateway/src/{surfaces,server/prompts}.ts`, `createAssistRunner` |
| Job money envelope | **compose** existing RPCs + rate-card row | [MONEY-MODEL.md](./MONEY-MODEL.md); `20260627120000_v3_ai_01_metered_billing.sql` |
| Client thread messages | **reuse** `studio_project_messages` (`system`/`approval_request`) | `apps/studio/supabase/migrations/20260503140000_studio_messaging.sql` welcome trigger |
| Client email | **extend** template registry | `apps/studio/lib/studio/email/send.ts` (Postmark-only invariant) |
| In-app + owner alerts | **reuse** `publishNotification` / `publishStaffNotification` | `packages/notifications/{publish,staff-publish}.ts` |
| Audit + telemetry | **reuse** `writeAuditLog` + `emitEvent`/`persistEvent` | `packages/observability` (`add_audit_log_v2`, `henry_events`) |
| Multi-site serving (Track 1) | **new** `apps/studio-sites` renderer | host-rewrite precedent: `apps/hub/vercel.json` |

Continue to [SAFETY-MODEL.md](./SAFETY-MODEL.md) — the part of this design that makes the rest permissible.
