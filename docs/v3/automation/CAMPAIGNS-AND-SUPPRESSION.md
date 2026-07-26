# Campaigns & Suppression — the hard invariant, as testable CI rules

> **⚠️ RE-GROUNDED 2026-07-24 — read [RE-GROUNDING-2026-07-24.md](./RE-GROUNDING-2026-07-24.md) first.** SA-2/SA-3/SA-4 are now MERGED on `origin/main @ 241f068a` (not design-only; the base was `8c9794b5`). Where this doc says the SA machine is design-only / the fork risk is prospective, the re-grounding file is authoritative.

**Pass:** V3-F-DESIGN-01 · Design only. Deliverable 2. The brief requires this specced as **testable CI rules, not prose**. Each rule below has an id, a machine-checkable statement, a detection method, pass/fail criteria, and the failure it prevents. All symbols are grounded on `origin/main @ 241f068a` (re-grounded 2026-07-24; orig base 8c9794b5).

> **The invariant in one line:** a marketing/lifecycle send may leave the system **only** after passing the canonical suppression predicate; `transactional_only` blocks marketing; opt-out and quiet-hours are absolute; and marketing rides the marketing Postmark stream, never the auth/transactional path. This is the **STAFF-6 lesson** made into gates.

---

## 0. Canonical semantics (the single source of truth)

The one predicate every marketing send must consult is `scopeMatchesCampaign(scope, campaignClass)` (exported from `packages/newsletter/src/suppression.ts:51`), invoked inside `evaluateSuppression(...)` (`suppression.ts:71`). Its truth table — **this is the spec CI encodes**:

| suppression `scope` | suppresses these `campaignClass` values | allows |
|---|---|---|
| `all` | **every** class | — |
| `transactional_only` | `company_wide`, `division_digest`, `lifecycle_journey`, `announcement` (all marketing/lifecycle) | `transactional_education` only |
| `marketing` | `company_wide`, `division_digest`, `announcement` | lifecycle/transactional |
| `lifecycle` | `lifecycle_journey` | others |
| `digest` | `division_digest` | others |
| unknown | — (matches nothing → **fail-open risk**; treat unknown scope as `all` in any new code) | — |

Campaign classes (`packages/newsletter/src/types.ts:66`): `company_wide | division_digest | lifecycle_journey | transactional_education | announcement`. **A follow-up campaign (V3-48) is `lifecycle_journey`** — corrected from the prompt's `"lifecycle"`, which is a *scope*, not a *class* ([REGROUNDING-LEDGER H4](./REGROUNDING-LEDGER.md#1-the-headline-corrections-read-these-first)).

`evaluateSuppression` also denies on: `status ∈ {unsubscribed, suppressed}` (all classes), `status=paused` (marketing), hard-bounce ≥2 / soft-bounce ≥6, legal hold, active trust hold / unresolved disputes / payment incident (marketing), account frozen. A campaign send that skips it bypasses **all** of that.

---

## 1. The STAFF-6 anti-pattern (what CI must catch)

STAFF-6: a send loop inlined `scope === 'transactional_only'` and treated it as "not suppressed for marketing," letting marketing blasts reach opted-down addresses. It was fixed by routing through `scopeMatchesCampaign` (`eb85793d`, on main). The CI rules exist so it **cannot regress** and so V3-48 is born compliant.

```ts
// ❌ THE ANTI-PATTERN (CI must fail this)
if (entry.scope === 'transactional_only') continue;   // "not suppressed" — WRONG for marketing
// ✅ THE ONLY CORRECT FORM
if (scopeMatchesCampaign(entry.scope, campaign.campaign_class)) { suppress(); }
```

---

## 2. CI rules

Each rule is enforced by a scanner in the i18n/lint CI stage (the repo already runs a line-based `i18n:check:strict` scanner — add a `suppression:check` sibling). Rules are grep/AST-checkable; where a rule needs data-flow, it is expressed as a lint on a **required call** within a **marketing send site** (a function that calls `sendTransactionalEmail`/`publishNotification` with a marketing/lifecycle class).

### SUP-1 — No inline suppression-scope comparison in a marketing send decision
- **Statement:** inside a newsletter/marketing send loop, no code may branch on a `NewsletterSuppressionScope` value (`entry.scope === '…'`) instead of calling `scopeMatchesCampaign`. The canonical impl (`packages/newsletter/src/suppression.ts`) is exempt.
- **Detection (type/path-scoped, not a bare grep):** scan send-path files (newsletter `service.ts` send loops, the V3-48 sequencer) for a comparison of a `NewsletterSuppressionScope`-typed value / a `suppressionEntry.scope`/`entry.scope` identifier to a scope literal. A **bare** `grep "scope\s*===\s*'…'"` is NOT valid — it false-positives on three legitimate lines on a clean codebase: unrelated `Scope` types in `apps/hub/app/(site)/search/search-shared.ts:122` and `apps/care/lib/admin/care-admin.ts:208`, and the legitimate Brevo list-removal side-effect at `apps/staff/lib/newsletter/service.ts:1113` (a suppression-*write*, not a send gate). Allowlist those three; the trigger is `entry.scope`/`suppressionEntry.scope` inside a per-recipient **send** decision.
- **Prevents:** the exact STAFF-6 inversion (without false-flagging unrelated `Scope` types or suppression writes).

### SUP-2 — Every marketing/lifecycle send calls the canonical predicate
- **Statement:** any call to `sendTransactionalEmail` or `publishNotification` whose campaign/class argument is a marketing class (`company_wide|division_digest|lifecycle_journey|announcement`) must be dominated by a call to `evaluateSuppression(...)` (or `scopeMatchesCampaign`) in the same function whose result gates the send.
- **Detection:** AST lint (`suppression:check`): for each send call-site tagged `campaignClass ∈ marketing`, require a guarding `evaluateSuppression`/`scopeMatchesCampaign` in the enclosing block. The V3-48 sequencer must annotate step sends with their class so the linter can see it.
- **Pass fixture:** `campaign.step_runner` calls `evaluateSuppression` → `allowed` before `sendTransactionalEmail`. **Fail fixture:** a step that emails without the guard.
- **Prevents:** a campaign step shipping without governance.

### SUP-3 — Marketing rides the marketing Postmark stream, never the auth/transactional path
- **Statement:** a `lifecycle_journey`/marketing email must resolve to the `marketing-broadcast` Postmark stream and must never use an `auth`/`security` purpose. (Rail separation is now **stream + purpose**, not vendor — Resend/Brevo/SES are retired code invariants; see [REGROUNDING-LEDGER H3](./REGROUNDING-LEDGER.md#1-the-headline-corrections-read-these-first).)
- **The subtlety (real design gotcha):** `resolvePostmarkStream` sees only `purpose`/`messageStream` — **never `campaignClass`** — and only `purpose:'newsletter'` auto-maps to `marketing-broadcast`. A **division** purpose (`marketplace`/`care`/`learn`/…), which a campaign sets for **sender branding**, falls through to the **transactional** lane (`outbound`/per-division `fabric-care`/…). So a division-branded campaign MUST **also** pass an explicit `messageStream:'marketing-broadcast'` override (the highest-precedence branch). Sender identity and stream are orthogonal: `purpose` drives the sender, the explicit `messageStream` drives the lane.
- **Detection:** unit assertion in `packages/email` + a lint: for a campaign send, assert `resolvePostmarkStream(input) === 'marketing-broadcast'` (⇒ either `purpose:'newsletter'` or an explicit `messageStream:'marketing-broadcast'`) **and** `purpose ∉ {auth, security}`. Lint fails a campaign send where `purpose !== 'newsletter'` and no `messageStream:'marketing-broadcast'` override is present.
- **Prevents:** a division-branded marketing blast silently riding a transactional stream (sender-reputation + compliance breach).

### SUP-4 — Quiet-hours is deferral, not drop (push/in-app)
- **Statement:** a push/in-app send scheduled inside the recipient's quiet-hours window must be **rescheduled to the window edge**, not dropped; and must record a suppression reason.
- **Detection:** required test — `evaluateReminderGate`/campaign governance returns `{reason: 'quiet_hours'}` **and** the sequencer re-enqueues at `quietHoursEdge(now, prefs)`; assert the schedule advances rather than the step being marked `sent`/`failed`. Quiet-hours resolved against the single `customer_preferences.quiet_hours_timezone` (default 22:00–07:00).
- **Prevents:** silent loss of a deferred nudge.

### SUP-5 — Per-type / per-channel opt-out is absolute and observable
- **Statement:** a `reminder_type` in `muted_event_types`, or its division in `muted_divisions`, yields no send on that type/channel; every suppression writes `reminder_dispatches.suppressed_reason` / `campaign_step_sends.skip_reason` — never silent.
- **Detection:** required tests — opted-out user receives nothing on that type/channel; the corresponding `suppressed_reason`/`skip_reason` row exists; `henry.reminder.opted_out` / `henry.campaign.step.skipped` emitted with the reason.
- **Prevents:** honoring opt-out in behaviour but not in the audit trail (and vice-versa).

### SUP-6 — SMS requires explicit opt-in + high priority (never default-on)
- **Statement:** an SMS dispatch requires `customer_preferences.sms_enabled = true` **and** a high-priority type; otherwise `channel_disabled`.
- **Detection:** required test — `sms_enabled=false` ⇒ no SMS + `suppressed_reason='channel_disabled'`; a non-high-priority type never selects the SMS channel.
- **Prevents:** surprise SMS cost + consent breach.

### SUP-7 — Idempotent enrollment / send (no double-contact)
- **Statement:** one enrollment per (user, campaign, source-entity) — a UNIQUE constraint; per-step-channel dedupe so an engine retry never double-sends; one live `reminder_schedules` row per actionable item.
- **Detection:** DB constraint presence check (migration lints for the UNIQUE) + tests: duplicate completion event → one enrollment; step retry → one send per channel.
- **Prevents:** the durable-retry rail turning into a double-send machine.

### SUP-8 — Governance is checked at SEND time, not enroll time
- **Statement:** an opt-out/suppression that occurs **between** steps halts the remaining sequence; governance is re-evaluated per step.
- **Detection:** required test — opt-out after step 1 ⇒ steps 2..n are `skipped` with `skip_reason`, none sent.
- **Prevents:** a user who opts out mid-sequence still getting the tail (the "we already enrolled you" excuse).

### SUP-9 — Campaign class is `lifecycle_journey`; reminders carry no newsletter class at all
- **Statement:** a `CampaignDefinition.campaignClass` is `lifecycle_journey` (marketing), never `transactional_education` (the only transactional-family `NewsletterCampaignClass`). Conversely, a V3-45 reminder (transactional) sets **no** `NewsletterCampaignClass` at all — it does not flow through `evaluateSuppression` and never rides the `marketing-broadcast` stream.
- **Detection:** type-level (the to-be-authored `CampaignDefinition` type pins `campaignClass: "lifecycle_journey"` — realizable once V3-48 authors the type) + lint that a reminder send uses a per-division transactional purpose/stream and no `NewsletterCampaignClass`.
- **Prevents:** the two engines' rails crossing (V3-45 transactional vs V3-48 marketing).

### SUP-10 — NDPR / consent posture is explicit (no assumed consent ledger)
- **Statement:** because **no NDPR consent ledger exists on main** ([REGROUNDING-LEDGER §2.4](./REGROUNDING-LEDGER.md#24-suppression--consent--email-rails-v3-4548-hard-invariant)), consent truth is `email_subscribers.consent_given_at` + `customer_preferences` opt-outs + suppression entries. No campaign may assume a `consent_ledger`/`ndpr_consent` record; if V3-93's consent ledger later lands, it becomes the system of record and this rule tightens to require a positive consent row.
- **Detection:** lint — no reference to a non-existent `consent_ledger`/`ndpr_consent` table in Phase F code; a documented TODO seam for V3-93.
- **Prevents:** designing against a table that doesn't exist (the V3-73 lesson).

---

## 3. The transactional-vs-marketing boundary

The two automation engines are kept on separate rails **by class + stream**, and CI enforces it (SUP-3, SUP-9):

| | V3-45 reminders | V3-48 campaigns |
|---|---|---|
| Trigger | **incomplete** action (abandoned cart, paused KYC) | **completed** event (purchase, course) |
| Class | transactional (nudge) | `lifecycle_journey` (marketing) |
| Governance | quiet-hours + per-type/channel opt-out (**not** `evaluateSuppression`) | **`evaluateSuppression`/`scopeMatchesCampaign` before every send** + quiet-hours + opt-out |
| Email stream | per-division transactional purpose/stream | `marketing-broadcast` (explicit `messageStream` override; division `purpose` still sets the sender) |
| Register | L (customer) | L (customer) |

A completed action **cancels** the matching reminder; a campaign **suppresses** if a reminder schedule for the same item is active (avoid double-contact). They never share a class or a stream.

---

## 4. Test matrix (what the build passes must prove)

| Test | Rule | Assertion |
|---|---|---|
| transactional_only ⇒ marketing suppressed | SUP-1/SUP-2 | `scopeMatchesCampaign('transactional_only','lifecycle_journey') === true` → send skipped |
| unsubscribed ⇒ all suppressed | SUP-2 | `evaluateSuppression` denies for `status='unsubscribed'` any class |
| marketing on marketing stream | SUP-3 | campaign email `resolvePostmarkStream(input)==='marketing-broadcast'` (via explicit `messageStream` override when `purpose` is a division), purpose ∉ {auth,security} |
| quiet-hours defers push | SUP-4 | push inside window → rescheduled to edge, not dropped, reason recorded |
| opt-out mid-sequence halts | SUP-8 | step 2..n skipped with `skip_reason` after step-1 opt-out |
| SMS gated | SUP-6 | `sms_enabled=false` ⇒ no SMS, `channel_disabled` |
| idempotent enroll | SUP-7 | duplicate completion → single enrollment (UNIQUE), retry → single send/channel |
| escape rate = 0 | SUP-2/5 | 30-day observation: zero marketing send to a suppressed/unsubscribed user |
| rail never crossed | SUP-3/9 | zero campaign sends on the auth/transactional lane |

**Deployment gate (V3-48):** ship behind a per-campaign flag, enable one at a time lowest-volume first; 30-day observation proving opt-out/suppression escape rate is **zero** and the marketing rail is never crossed before all four campaigns are on.
