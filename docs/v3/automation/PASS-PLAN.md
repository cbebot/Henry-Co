# Re-Grounded Ordered Plan — V3-43…48

> **⚠️ RE-GROUNDED 2026-07-24 — read [RE-GROUNDING-2026-07-24.md](./RE-GROUNDING-2026-07-24.md) first.** SA-2/SA-3/SA-4 are now MERGED on `origin/main @ 241f068a` (not design-only; the base was `8c9794b5`). Where this doc says the SA machine is design-only / the fork risk is prospective, the re-grounding file is authoritative.

**Pass:** V3-F-DESIGN-01 · Design only. Deliverable 4. The six Phase F passes, re-anchored to real `origin/main @ 241f068a` (re-grounded 2026-07-24; orig base 8c9794b5), with what each builds, real dependencies, risk class, gates, sequence, and parallel-safety. Risk class **M** = touches money **or** AI-billing. Register: **L** = customer-facing (consent-gated), **D** = operator/owner (audited).

> **Program placement:** Phase F is Pillar P5, 6th of 9 phases; all six passes are **PENDING** on main. Phase gate = "Phase D + E foundations land" + V3-10. V3-43 gates V3-44…48 (+ V3-90). Wave F.1 = V3-43 alone; Wave F.2 = V3-44…48 in parallel — **preserved, with corrections below**.

---

## 0. Sequence at a glance

```
  Wave F.1 (serial, foundation)          Wave F.2 (parallel after F.1)
  ───────────────────────────────        ────────────────────────────────────────────
                                          ┌── V3-44 auto-assign/escalate ──┐
  V3-43 workflow engine ──────────────────┤                                ├── V3-47 queue-health
   (generalizes search-outbox idiom)      ├── V3-45 auto-remind            │   (deps 43 + 44)
                                          ├── V3-46 owner reports          │
                                          └── V3-48 campaigns ─────────────┘
                                              (deps 43 + completion emitters + V3-35)
```

`V3-47` alone in F.2 has a hard intra-wave dep on `V3-44` (it hands redistribution off to V3-44's assignment path). Everything else in F.2 is mutually parallel-safe (disjoint tables, disjoint handler keys).

---

## 1. V3-43 — Workflow Engine Foundation

- **Builds:** `@henryco/workflow` (rail: `workflow_jobs`/`workflow_runs`, `claim_workflow_jobs`/`complete_workflow_job` secdef RPCs, retry-policy, dead-letter, idempotency, `in-memory-job-store` test double); the every-minute `workflow-drain` cron; the event-trigger bridge (`dispatchWorkflowFor`); the **shared saga primitives** (CAS-claim, HMAC-callback verifier, heartbeat/visibility-timeout, append-event) that SA-3 will consume; the migration of the ≈18 existing crons behind thin enqueue wrappers; five `henry.workflow.*` events; the owner "Workflow health" tile; the **per-job AI-spend guard**; `docs/v3/workflow-engine-architecture.md`.
- **Re-grounding (critical):** its audit premise "no outbox exists" is **false** — it **generalizes** `search_index_outbox` + `drainOutbox()` (`packages/search-core`); the whole `search-index-worker` route (drainOutbox + purge + backlog/dead-letter probes + lag telemetry) becomes the first migrated client, behaviour-locked. Cron inventory corrected: six division sweeps (**not** jobs), account has six crons (add recovery-sweep + kyc-retention), division sweeps at `apps/<div>/lib/<div>/automation.ts`.
- **Re-grounding (2026-07-24 — the SA-merge scope, NEW):** SA-2/SA-3/SA-4 are now MERGED (not "SA-3 will consume" — the ticks already ship). V3-43 must additionally **retire the two shipped agency drain loops** — `/api/agency/tick` (`runAgencyTick`) and `/api/cron/operator-tick` (SA-4 `runOperatorTick`) — onto the rail as registered handlers, and land **ONE single-flight lock primitive**, migrating `studio_agency_tick_lock` + `ai_operator_tick_lock` onto it (SA-3's concurrent-tick daily-ceiling-bypass fix, `#523`, is now duplicated in two places; the rail makes it one). SA-4's `ai_operator_spend_ledger` reconciles into the shared internal-spend pattern rather than becoming a permanent third counter. A retrofit, not a prospective seam — cheapest **before** SA-4's operator migration is applied to prod (live-probed: not yet). See [RE-GROUNDING §2](./RE-GROUNDING-2026-07-24.md).
- **Deps:** V3-10 (observability/degraded-side-effect envelope) — **met** (`@henryco/observability` live). Substrate deps (`search_index_outbox`, `CRON_SECRET`, `is_platform_staff()`, `createAdminSupabase`, and now the shipped SA `acquireTickLock`/`studio_agency_tick_lock` CAS idiom to generalize) — **all present + on prod (live-probed 2026-07-24)**.
- **Risk class:** — (no money mutation) · but **owns the runaway-AI guard** the M-passes inherit.
- **Register:** D (headless + owner health tile).
- **Gates:** standard CI; engine suite (drain order, retry math + jitter, dead-letter at cap, `retryable:false`→immediate dead-letter, idempotent re-enqueue, crash-between-claim-and-complete); schema+RLS (atomic `skip locked`, no client writes, staff read); cron live; **migration parity** (every migrated cron returns prior summary + prior schedule); telemetry. **14-day soak** vs pre-migration baseline (zero dropped jobs, flat dead-letter) before authoritative.
- **Parallel-safe:** **N** — foundation; everything else registers on it.
- **PROD-ACTUAL:** confirm `CRON_SECRET` set per app; `search_index_outbox`/`is_platform_staff()` live (both in prod snapshot).

## 2. V3-44 — Auto-Assign & Escalate

- **Builds:** additive queue columns (**`assigned_at` — new**, `assignment_reason`, `escalation_level`, `escalation_path[]`) on support/marketplace/moderation/refund queues; `workflow_queue_config`; pure rule module (`resolveSupportQueue`/`nextAssignee`/`shouldEscalate`); handlers (`support.auto_assign`, `kyc.auto_assign`, `moderation.auto_assign`, `assignment.escalation_sweep`) on the rail; the manual-override route under `requireSensitiveAction`; three `henry.workflow.{assigned,escalated,reassigned}` events.
- **Re-grounding:** first **queue-routing** consumer of `triageSupportStub` (the stub already sets thread priority in account via `triageSupportInput`, `intelligence-rollout.ts`; nothing routes `suggestedQueue` into an assignable queue yet). **`assigned_at` does not exist** — this pass adds it (or proxies age via `updatedAt`/`staff_last_read_at`). Live staff surface is Track-C `/modules/[slug]`, not `(workspace)`. `support_assign_thread` RPC is caller-gated only — keep authz in the route.
- **Deps:** V3-43 (rail + event bridge + config lives alongside engine schema). Substrate (`triageSupportStub`, `assigned_to`, `is_platform_staff()`, `requireSensitiveAction`) — present.
- **Risk class:** **M (AI-adjacent)** — "AI-augmented escalation" must stay on the free stub or run **internal non-billable** ([AI-IN-AUTOMATION §4](./AI-IN-AUTOMATION.md)); reads money amounts (BIGINT) but **no debit**.
- **Register:** D (staff queues).
- **Gates:** assignment suite (queue-per-intent incl. low-confidence→general+flag, round-robin determinism, amount-range, every `shouldEscalate` branch); assign/escalation smoke; reassignment trail (reauth + audit old/new + reject self/wrong-queue); RLS. **14-day soak** (auto-assign matches human-triage distribution, no mis-escalation).
- **Parallel-safe:** **Y** (with 45/46/48). **Blocks V3-47** (config + assignment path).
- **PROD-ACTUAL:** confirm `assigned_at` not hand-added out-of-band; AI-liveness if any model triage.

## 3. V3-45 — Auto-Remind

- **Builds:** `reminder_schedules` + `reminder_dispatches` (user-own RLS, cascade-delete); ≥8-type catalog with data-driven cadence; the single consent chokepoint `evaluateReminderGate`; `reminder.schedule` + `reminder.dispatch_sweep` handlers; channel adapters over existing senders; three `henry.reminder.*` events.
- **Re-grounding:** consumes V3-37 (`abandoned_tasks` + cadence, recovery logic in `packages/lifecycle/src/recovery` — **not** `packages/interactions`) and the emitted-and-dropped engagement signals. Email is **Postmark**; `customer_preferences` has a **single** `quiet_hours_timezone`; `publishNotification` **does not dedupe** (schedule-unique + `step_index` are the idempotency); push fires only for `{urgent,security}` severities (reminders must map severity accordingly).
- **Deps:** V3-43 + V3-37. **PROD-ACTUAL:** `abandoned_tasks` is committed-not-applied (verify before relying); `user_engagement_events` is **already applied** on prod (still emitted-and-dropped).
- **Risk class:** — (no money/AI) · note **SMS is external spend** (not wallet) — track under an SMS budget.
- **Register:** L (customer, consent-gated).
- **Gates:** gate suite (quiet-hours across TZ incl. DST-edge + cross-midnight, opt-out, `sms_enabled=false`, `high_priority_only`, in-app/email survive quiet hours while push/SMS suppressed-and-rescheduled); per-type e2e; opt-out test; quiet-hours defer test; RLS. **14-day soak** (zero quiet-hours violations, zero opted-out sends).
- **Parallel-safe:** **Y**.

## 4. V3-46 — Owner Reports

- **Builds:** `owner_reports` persistence table (`is_owner()` RLS, owner-only) + the **`owner-reports` storage bucket migration + policy** (none exists today); extend `OwnerReportKind` to `quarterly`+`custom` (**without clobbering the added `daily` path**); scheduled `owner_report.{weekly,monthly,quarterly}` handlers on the rail + thin cron wrapper; custom builder route (`is_owner()`-gated, rate-limited, short-lived signed URL); **watermark** wiring (BrandedDocument's `watermark` prop is unused today) + ANTI-CLONE-P5 `${ownerId}.${timestamp}` + HMAC metadata + `branded_document_exports`; three `henry.owner_report.*` events.
- **Re-grounding:** `OwnerReportKind` is already `daily|weekly|monthly`; brand uses **owned type**, not Fraunces; recipients resolve via `OWNER_ALERT_EMAIL`/`owner_profiles` — wire `is_owner()` onto the new table. Only `/api/cron/owner-reports` is scheduled.
- **Deps:** V3-43. Soft sources (ledger/refunds/AI-margin/queue-health) degrade gracefully.
- **Risk class:** **M (AI-adjacent + financial-data-sensitivity)** — optional AI narrative runs internal non-billable; reports read financial truth (owner-only, watermarked, figures never in telemetry).
- **Register:** D (owner-only).
- **Gates:** scheduled generation (weekly/monthly/quarterly, Lagos-TZ boundaries, idempotent per (kind,period)); custom smoke; **watermark enforced** (no un-watermarked path); owner-only RLS (non-owner cannot read rows/objects; signed URL expires); graceful degradation. Soak **one full month cycle**.
- **Parallel-safe:** **Y**.
- **PROD-ACTUAL:** confirm the `owner-reports` bucket exists (or every PDF degrades to HTML-only); `owner_profiles` active owner row present.

## 5. V3-47 — Neglected-Queue Detection

- **Builds:** `queue-health-monitor` (10-min, idempotent) + `@henryco/workflow/queue-health` (compute/sla/escalation/redistribution); `queue_health_snapshots` + `queue_sla_config` + `queue_escalations`; the escalation ladder (queue-manager → +2h lead → +4h owner, one rung/episode via dedupe); the **human-gated** redistribution proposal (accept hands off to V3-44 — writes no `assigned_to` itself); `staff.queue.health_breach` staff event; five `henry.queue.*` events; the health banner + proposal action on Track-C surfaces.
- **Re-grounding:** read-only over source queues; **no `assigned_at`** → age via `updatedAt`/`staff_last_read_at` unless V3-44 landed it; `moderation_reports` **absent** (graceful-degrade), V3-19 refunds + V3-25 moderation **present**; surfaces on `/modules/[slug]`, not `(workspace)`.
- **Deps:** V3-43 **and V3-44** (assignment path + `workflow_queue_config`). Soft: V3-19/V3-25 (degrade if absent).
- **Risk class:** — (read-only).
- **Register:** D.
- **Gates:** health computation unit tests; SLA-breach smoke; escalation-chain (once per episode, resolution clears ladder); redistribution (proposal-only, accept→V3-44); graceful-degrade; RLS. **14-day soak** (real breaches page, no false-positive storms, owner-rung only on genuinely stuck queues).
- **Parallel-safe:** **Y with 45/46/48**, but **serially after V3-44** within F.2.

## 6. V3-48 — Follow-Up Campaigns

- **Builds:** the **completion-event emitters** (`order/booking/service/course.completed` — absent today, built first); `@henryco/workflow/campaigns` (four declarative `lifecycle_journey` campaigns, copy by key); the sequencer (`campaign.enroll` + `campaign.step_runner`) on the rail; `campaign_enrollments`/`campaign_step_sends`/`campaign_opt_outs`; governance at send time; deterministic A/B arm; five `henry.campaign.*` events.
- **Re-grounding (critical):** completion events **do not exist** — emit them first. Marketing "rail" = **Postmark `marketing-broadcast` stream** (not Brevo); class is **`lifecycle_journey`** (not `lifecycle`). Every marketing send passes `evaluateSuppression`/`scopeMatchesCampaign` — the full CI rule set in [CAMPAIGNS-AND-SUPPRESSION.md](./CAMPAIGNS-AND-SUPPRESSION.md). No NDPR consent ledger exists — do not assume one.
- **Deps:** V3-43 + V3-35 (campaign authoring/targeting) + the new completion emitters. Operationally informed by **D7** (unanswered — see F-D5).
- **Risk class:** — for money/AI (templated copy, no AI, no debit); **HIGH compliance-sensitivity** (marketing/consent).
- **Register:** L (customer, marketing-governed).
- **Gates:** four campaign e2e; idempotency (UNIQUE enroll, per-step-channel dedupe); opt-out + suppression (mid-sequence halt, skip with reason, never on transactional rail); quiet-hours defer; per-step funnel telemetry (arm-attributable, PII-redacted); RLS. **30-day observation**, one campaign at a time lowest-volume first, proving **zero** opt-out/suppression escape and the marketing rail is never crossed.
- **Parallel-safe:** **Y**.
- **PROD-ACTUAL:** `customer_preferences` live; Postmark `marketing-broadcast` stream created + `POSTMARK_SERVER_TOKEN` set; `email_provider` CHECK widened for the channel it uses.

---

## 7. Summary table

| Pass | Builds (headline) | Hard deps | Risk | Reg | Parallel-safe | Key re-grounding |
|---|---|---|---|---|---|---|
| **43** | the rail (generalizes search-outbox) | V3-10 ✓ | — (+runaway guard) | D | **N** (foundation) | "no outbox" is false; 6 division sweeps, not 7 |
| **44** | auto-assign + escalation | 43 | **M** (AI-adj) | D | Y | add `assigned_at`; first queue-routing stub consumer; Track-C |
| **45** | reminders (consent chokepoint) | 43, 37 | — (SMS spend) | L | Y | Postmark; single TZ; no publisher dedupe |
| **46** | owner reports (quarterly/custom/watermark) | 43 | **M** (AI-adj, fin-sensitive) | D | Y | `daily` exists; owned type; build bucket+table+watermark |
| **47** | queue-health watchdog | 43, **44** | — | D | Y (after 44) | no `assigned_at`; degrade moderation_reports |
| **48** | campaigns (emit completions first) | 43, 35 | — (HIGH compliance) | L | Y | Postmark stream; `lifecycle_journey`; events don't exist |

## 8. Cross-cutting gates every pass inherits
- Standard CI (`Lint, typecheck, test, build`) + branch off `origin/main` → PR → squash-merge (no force-push, no branch-protection bypass).
- New `henry.*` events added to the compile-enforced `HenryEventName` union **and** `docs/event-taxonomy.md`.
- i18n: user-facing strings via `@henryco/i18n` (namespaces per prompt); operator surfaces Pattern-B runtime; internal keys in `exempt.json`.
- Brand: "Henry Onyx" / "Henry Onyx Limited" via `@henryco/config`; zero hardcoded domains (helpers `getHqUrl()`/`getAccountUrl()`/`getStaffHqUrl()`); **never** the legacy `henrycogroup.com`.
- The PROD-ACTUAL check for that pass ([REGROUNDING-LEDGER §3](./REGROUNDING-LEDGER.md#3-prod-actual-checklist-verify-before-the-corresponding-build-pass)) passes **before** the pass relies on a runtime object.
