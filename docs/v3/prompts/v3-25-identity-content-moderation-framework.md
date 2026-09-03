# V3-25 — Money & Identity Spine: Content Moderation Framework

**Pass ID:** V3-25  ·  **Phase:** C (Money & Identity Spine)  ·  **Pillar:** P7 (Trust & Identity)
**Dependencies:** V3-12 (Foundation Lock acceptance)  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** Compliance

---

## Role
You are the V3 content-moderation engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass unifies today's scattered, per-division ad-hoc moderation into one cross-division framework: a `@henryco/moderation` package with a deterministic-first / AI-second scanning pipeline, a single `moderation_decisions` ledger, pre-publish + post-publish gates wired into marketplace listings, jobs posts, studio briefs, and provider/service profiles, plus a user report flow and a unified staff review queue. The line you must not cross: **moderation is LLM-assisted but human-gated** — an automated `reject` may hold content, but a human reviewer is always the final authority on contested decisions, and no content this pass marks `reject`/`hold` is ever rendered live.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/25-identity-content-moderation-framework` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
Moderation today is **per-division and ad-hoc — there is no shared framework.** The real touchpoints:

- **Marketplace:** `marketplace_moderation_cases` table + `apps/marketplace/lib/marketplace/governance.ts` handle listing governance case-by-case.
- **Jobs:** `jobs_moderation_queue` table holds flagged job content per-division.
- **Property:** `apps/property/lib/property/governance.ts` + `apps/property/lib/property/policy.ts` apply listing-validity rules in isolation.
- **Studio:** `studio_briefs` / `studio_projects` carry client-provided content with no systematic pre-publish scan.
- **Support triage:** `@henryco/intelligence` `triageSupportStub` is a regex intent classifier (NOT moderation) — it proves the deterministic-classifier pattern exists but does not moderate publishable content.
- **AI:** `@henryco/intelligence` is deterministic-only today (no LLM). The governed LLM path arrives with **V3-26 (AI provider router)**, which this pass *optionally* consumes for AI-assisted scanning.

**Gap this pass closes:** the same kinds of bad content (scams, banned goods, PII leaks, NSFW, hate speech) are policed inconsistently across four content domains, with no common decision ledger, no common deterministic ruleset, no AI assist, and no unified staff queue. A clone can exploit the weakest division. V3-25 makes one moderation spine the single gate every publishable surface passes through, and one ledger the single source of moderation truth — a labeled dataset that becomes a defensive moat.

## Mandatory scope

### S1 — `@henryco/moderation` package
Create `packages/moderation/` (server-only; `import "server-only"` at every entry).

```
packages/moderation/
  src/
    index.ts
    types.ts                 — ContentType, ModerationDecision, ModerationReason, ScannerKind, ModerationInput, ModerationOutcome
    pipeline.ts              — orchestrator: deterministic → (optional) AI → decision
    deterministic/
      profanity.ts           — open-source lexicon (hate/abuse), locale-aware
      banned-goods.ts        — drugs / weapons / restricted goods (Nigerian + international law)
      pii-leak.ts            — phone / address / email in public listing text → flag
      image-hash.ts          — perceptual-hash check vs known-bad list
    ai/
      ai-scan.ts             — calls @henryco/ai-router (V3-26) when available; per-domain prompt
      prompts.ts             — per-domain system prompts (listing / job / brief / profile)
    persist.ts               — writes moderation_decisions; idempotent on (content_type, content_id, content_hash)
  package.json               — name @henryco/moderation, private, exports server-only
```

Public surface:

```typescript
export type ContentType = "marketplace_listing" | "job_post" | "studio_brief" | "service_profile";
export type ModerationDecision = "approve" | "hold" | "reject";
export type ScannerKind = "deterministic_rule" | "ai_check" | "manual";

export interface ModerationInput {
  contentType: ContentType;
  contentId: string;
  text?: string;
  imageUrls?: ReadonlyArray<string>;
  locale: string;            // for locale-aware deterministic rules
  actorId?: string | null;
}

export interface ModerationOutcome {
  decision: ModerationDecision;
  reasons: ReadonlyArray<string>;     // stable reason codes
  scanner: ScannerKind;
  decisionId: string;
}

export async function moderate(input: ModerationInput): Promise<ModerationOutcome>;
```

### S2 — `moderation_decisions` schema (one ledger, RLS-locked)
New migration `apps/hub/supabase/migrations/2026XXXXNNNNNN_moderation_framework.sql`:

```sql
create table if not exists public.moderation_decisions (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  content_id text not null,
  content_hash text not null,                 -- dedupe key for idempotent re-scan
  content_snapshot jsonb not null,            -- PII-redacted snapshot for audit/training
  decision text not null check (decision in ('approve','hold','reject')),
  reasons text[] not null default '{}',
  scanner text not null check (scanner in ('deterministic_rule','ai_check','manual')),
  reviewer uuid references auth.users(id) on delete set null,   -- NULL for automated
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists moderation_decisions_content_idx
  on public.moderation_decisions(content_type, content_id, created_at desc);
create unique index if not exists moderation_decisions_dedupe_idx
  on public.moderation_decisions(content_type, content_id, content_hash, scanner);

create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  content_id text not null,
  reporter_id uuid references auth.users(id) on delete set null,
  reason_code text not null,
  detail text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.moderation_decisions enable row level security;
alter table public.moderation_reports enable row level security;
-- RLS: end users CANNOT read moderation_decisions (operator data). A reporter reads ONLY their own
-- moderation_reports. Staff-moderator role reads/writes both. Service-role pipeline inserts decisions.
```

`content_snapshot` is written through `@henryco/observability/redaction` (`defaultRedactor`) — no raw phone/email/address persisted in the snapshot. The dedupe unique index makes re-scan idempotent.

### S3 — Deterministic rules (always run first)
`packages/moderation/src/deterministic/*`. Run before any AI call; an unambiguous deterministic `reject` short-circuits the pipeline (no AI spend, no LLM exposure to clearly-bad content):
- **Profanity / hate-speech** — open-source lexicon, locale-aware (the 12 `@henryco/i18n` locales); `reject` on hate, `hold` on borderline profanity.
- **Banned goods** — drugs, weapons, counterfeit, wildlife, prescription meds, regulated/restricted goods per Nigerian law + common international bans; `reject`.
- **PII-leak detector** — phone numbers, street addresses, emails embedded in a *public* listing/post body → `hold` for review (sellers route contact through platform messaging, not raw listing text).
- **Image perceptual-hash** — compare against a known-bad hash list (CSAM hashes via the appropriate authority list, plus internal banned-image hashes) → `reject` on match.

### S4 — AI-assisted moderation (after deterministic; via V3-26 router)
`packages/moderation/src/ai/ai-scan.ts`. Runs only if deterministic did not already `reject` and the AI router is available. Calls `@henryco/ai-router` (V3-26) — **never a provider SDK directly**, and the provider name never surfaces. Per-domain prompts (`prompts.ts`): marketplace-listing scam/fraud detection; job-post recruitment-scam/discrimination detection; studio-brief legal/IP/abuse detection; profile-bio impersonation/abuse detection. Image classification: NSFW / violence / fraud-indicator. Text classification: scam / spam / phishing. AI output maps to `approve` / `hold` (AI alone may *hold*, escalating to a human; an AI `reject` recommendation still routes through `hold` → staff for the final call, honoring human-gated). If the AI router is unavailable, the pipeline degrades to deterministic-only and records `scanner='deterministic_rule'` — it never fails open.

### S5 — Per-domain integration (the four content gates)
Wire `moderate(...)` into every publishable surface so nothing reaches `live`/`active` without passing:
- **Marketplace:** every `marketplace_products` create + edit runs through `moderate()` before publish; reuse/replace the ad-hoc path in `apps/marketplace/lib/marketplace/governance.ts`; `hold`/`reject` blocks the listing from going live and routes the existing `marketplace_moderation_cases` into the unified queue.
- **Jobs:** every job post moderated on create/edit; fold `jobs_moderation_queue` flagged items into the unified queue.
- **Studio:** client-provided `studio_briefs` (and brief edits on `studio_projects`) scanned for legal/IP/abuse before they enter the production workflow.
- **Service / provider profiles:** provider bios moderated on create/edit.

Each integration is additive — it gates publish, it does not restructure the division's data model.

### S6 — Report-and-review flow
- User report endpoint `apps/<app>/app/api/report/route.ts` (per division that renders public content) → inserts `moderation_reports`, behind auth, rate-limited per account, audited.
- A report triggers a re-`moderate()` of the target content and surfaces it in the staff queue.
- Unified staff queue at `apps/staff/app/(workspace)/moderation/` (new workspace route — mirror the existing `(workspace)/kyc` pattern). Staff actions approve / hold / reject / dismiss-report, each writing a `manual` `moderation_decisions` row + an audit log row with a mandatory `reason`. Staff decision supersedes any automated decision (human-gated).

### S7 — Telemetry
Emit via the `@henryco/intelligence` envelope (`henry.<domain>.<noun>.<verb>`):
`henry.moderation.content.scanned`, `henry.moderation.content.held`, `henry.moderation.content.rejected`, `henry.moderation.report.filed`, `henry.moderation.staff.override`. Properties carry content type, decision, scanner, reason codes, latency — never the raw content body.

## Out of scope
- Gaming-arena anti-cheat + fair-play moderation (V3-66, gated).
- Predictive spam/fraud scoring beyond rule + classifier (V3-40 fraud & risk).
- The AI provider router itself (V3-26) — this pass *consumes* it, optionally.
- KYC identity verification (V3-24).
- Acceptable-use *policy authoring* is owner/legal work; this pass enforces the published policy, it does not write it.

## Dependencies
Depends on **V3-12** (Foundation Lock acceptance). **Optionally** consumes **V3-26** (AI router) for S4 — the pass ships deterministic-only and lights up AI scanning when V3-26 is available. No pass is hard-blocked by V3-25, but it strengthens V3-50 (provider model), V3-52 (marketplace discovery), and V3-67 (partner onboarding).

## Inheritance
Builds on: `@henryco/intelligence` event envelope + `triageSupportStub` deterministic-classifier pattern; `@henryco/observability/redaction` (`defaultRedactor`) + `@henryco/observability/audit-log` (`writeAuditLog`); existing `marketplace_moderation_cases`, `jobs_moderation_queue`, `apps/marketplace/lib/marketplace/governance.ts`, `apps/property/lib/property/governance.ts`; `requireSensitiveAction` from V3-02 for staff override; `@henryco/ai-router` (V3-26) for AI assist; `@henryco/i18n`; staff `(workspace)` route pattern.

## Implementation requirements

### Files
- `packages/moderation/` (new package — S1, S3, S4): `src/index.ts`, `src/types.ts`, `src/pipeline.ts`, `src/deterministic/{profanity,banned-goods,pii-leak,image-hash}.ts`, `src/ai/{ai-scan,prompts}.ts`, `src/persist.ts`, `package.json`, `tsconfig.json`.
- `apps/hub/supabase/migrations/2026XXXXNNNNNN_moderation_framework.sql` (new — S2).
- Per-domain publish-gate wiring: `apps/marketplace/lib/marketplace/governance.ts` (updated), jobs post create/edit path, `studio_briefs` intake path, provider-profile create/edit path (S5).
- `apps/marketplace/app/api/report/route.ts` + sibling report routes per public-content division (S6).
- `apps/staff/app/(workspace)/moderation/page.tsx` + staff moderation server action (S6).
- `docs/v3/moderation-framework.md` (new — pipeline + ruleset + per-domain integration + reason-code catalog).

### Trust / safety / compliance
- Acceptable-use policy (L6) published before live ramp; the framework enforces it.
- Human-gated: every `reject` on contested content lands in the staff queue; automated `reject` only short-circuits on unambiguous deterministic hits (banned goods, image-hash match, hate speech).
- `content_snapshot` redacted via `defaultRedactor`; raw content body never logged or in telemetry.
- Staff override path behind `requireSensitiveAction`; every staff decision audited with a mandatory `reason`.
- RLS: end users never read `moderation_decisions`; reporters read only their own `moderation_reports`.
- ANTI-CLONE Principle 10 (labeled moderation dataset = moat) + Principle 12 (every decision audited).

### Mobile + desktop parity
User report flow filable from web mobile + the Expo super-app (same `/api/report` route). Safe-area + modal-escape from V3-09 apply to the report sheet. Staff moderation queue is operator-desktop-first but responsive.

### i18n
Namespaces `surface:report` (user report sheet) and `surface:moderation-review` (staff queue). Every report-reason label, status label, decision explanation, and error flows through `@henryco/i18n` (`translateSurfaceLabel`). Deterministic profanity/lexicon rules are locale-aware across all 12 locales. Zero hardcoded user-facing strings.

### Brand & design system
Any user-facing string (report sheet, "content under review" notices) reads "Henry Onyx" via `@henryco/config` — never hardcoded, never "Henry & Co.". Acceptable-use / policy links resolve via `henryWebRoot()` — zero hardcoded domains. Report sheet + staff queue use locked design tokens (`--site-*` / `--accent`, Fraunces on editorial surfaces), light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed.

## Validation gates
1. Standard CI: `pnpm typecheck` + `pnpm lint` + `pnpm test` + `pnpm build` all green.
2. **Deterministic rule tests** — ≥ 100 cases across profanity/hate, banned goods, PII leak, image-hash; locale-aware cases included.
3. **AI moderation accuracy** — sample-based precision/recall on a labeled dataset, run through the V3-26 router mock; degrade-to-deterministic path tested (router unavailable ⇒ no fail-open).
4. **Report flow e2e** — user files report → re-`moderate()` runs → staff sees it in `(workspace)/moderation` → decision → reporter notified; idempotent re-scan (dedupe index) verified.
5. **Per-domain integration smoke** — a listing/job/brief/profile that fails moderation **never renders live** on its division surface; an approved one publishes.
6. **RLS verification** — end user cannot read `moderation_decisions`; reporter reads only own `moderation_reports`; staff-moderator reads/writes both.
7. **Redaction test** — `content_snapshot` + telemetry carry no raw PII.
8. UI gates on report sheet + staff queue: real-browser light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed.

## Deployment gate
- All validation gates green; acceptable-use policy (L6) published.
- 14-day soak with staff-queue health monitored (held/rejected volume, false-positive rate, time-to-review).
- Live ramp behind a feature flag; deterministic-only is the always-safe floor while AI scanning ramps.
- Branch `v3/25-identity-content-moderation-framework` off `origin/main` → PR → CI green → squash-merge; no branch-protection bypass, no force-push.

## Final report contract
`.codex-temp/v3-25-identity-content-moderation-framework/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion. Include the deterministic-rule coverage matrix and the AI precision/recall sample.

## Self-verification
- [ ] `@henryco/moderation` package with `moderate()` pipeline: deterministic → AI → decision (S1).
- [ ] `moderation_decisions` + `moderation_reports` schema with RLS + idempotent dedupe index (S2).
- [ ] Deterministic rules: profanity/hate, banned goods, PII leak, image-hash; locale-aware (S3).
- [ ] AI-assisted scan via `@henryco/ai-router`, per-domain prompts, degrades-not-fails-open (S4).
- [ ] Publish gate wired into marketplace listings, jobs posts, studio briefs, provider profiles (S5).
- [ ] User report flow + unified staff queue at `apps/staff/app/(workspace)/moderation` with audited override (S6).
- [ ] 5 telemetry events emitted via the `henry.moderation.*` envelope, content-body-free (S7).
- [ ] Human-gated invariant holds: no `hold`/`reject` content renders live; staff decision supersedes automation.
- [ ] L6 published; zero hardcoded domains/strings; brand = Henry Onyx.
- [ ] Report written.
