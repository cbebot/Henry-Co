# V3-25 — Content Moderation Framework

**Status:** built; package + migration + marketplace gate + report flow + staff surface shipped.
**Live ramp:** behind `MODERATION_ENFORCED` (deterministic-only floor). DORMANT by default.
**Package:** `@henryco/moderation` · **Migration:** `apps/hub/supabase/migrations/20260616120000_v3_25_moderation.sql`

One cross-division moderation spine: a `@henryco/moderation` package with a
deterministic-first / AI-second / human-gated pipeline, a single
`moderation_decisions` ledger + `moderation_reports` table, publish gates wired
into division write paths, a user report flow, and the unified staff queue.

---

## The line we never cross

**Moderation is LLM-assisted but human-gated.** An automated `reject` may hold
content, but a human reviewer is always the final authority on contested
decisions, and **no content marked `hold`/`reject` ever renders live.**

- An **unambiguous deterministic** hit (banned goods, hate speech, known-bad
  image hash) is the ONLY thing that auto-rejects — and it short-circuits the
  pipeline (the AI is never shown clearly-bad content; no AI spend).
- The **AI can never reject.** A router `reject` recommendation is downgraded to
  `hold` (`normalizeAiResult`) → a human makes the final call.
- If the AI router is absent / errors / times out, the pipeline **degrades to
  deterministic-only** and records `scanner='deterministic_rule'`. It **never
  fails open.**

---

## Pipeline

```
moderate(input, deps)                         (@henryco/moderation/server)
  └─ runDeterministic(input)                  pure; always runs (the safe floor)
       ├─ detectBannedGoods   → reject (unambiguous, short-circuit)
       ├─ detectProfanity     → reject (hate) | hold (profanity)
       ├─ detectPiiLeak       → hold   (composes @henryco/trust detectOffPlatformContact)
       ├─ detectScam          → hold   (composes @henryco/trust detectSuspiciousContent)
       └─ checkImageHashes    → reject (unambiguous) — when hashes + known-bad set supplied
  └─ (if not unambiguous-reject) runAiScan(aiRouter, input)   → approve|hold (reject→hold)
  └─ combineVerdicts(deterministic, aiResult)  pure; approve < hold < reject, strongest wins
  └─ persistDecision(supabase)                 idempotent on (type,id,hash,scanner)
  └─ emit(buildScanEvent(...))                 henry.moderation.content.{scanned|held|rejected}
```

`evaluate()` / `combineVerdicts()` are pure (no I/O) and are the unit-test
surface (147 tests, `pnpm --filter @henryco/moderation test`).

### AI router (V3-26) via dependency injection

The package **never imports a provider SDK or `@henryco/ai-router`**. The caller
injects a `ModerationAiRouter { scan(req): Promise<AiScanResult | null> }`. When
V3-26 lands, a thin adapter implements that interface against the governed
router — zero rework here. Until then, no router is injected and the
deterministic floor governs.

---

## Deterministic ruleset

| Detector | File | Decision | Unambiguous? | Notes |
|---|---|---|---|---|
| Banned goods | `deterministic/banned-goods.ts` | reject | yes | drugs/weapons/counterfeit/wildlife/human-body/regulated-medicine/illicit-digital; Nigerian + international; benign "glue/water/nail gun" guarded |
| Hate speech | `deterministic/profanity.ts` | reject | yes | 12-locale lexicon + group-targeted incitement constructs; leetspeak + accent normalisation; CJK substring matching |
| Profanity | `deterministic/profanity.ts` | hold | no | borderline language → human review |
| PII leak | `deterministic/pii-leak.ts` | hold | no | phone/email/street-address; composes trust `detectOffPlatformContact` |
| Off-platform contact | `deterministic/pii-leak.ts` | hold | no | messaging apps / social / meeting links / QR bypass |
| Suspected scam | `deterministic/index.ts` (`detectScam`) | hold | no | composes trust `detectSuspiciousContent` |
| Image hash | `deterministic/image-hash.ts` | reject | yes | perceptual hash vs caller-supplied known-bad set (CSAM authority list + internal bans); exact or Hamming-tolerant |

The profanity lexicon is a **seed** to be augmented by an authority-maintained
per-market list; the durable part is the detection MECHANISM (locale routing,
obfuscation normalisation, word-boundary vs substring matching). Image bytes are
not decoded here — perceptual hashes are computed out-of-band and the known-bad
set is supplied by the caller at deploy time.

---

## Reason-code catalog (`moderation_decisions.reasons[]`)

`banned_goods` · `hate_speech` · `profanity` · `pii_leak` · `off_platform_contact`
· `scam_suspected` · `image_hash_match` · `ai_flagged_scam` · `ai_flagged_nsfw`
· `ai_flagged_abuse` · `ai_flagged_other` · `user_reported`

Human-readable labels live in `@henryco/i18n` `getModerationCopy().review.reasonCodes`
(keep in lockstep). Report-sheet reason codes (user-facing picker):
`scam_or_fraud` · `prohibited_item` · `offensive_content` · `personal_info` ·
`spam` · `impersonation` · `other`.

---

## Schema + RLS (`20260616120000_v3_25_moderation.sql`)

- **`moderation_decisions`** — operator ledger + training corpus. End users
  **cannot read it** (no end-user SELECT policy; gated by `is_staff_in_any()`).
  Service-role inserts; `content_snapshot` is PII-redacted (`buildContentSnapshot`
  masks phone/email/address + runs `defaultRedactor`). Idempotent re-scan via
  unique `(content_type, content_id, content_hash, scanner)`.
- **`moderation_reports`** — a reporter reads ONLY their own rows
  (`reporter_id = auth.uid()`); staff read all. All writes (report insert, status
  change) go through service-role server actions — **no request-role write grant**.
- Both: `content_type` CHECK kept in lockstep with `ContentType` (constraint-drift
  guard). `data_retention_policies` rows registered (guarded — self-skips where
  the governance table is absent, e.g. the bare CI DB).

**Apply protocol (committed-NOT-applied; OWNER-GATED):**
```
supabase db query --linked --workdir apps/hub \
  -f supabase/migrations/20260616120000_v3_25_moderation.sql
```
(ONE atomic txn; never `supabase db push`.) Then set `MODERATION_ENFORCED=true`.

**RLS/grant proof:** `apps/hub/supabase/tests/moderation_grant_invariant.sql`
(+ `moderation_min.sql` seed). Runnable on a bare postgres:17; ready to wire as a
CI job mirroring `payments-grant-invariant` once a Postgres is available to
verify it locally.

---

## Per-domain integration (S5 publish gates)

The gate keeps a listing/post/brief/profile out of `live`/`approved` on
`hold`/`reject`. All gates are **flag-gated** (`MODERATION_ENFORCED`) → no-op when off.

| Domain | Status | Chokepoint |
|---|---|---|
| `marketplace_listing` | ✅ wired | `vendor_product_upsert` in `apps/marketplace/app/api/marketplace/route.ts` via `lib/marketplace/moderation.ts` — reject blocks the insert; hold forces `approval_status='under_review'` (it can never reach `approved`/live, the public read filter). |
| `job_post` | ⏳ ready-to-wire | jobs post create/edit publish path — same `moderate({contentType:"job_post",...})` + force non-published status on hold/reject. |
| `studio_brief` | ⏳ ready-to-wire | studio brief intake before the production workflow. |
| `service_profile` | ⏳ ready-to-wire | provider/service profile bio create/edit (V3-50 provider model not yet built — gate the existing bio-edit surface when it lands). |

The marketplace integration is the reference; the other three are mechanical
copies of the same seam (`moderateListing`-style wrapper + status clamp).

---

## Report-and-review flow (S6)

- **User report endpoint** — `apps/marketplace/app/api/report/route.ts` (template):
  auth-gated, rate-limited (`lib/report-rate-limit.ts`, 10/min/user, fail-closed),
  validates the reason code, inserts via `fileReport()` (service-role), best-effort
  re-moderates the target, audits via `add_audit_log_v2`. Other divisions: copy the
  route + `fileReport({contentType:"...",...})`.
- **Unified staff queue** — the existing Track C `staff-moderation` module
  (`/modules/staff-moderation`) now merges `moderation_reports` into its queue
  snapshot (`loadModerationQueueSnapshot`), gated to staff by RLS. Reports appear
  alongside the existing cases with severity-driven SLA. Staff override path +
  `recordManualDecision` (scanner='manual', supersedes automation) available for
  the decision write.

---

## Telemetry (S7)

`henry.moderation.content.scanned` · `…content.held` · `…content.rejected` ·
`…report.filed` · `…staff.override`. Built by pure builders in `telemetry.ts`,
validated against the canonical `henryEventEnvelopeSchema` (the telemetry test
emits through `trackEvent` and asserts the event survives validation). Properties
carry content type, decision, scanner, reason codes, latency — **never the raw
content body**. Emission is via an injected sink (`deps.emit`); divisions wire
their intelligence sink where one exists.

---

## Deferred / follow-ups

- Wire the jobs / studio / service-profile publish gates (mechanical, same seam).
- Add `/api/report` routes to the remaining public-content divisions (copy template).
- Wire the moderation grant-invariant as a CI job once a Postgres is available to
  prove it locally (the test + seed are committed and ready).
- Inject the V3-26 governed AI router adapter to light up AI scanning.
- Operator-surface i18n of the staff module render strings is V3-07b scope.
- Acceptable-use policy (L6) authoring is owner/legal work; this framework
  enforces the published policy, it does not write it.
