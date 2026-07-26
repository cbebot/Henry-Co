# Safety Model — What the AI May Do Alone, and What Always Waits for a Human

**Pass:** V3-STUDIO-AGENCY-DESIGN-01 · Design only. This is the load-bearing document: the owner's brief says *"escalate only high-level decisions"* — this doc makes that boundary concrete, mechanical, and testable. Anchors are against `origin/main @ 5f1139ff`.

---

## 1. The principle

Autonomy is granted by **reversibility**, not by confidence. The AI may do alone anything that can be undone with one command and harms no one while it stands (a draft, a sandbox build, a report). Anything **irreversible or outward-facing** — a production deploy, a message a client reads, money leaving an approved envelope, a public post — waits for a **one-tap human approval**, no matter how certain the AI is. This is the same doctrine the shipped Founder Intelligence already enforces ("the AI composes; the owner confirms" — `apps/hub/lib/support-reply-write.ts`), extended to the agency.

Two corollaries the design enforces mechanically:

- **The gate re-reads reality, never trusts the proposal.** Approval executes through the shipped confirm route, which demands a fresh password step-up for sensitive actions (`requireSensitiveAction`, 5-min `hc_last_reauth` window) **before** CAS-claiming the proposal — deliberately, so a challenged proposal stays pending and confirmable — then **re-reads true state via `driftKeys` and aborts on drift**. A stale or manipulated proposal cannot smuggle an action through, and a re-implementation must keep that order (reauth → claim → drift) or challenged proposals strand in `executing`.
- **Caps are enforced outside the model.** Budget/time/call ceilings live in the harness and the DB, not in the prompt ([§4](#4-cost-governance)). A confused or adversarial agent can waste its own sandbox — nothing else.

## 2. The action classification {#2-the-action-classification}

### Class A — Autonomous (reversible; logged; no approval)

| Action | Why it's safe alone |
|---|---|
| Read/monitor/summarize any Studio or job state (via closed lookups) | read-only; bounded catalogs (`FOUNDER_LOOKUP_GOVERNANCE` pattern) |
| Draft: brief reviews, proposals, client replies, social copy, deploy checklists | drafts are inert until a human releases them |
| Sandbox-build: spawn/retry executor runs **within the approved job envelope** | isolated (§3); capped (§4); output inert (§5) |
| Run QA gates; attach findings | read-only over the artifact |
| Send **templated stage notifications** (`build_started`, `preview_ready`, `site_live`; system thread messages) | part of the purchased service contract; fixed copy (i18n Pattern A, tone-gated), no AI-authored free text |
| Schedule reminders / aftercare follow-ups | reversible; templated |

### Class B — One-tap owner (or delegated staff) approval

| Action | Extra gate |
|---|---|
| Approve brief → create the build job (commits spend) | — |
| Send an AI-prepared proposal or **any AI-authored free-text** to a client | — |
| **Deploy to production** / point DNS / promote preview | **+ password reauth** |
| Increase a job's budget envelope | **+ reauth** (money-adjacent; the model never fills the amount — `FORBIDDEN_MONEY_PARAM_KEYS` stands) |
| Cancel a job; trigger the refund path | **+ reauth** |
| Publish social (draft-and-approve; matches shipped `owner.social.post`, which is already `requiresReauth`) | **+ reauth** |
| Any computer-use action (SA-5, if ever enabled) | **+ reauth**, per-session scope, recorded |

### Class C — Never (no phase of this design)

Autonomous production deploys · autonomous spend beyond an approved envelope · AI filling money parameters · autonomous publishing · the agent touching production credentials or writing production tables · silent failure (every kill/stall/refusal surfaces in the job log and, when material, escalates).

**Delegation:** the owner may delegate Class B taps (except reauth-gated ones) to named Studio staff roles via the existing `requireStudioRoles` model — an owner decision (SA-D1), not a code default.

## 3. Sandbox isolation (the agent's cage)

Per [ARCHITECTURE §2.4](./ARCHITECTURE.md#2-the-build-agent-runtime): the executor is ephemeral and external; env contains **no production secret of any kind** — only the dedicated (independently revocable) build-agent provider key, the HMAC callback secret, and the frozen spec. The agent cannot reach Supabase, `payments_private`, Postmark, or Vercel because it holds nothing that authenticates to them; the deploy step runs on the orchestrator with its own scoped credential. Egress is limited to registries + provider + callback (host-enforced where possible, harness-proxied and reported at minimum). Prompt-injection blast radius is therefore bounded by construction: hostile content in a brief can at worst waste the job's own budget or produce a bad artifact — which then faces QA and two human reviews before anything real happens. The spec is frozen so the agent's input is exactly what the human approved.

**Data protection (what flows *into* the sandbox):** the brief snapshot is client business data leaving the product boundary into a third-party CI environment, so it is minimized first — a spec-render scrubber (an SA-2 deliverable generalizing the shipped `redactChatText` idiom, `apps/studio/lib/studio/brief-chat.ts`, which already strips emails/phones from copilot transcripts) removes contact PII the agent doesn't need; brand assets travel as fetch-once references, not embedded blobs. The dedicated executor repo is access-restricted to the owner + CI only; Actions log/artifact retention is set to the platform minimum; the raw run log lives in the private bundle store (never a public URL) and is deleted when the job's warranty window closes. `BuildJobReport.log` is the redacted reference the review surfaces show.

## 4. Cost governance {#4-cost-governance}

Layered, so no single failure runs away — detailed money mechanics in [MONEY-MODEL.md](./MONEY-MODEL.md):

1. **Per-job envelope** (`budget_kobo`, set at approval from the SA-D2 rate card): the harness kills at the cap; the tick independently stalls the job at accrual ≥ envelope; resuming requires a human-approved increase.
2. **Per-call ceilings** for all product-side calls: unchanged gateway policy (`maxCostKoboPerCall`, reservation hard-cap on settle).
3. **Daily aggregates**: an agency-wide daily provider-spend ceiling (the shipped free-budget pattern: `ai_free_spend_ledger` idiom, `allow/conserve/exhausted`) so N concurrent jobs cannot compound past a company-level line; operator internal spend has its own daily cap. **Enforced at dispatch**: the tick refuses to spawn or resume an executor when the daily counter is exhausted, and the counter accrues from heartbeat `costSoFarKobo` deltas — the harness only knows its own job, so the aggregate check must live orchestrator-side.
4. **Kill switches**: the `ai_gateway` master flag (product-side calls) plus a new `studio_agency` flag gating dispatch of new jobs; both runtime-checkable, both dark by default.

## 5. Security of generated output & the deploy path {#5-security-of-generated-output}

**Hard QA gates (machine, never waivable by the AI):**

- **No-secrets scan** — the artifact contains no keys, tokens, or internal URLs (the harness env is minimal, but scan anyway: defense in depth).
- **Provider-opacity scan** — no provider/model strings anywhere client-visible (the `assistantReplyLeaksProvider` doctrine applied to artifacts; internal logs may name models, artifacts may not).
- **Build integrity** — Track 1: bundle validates against the renderer's schema (which is the *real* boundary: `apps/studio-sites` renders only typed content — script injection is excluded by construction, and the renderer app carries the ecosystem's security headers). Track 2: the project builds clean; dependency allow-list + lockfile audit (pinned registry, no install scripts from unvetted packages); security headers preset; no server code unless the package includes it.
- **Content gates** — dead-link scan (the `dead-link.yml` pattern, real) and an accessibility pass. Precision on the latter: `a11y.yml` gates contrast + security-header snapshots only — a page-level a11y smoke over the rendered artifact is a **new** gate to build (the `pnpm a11y:audit` axe tooling exists in the repo but has no CI runner today). Client-brand assets only (no unlicensed stock).

**Deploy path:** the artifact is content-addressed at report time; **what was reviewed is what deploys** (the deploy step re-verifies the hash — a post-approval swap is impossible). Deploy credentials are orchestrator-side, scoped to the sites surface only (Track 1: the renderer's store; Track 2: the sites org, never the monorepo or the ecosystem's Vercel projects). Post-deploy checks (HTTP 200 walk, headers, TLS) run before `live`; failure rolls back (Track 1: repoint to previous bundle — instant; Track 2: Vercel rollback) and escalates.

## 6. The human review gate (why it cannot be skipped)

`owner_review → approved_for_deploy` exists **only** as a `founder_action_proposals` confirm (`owner.studio.deploy.approve`, reauth-gated). There is no orchestrator code path from `qa`/`client_review` to `deploying` that does not pass through a confirmed approval — the state machine's legal-transition table is enforced in the transition function (single choke point, like `enforce_payment_intent_transition` does for payment intents). In SA-2 the confirm surface is a role-gated console button with the same reauth (`requireSensitiveAction`) and audit; from SA-4 it is the founder proposal row — the gate's properties never change, only its UI. Client review precedes owner review so the owner approves a site the client has already seen; client **silence therefore escalates to the owner rather than auto-advancing** ([ARCHITECTURE §3.2](./ARCHITECTURE.md#3-the-orchestration-state-machine)). The same shape gates client-handoff of AI-authored free text (Class B): drafts persist as proposals; sends happen only from the confirm route.

## 7. Audit — every action, every actor, one correlation key

Every job transition, heartbeat anomaly, gate verdict, proposal, confirmation, execution, and deploy writes: `studio_build_events` (append-only job log) + `writeAuditLog` → `add_audit_log_v2` (`correlationId = jobId`; the shipped audit-first-abort idiom for every write core: **no trail, no action**) + `emitEvent`/`persistEvent` → `henry_events` (`henry.studio.build.*`). Money records carry the job id end-to-end ([MONEY-MODEL §3](./MONEY-MODEL.md#3-the-job-cost-envelope)). The review surfaces (owner console, morning brief) read these streams — the owner can always answer *who decided what, when, and what it cost*, offline or not.

## 8. Failure honesty

The portal never fakes progress (the founder portal's cosmetic work-states are explicitly *not* the pattern here — job stages bind to real `studio_build_events`). Kills, stalls, and QA failures appear in the client-visible timeline as honest, calm copy ("we're taking another pass"), in the owner's inbox as exact causes, and in the audit trail as raw events. A job that cannot proceed **stops and escalates**; it never guesses forward.
