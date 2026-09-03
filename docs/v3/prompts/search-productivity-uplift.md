# SEARCH-CORE-01 — Dashboard Search Productivity Uplift (backend only)

**Pass ID:** SEARCH-CORE-01  ·  **Phase:** B-adjacent (Foundation polish / capability)  ·  **Pillar:** P3 (Personalization) + P12 (Global UX)
**Dependencies:** V3-10 (`@henryco/observability` + `henry_events` owner tile), V3-07 (i18n strict gate), V3-IDENTITY-01 (#188, brand truth)  ·  **Effort:** L (2–4 sessions; this session targets Phases 1–3)  ·  **Parallel-safe:** Y
**Owner gate:** Visual sign-off on the upgraded relevance + recents UX  ·  **Risk class:** —

---

## Role

You are the V3 Search engineer for Henry Onyx. You execute exactly this one pass — make the dashboard search engine more accurate, more productive, and production-ready on the BACKEND — then stop and report. Every query must return relevant, freshly-indexed results; recents persist sensibly per user; suggestions surface the right next thing for the user's role; module-jump shortcuts are reliable; zero-result queries become observable so the catalogue can be expanded. The line you must not cross: **`packages/search-ui/` is OFF-LIMITS** (memory `feedback_dashboard_search_engine_no_touch.md` — it is the quality reference renderer). This pass works only on the backend that feeds it: `packages/search-core/`, the per-app `/api/search/*` routes, the outbox pipeline, Typesense collection config, and ranking helpers. No fake-data fixtures, no stubbed endpoints.

Owner directive, verbatim: "Maximize, standardize and upgrade the dashboard search engine to be more accurate and helpful, also so that it will be more productive. … production ready, no shallow or fake data or fake work … should complete the whole wonderful work the theme has done so that it will be well polished, smooth, and satisfying in maximum."

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/search-productivity-uplift` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) + Typesense |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

Branch off `origin/main`. Use absolute paths. Do not auto-merge — owner reviews search relevance visually before merge.

## Audit summary

`packages/search-core/src/` already ships: `client.ts` (Typesense client wrapper), `collections.ts` (per-division collection schemas), `collection-tuning.ts` (field weights / typo tolerance config), `outbox.ts` (DB → Typesense sync pipeline), `palette-ranker.ts` (command-palette ranking), `query.ts` (filters/facets/sort construction), `ranking.ts` (relevance scoring), `rate-limit.ts`, `role.ts` (role-aware collection access), `schema.ts`/`types.ts` (shared types), `synonyms.ts`, `suggestions.ts`, plus `__tests__/`. A prior audit landed at `docs/v3/search-audit-2026-05-23.md`. The renderer — `packages/search-ui/src/palette/DashboardCommandPalette.tsx` and `KeyboardCheatSheet.tsx` — is owner-reserved and must stay byte-stable; if it needs new ranking signals, feed them through the props/types it already exposes.

**The gaps this pass closes:** (1) indexing reliability is not yet SLO-observable — there is no lag/failure telemetry and no backfill-audit reconciling DB row counts against Typesense document counts; (2) relevance tuning (typo tolerance, synonyms, field weights, per-division diversity caps, personalization signals) exists in scaffolding but is not fully wired/tuned per collection; (3) recents are device-local (localStorage), not cross-device per user; (4) suggestions and the Cmd+1..9 module-jump registry need a verified server-derived source of truth; (5) zero-result queries are not logged, so the catalogue-expansion plan is blind.

## Mandatory scope

### S1 — Backend audit refresh (foundation)
Refresh `docs/v3/search-audit-2026-05-23.md` (or add a dated successor) covering, per area, the current real state + the gap: **Collections** (every Typesense collection: schema, indexed fields, weights, facets, sort; which divisions/content types feed each) · **Outbox** (what writes to it, which DB triggers fire on INSERT/UPDATE/DELETE, DB-write → index latency) · **Routes** (every `/api/search` endpoint: request shape, role check, query construction, response shape, rate-limit policy) · **Ranking** (weights, typo tolerance, synonyms, boosts) · **Recents** (storage location, per-device vs cross-device, retention) · **Suggestions** (static / role-aware / learned) · **Module jump** (how Cmd+1..9 resolves; registry source) · **Zero-result handling** (logged or silent).

### S2 — Indexing reliability + SLO observability
Audit each DB trigger feeding the outbox (correct events, bulk-safe). Verify the outbox consumer (worker/cron/edge function) retries with backoff on transient Typesense failures. Register and emit `henry.search.indexing.lag` (from the outbox worker; V3-10's owner tile reads `henry_events`) and `henry.search.indexing.failed` (with failure class: `network | schema_mismatch | rate_limit`). Ship `scripts/v3/search-backfill-audit.mjs` comparing each source table's row count to its Typesense collection document count, reporting the gap; owner-gated apply mode (`OWNER_OK=true --apply`) re-indexes missing rows only.

### S3 — Relevance + ranking
Tune `collection-tuning.ts` per collection: Typesense `num_typos: 1` (2 for longer queries) on the right fields; field weights boosting name/title over body and boosting recent/active items. Populate `synonyms.ts` per division (marketplace `tee→t-shirt`, `naija→nigerian`; care `cleaning→housekeeping`; etc.) and wire via Typesense's `synonyms` API. Pass the user's role + division + recent-activity signals into the query so results score against context (document each signal and its influence in `ranking.ts`). Add a per-division result-diversity cap with overflow fallback so a generic query spans divisions instead of flooding one type.

### S4 — Recents + suggestions (cross-device)
Move recents from localStorage-only to Supabase-backed cross-device per user. Migration (author SQL, do NOT auto-apply to prod):
```sql
create table public.search_user_recents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  surface text not null,
  query text not null,
  result_clicked_id text,
  created_at timestamptz not null default now()
);
create index search_user_recents_user_created_idx
  on public.search_user_recents (user_id, created_at desc);
alter table public.search_user_recents enable row level security;
create policy "recents_owner_select" on public.search_user_recents
  for select using (auth.uid() = user_id);
create policy "recents_owner_insert" on public.search_user_recents
  for insert with check (auth.uid() = user_id);
create policy "recents_owner_delete" on public.search_user_recents
  for delete using (auth.uid() = user_id);
```
Retention: 30-day rolling (cron prune). Wire the suggestions surface (`suggestions.ts`) so an empty-query palette shows most-recent (5) + most-used commands (5) + role/division trending content (5), where "trending" is computed from `henry_events` clicks over the last 7d filtered by role. Verify the Cmd+1..9 module-jump registry is server-derived (per the existing `getOwnerRailEntries(viewer)` pattern), not client-hardcoded; document its source of truth.

### S5 — Zero-result observability
Emit `henry.search.query.zero_results` with `{ query, surface, role, division, hint_count }` when a query returns fewer than N relevant hits. Extend V3-10's owner-workspace observability tile (or add a "search-health" tile) to show the top-N zero-result queries from the last 7d — this drives the catalogue-expansion plan.

### S6 — Tests + verification
Unit tests for ranking helpers (snapshot the score function on canonical inputs). Integration smoke for the outbox pipeline (write to DB → assert the document appears in Typesense within N seconds). Assertion-driven E2E smoke for the federated `/api/search` route (not visual).

## Out of scope
- `packages/search-ui/` — owner-reserved, full reservation (renderer untouched).
- New search providers (Algolia, Elasticsearch) — stay on Typesense.
- New search SURFACES / pages — improve the existing palette + per-app routes only.
- The account customer-dashboard UI shell — owned by ACCOUNT-PREMIUM-01 (search RESULTS for customers are in scope; the shell is not).
- Mobile Expo apps (`apps/super-app`, `apps/company-hub`).

## Dependencies
Depends on V3-10 (observability + `henry_events`), V3-07 (i18n gate). BLOCKS nothing as a hard gate, but a reliable, observable, well-ranked search backend is the substrate the personalization passes (V3-34 personalization-home, V3-36 cross-division recommendations) draw their relevance signals from — keep the ranking-signal contract documented for them.

## Inheritance
`@henryco/search-core` (client, collections, outbox, ranking, synonyms, suggestions, role, rate-limit), `@henryco/observability` (events, `henry_events`, owner tile), `@henryco/config` (role/division), `@henryco/i18n`. Typesense as the index. The owner-rail pattern `getOwnerRailEntries(viewer)` as the server-derived-registry template.

## Implementation requirements

### Files
- `packages/search-core/src/{outbox,collection-tuning,synonyms,suggestions,ranking,query}.ts` (tuning + signals + diversity + retries).
- `packages/observability/src/events.ts` (add `henry.search.indexing.lag/failed`, `henry.search.query.zero_results`).
- `scripts/v3/search-backfill-audit.mjs` (new).
- Migration SQL for `search_user_recents` (authored, NOT auto-applied) + recents read/write path in search-core + the per-app route that records them.
- `docs/v3/search-audit-2026-05-23.md` (refreshed/successor).
- Report at `.codex-temp/search-productivity-uplift/report.md`.

### Trust / safety / compliance
`search_user_recents` is RLS-locked to the owner (`auth.uid() = user_id`) for select/insert/delete — author the policies above; no service-role recents access. Role-aware collection access (`role.ts`) is enforced so a user never gets results from collections their role can't see. Rate-limit policy (`rate-limit.ts`) stays enforced per surface. No migration is applied to production without explicit owner approval — author the SQL, document it, propose a dry-run. Telemetry payloads carry the query text (needed for zero-result analysis) but no other PII; redact per `@henryco/observability` redaction rules.

### Mobile + desktop parity
Backend-only — no viewport concern of its own; the owner-reserved renderer handles presentation across viewports. N/A beyond ensuring response shapes the existing palette consumes are unchanged. Expo super-app out of scope.

### i18n
This pass is backend, but any user-facing string it introduces (e.g. zero-result hint copy, suggestion-section labels surfaced to the renderer via props) flows through `@henryco/i18n` under `surface:search` — never hardcode. Synonym tables are data, not user copy. `pnpm i18n:check:strict` stays green.

### Brand & design system
No UI rendered here, so no token work — but any brand string surfaced through props (section headers, empty-search copy) is **Henry Onyx** sourced from `@henryco/config`, never the retired "Henry & Co.". Division labels in trending/suggestions read `COMPANY.divisions[...].name` ("Henry Onyx <Division>"). Zero hardcoded domains in any deep-link a result emits — use `henryDomain(division)` / `henryWebRoot()`.

## Validation gates
1. `pnpm -F search-core typecheck` + lint PASS.
2. `pnpm i18n:check:strict` PASS (V3-07 gate).
3. Unit tests for ranking helpers PASS; integration outbox smoke PASS (DB write → Typesense doc within SLO); `/api/search` E2E smoke PASS.
4. `henry.search.indexing.lag/failed` and `henry.search.query.zero_results` registered and emitting with correct payloads (no existing event removed).
5. `search_user_recents` RLS verified — a second user cannot read another user's recents (tested).
6. `scripts/v3/search-backfill-audit.mjs` runs read-only and reports the DB-vs-Typesense gap; apply mode gated on `OWNER_OK=true`.

## Deployment gate
All gates green. Migration authored but NOT applied to prod without explicit owner approval. DRAFT PR opened, NOT auto-merged. Owner reviews search relevance + the recents/suggestions UX visually before merge. Session 1 target: Phases S1–S3; S4–S6 may spill to session 2 with crisp pickup notes.

## Final report contract
`.codex-temp/search-productivity-uplift/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion), plus the audit-doc link and a per-area improvement summary (indexing reliability, relevance tuning, recents, suggestions, zero-result observability).

## Self-verification
- [ ] `docs/v3/search-audit-2026-05-23.md` refreshed — per-area current state + gaps
- [ ] Outbox triggers + consumer hardened (correct events, bulk-safe, retry/backoff)
- [ ] `henry.search.indexing.lag` + `henry.search.indexing.failed` registered + emitting
- [ ] `scripts/v3/search-backfill-audit.mjs` reports DB-vs-Typesense gap; apply mode `OWNER_OK`-gated
- [ ] Typo tolerance + per-division synonyms + field weights tuned in `collection-tuning.ts`/`synonyms.ts`
- [ ] Personalization signals (role/division/recent activity) wired into the query; diversity cap added
- [ ] `search_user_recents` table + RLS authored (not auto-applied); recents cross-device; 30-day retention prune
- [ ] Suggestions wired (recents + most-used + role/division trending from `henry_events`); module-jump registry confirmed server-derived
- [ ] `henry.search.query.zero_results` firing; search-health owner tile rendering top-N zero-result queries
- [ ] Ranking unit tests + outbox integration smoke + `/api/search` E2E smoke PASS
- [ ] Brand = Henry Onyx via `@henryco/config`; copy via `@henryco/i18n` (`surface:search`); zero hardcoded domains/strings
- [ ] `packages/search-ui/` untouched; `pnpm i18n:check:strict` + typecheck + lint PASS; DRAFT PR opened, not auto-merged
