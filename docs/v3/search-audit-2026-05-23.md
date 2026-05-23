# SEARCH-01 — Dashboard Search Productivity Audit (2026-05-23)

**Pass:** SEARCH-01 (session 1 of 2)
**Author:** V3 Search engineer
**Branch:** `feat/search-productivity-uplift`
**Branch base:** `main @ 1768a99d`
**Scope:** Audit of backend search — `packages/search-core/`, per-app `/api/search/*` routes, the outbox pipeline, Typesense collection definitions, ranking helpers. `packages/search-ui/` is owner-reserved and NOT touched.

This is the foundation document for the uplift. It captures what exists today, where it leaks, and the gap list. Phase 2 + Phase 3 work in this session is driven by the findings here; Phases 4–6 spill to session 2 with crisp pickup notes at the bottom.

---

## 1. Collections (Typesense schema)

Source: `packages/search-core/src/collections.ts` (15 collections defined; 219 lines).

| Collection | Division | Default visibility | Staff-only | User-scoped | Extra facets |
|---|---|---|---|---|---|
| hc_marketplace_products | marketplace | public | no | no | category, brand, store_id, verified_seller |
| hc_marketplace_stores | marketplace | public | no | no | verified_seller |
| hc_property_listings | property | public | no | no | area, listing_type, bedrooms |
| hc_property_areas | property | public | no | no | (none) |
| hc_jobs_postings | jobs | public | no | no | category, remote, employer_id |
| hc_jobs_employers | jobs | public | no | no | (none) |
| hc_learn_courses | learn | public | no | no | category, instructor_id |
| hc_learn_certificates | learn | public | no | no | issued_at |
| hc_care_services | care | public | no | no | (none) |
| hc_care_providers | care | public | no | no | (none) |
| hc_logistics_shipments | logistics | staff/staff_owner/platform_owner | YES | no | shipment_state, origin_city |
| hc_studio_projects | studio | staff/staff_owner/platform_owner | YES | no | project_state |
| hc_support_threads | account | owner/staff/platform_owner | no | YES | thread_state |
| hc_notifications | account | owner | no | YES | category |
| hc_workflows | account | owner | no | YES | cta_label, due_at |

Base schema (15 fields) is shared: `id, type, division, title, summary, deep_link, role_visibility, trust_state, created_at, updated_at, tags, badge, icon, owner_user_id, staff_scope` + 3 ranking signal floats.

**Indexed fields** at query time: `title, summary, tags, badge` (hard-coded in `query.ts:139`).

**Default sort**: `_text_match:desc, updated_at:desc`.

### Findings

- Collection schemas are coherent and role-segmented.
- BUT: only 3 of 15 collections actually carry data today (see §2). The other 12 are provisioned but empty.
- No per-collection `query_by_weights` are configured at the multi_search level — every field competes equally, which means a query matching a tag carries as much weight as one matching the title. **Gap.**
- No Typesense-side synonyms are configured. **Gap.**
- `num_typos` is not set in the multi_search body — Typesense default (`num_typos: 2`) applies uniformly across collections, including short identifiers where typo tolerance creates noise. **Gap.**

---

## 2. Outbox pipeline (DB → Typesense)

Source: `apps/hub/supabase/migrations/20260502180000_search_index_outbox_v2_search_01.sql` + `packages/search-core/src/outbox.ts` + `apps/hub/app/api/cron/search-index-worker/route.ts` + `scripts/search-backfill.mjs`.

### Schema (production reality per `packages/data/src/database.types.ts`)

```
public.search_index_outbox(
  id           bigserial PK,
  collection   text NOT NULL,
  document_id  text NOT NULL,
  operation    text NOT NULL  -- 'upsert' | 'delete'
  payload      jsonb NOT NULL DEFAULT '{}',
  enqueued_at  timestamptz NOT NULL DEFAULT now(),
  attempted_at timestamptz,
  attempts     int NOT NULL DEFAULT 0,
  last_error   text,
  completed_at timestamptz
)

Indexes:
  idx_search_outbox_pending     (enqueued_at) WHERE completed_at IS NULL
  idx_search_outbox_collection_doc (collection, document_id)

RLS: deny all to authenticated/anon; service_role bypasses.
```

### What writes to the outbox?

Only ONE trigger fires today:

```
tr_workflow_targets_to_outbox
  on public.search_workflow_targets
  AFTER INSERT OR UPDATE OR DELETE
  → enqueue_search_index_op(..., 'hc_workflows', ...)
```

NO triggers exist for:
- marketplace products / stores
- property listings / areas
- jobs postings / employers
- learn courses / certificates
- care services / providers
- logistics shipments
- studio projects
- support threads
- customer notifications

### What walks the data for backfill?

`scripts/search-backfill.mjs` ships walkers ONLY for:
- `hc_workflows`
- `hc_support_threads`
- `hc_notifications`

The comment at line 264 explicitly notes that division-owned walkers "live in their division-owned Supabase projects" and "ship[s] its own walker (next pass per V2-SEARCH-01 hand-off)" — that pass has not happened, so 12 of 15 collections have zero documents.

### Worker / cron loop

`apps/hub/app/api/cron/search-index-worker/route.ts`:

- Auth via `Authorization: Bearer ${CRON_SECRET}`.
- Calls `drainOutbox()` then `purge_completed_search_outbox` (7-day retention).
- Records duration; logs `search.outbox.drain.ok`.
- Backlog probe: `measureBacklog()` calls `supabase.from("search_index_outbox").select(... count exact head).eq("status", "pending").lt("created_at", sixtySecondsAgo)`.

**BUG (high):** The backlog probe queries columns that DO NOT EXIST:
- The schema has no `status` column (it has `completed_at` and `attempts`).
- The schema has no `created_at` column (it has `enqueued_at`).

Supabase returns an error; the worker logs `search.outbox.backlog.measure_failed` silently, and the `backlog_alert: true` path is therefore unreachable. Backlog SLO is invisible in production.

### `drainOutbox()` retry behaviour

- Pulls `attempts < 8` rows in `enqueued_at ASC` order.
- Bulk import per collection via NDJSON; on full success → `markCompleted`; on partial → `markAttempted` (requeue).
- On bulk throw: `markAttempted` for the whole batch with the error text.
- Deletes are individual; on throw, `markAttempted` for that single row.
- After 8 attempts, the row is left forever in `pending` state — there is no Dead Letter table and no observability event so the failure is invisible.

### Findings (outbox)

- **Coverage:** 12 of 15 collections never receive data. The search experience for marketplace / property / jobs / learn / care / logistics / studio is effectively catalog-only (in-memory `@henryco/intelligence` rows).
- **Backlog observability is broken** (column mismatch). Operators cannot see the SLO.
- No `henry.search.indexing.lag` event is emitted. **Gap per spec.**
- No `henry.search.indexing.failed` event is emitted with a failure class. **Gap per spec.**
- No `attempts >= MAX_ATTEMPTS` Dead Letter mechanism. Failed rows linger.
- No exponential backoff — every cron tick (60s) retries every failing row immediately.
- The bulk-success path uses the Typesense per-document `success: true` JSON tag, but the response also carries a `code` + `error` field per failing line which is dropped. We surface only counts to the worker.
- The cron lives on the HUB app. There's no second cron (e.g. on care or marketplace) to ensure draining survives an isolated outage of the hub deployment.

---

## 3. Routes

### `apps/hub/app/api/search/route.ts`

- Public GET; resolves user via the hub Supabase server client; admin Supabase used for role resolution.
- Calls `searchAcrossDivisions({ query, user_id, limit, cursor, divisions_filter }, { supabase: admin, context: "account"|"public", rateLimitIdentityKey })`.
- Rate-limit identity: user_id when signed in, otherwise `ip:X-Forwarded-For` hash.
- V3 PASS 21 H8 defensive wrap: any unexpected throw → empty 200 response.
- Cache headers: `private, max-age=0, must-revalidate`.

### `apps/account/app/api/search/route.ts`

- Identical contract; resolves user via the account Supabase server client.
- Note: no defensive try/catch around `searchAcrossDivisions` (the H8 wrap is hub-only). On unexpected throw, the route returns 500. **Gap.**

### `searchAcrossDivisions()` (query.ts)

1. Parse input via Zod (`searchInputSchema`).
2. Rate-limit check (`checkSearchRateLimit`).
3. Role resolution (`resolveUserRoles`) — five RLS-backed reads (`profiles`, four division memberships).
4. Pick permitted collections (`listPermittedCollections`).
5. Fan out Typesense `multi_search` over permitted collections in parallel with catalog scoring.
6. Combine, dedupe, rank, paginate.

### Findings (routes)

- **No 500 wrap on the account route** — symmetry gap with hub route. Fix in this pass.
- `query_by_weights` is not specified in the multi_search body — Typesense weighs `title`, `summary`, `tags`, `badge` equally. Title should weigh ~4x summary.
- `num_typos`, `prefix`, `prioritize_token_position`, `drop_tokens_threshold` and `min_len_1typo` / `min_len_2typo` are all absent — Typesense defaults are not tuned to short Nigerian English / Pidgin queries (e.g. `naija` shouldn't trigger typo correction; `lekki` for `lekki phase` should).
- `synonyms` query parameter (per-collection synonym set) is not referenced anywhere.
- The `primary_division` boost field is plumbed in `SearchInput` but no caller (hub or account route) passes it. The 0.2 boost in `ranking.ts:75–77` is dead code in production.
- Per-division result-set cap is not applied. A generic query can flood the result list with one division's results because per-collection slices are merged then dedup-ranked without diversity enforcement. **Gap per spec §3.5.**

---

## 4. Ranking

Source: `packages/search-core/src/ranking.ts` (174 lines).

### Current formula (`scoreIndexedHit`)

```
final_score = normalized_text_match (log10 of int64 / 12, clamped [0,1])
            + 0.5  if owner_user_id == user_id
            + 0.3  if active workflow tag OR (type=workflow AND owner=user)
            + 0.2  if primary_division == doc.division
            + recency_boost (0.1 max, linear decay over 30d)
            - 0.5  if archived/closed/deleted
            - 0.3  if unverified AND viewer not staff
            + 0.4 * doc.ranking_signals.workflow_urgency
            + 0.2 * doc.ranking_signals.promotion
```

### Catalog scoring (`scoreCatalog`)

Delegates to `@henryco/intelligence` `scoreSearchResult`, then compresses `[0..2000] → [0..1.5]` so catalog hits can compete with indexed hits.

### Final dedupe + sort

`dedupeAndRank` keys hits by `${url}::${authRequirement}`, keeps the highest-scoring, sorts by `score DESC, priority DESC`.

### Findings (ranking)

- Formula is solid but several boosts are inert today:
  - `primary_division` — no caller sets it.
  - `active_workflow_keys` — no caller passes a non-empty set.
  - `ranking_signals.promotion` — no DB column / no writer.
  - `ranking_signals.popularity` — no writer.
- Recency window is 30d. For workflows that's right; for marketplace products it's a very narrow window — a 31-day-old listing scores 0 on recency. Per-collection tuning would help.
- No diversity layer — see §3.
- `dedupeAndRank` key `${url}::${authRequirement}` collapses duplicates correctly but does NOT cap per-division contribution.
- `palette-ranker.ts` is a fully separate multi-signal ranker used by the palette (typeahead) layer — not by `searchAcrossDivisions`. It uses Sørensen–Dice trigram match for typo tolerance, recency / frequency / scope / suggestion boosts. Quality is high; tests pin behaviour.

---

## 5. Recents

Source today: per-device localStorage in `packages/search-ui/` (owner-reserved — read-only audit).

Confirmed via `grep` against `packages/search-ui/src/palette/` references: recents are stored in the browser. There is NO Supabase-backed table for cross-device recents.

### Findings

- Per-device only. A user with phone + laptop sees two disjoint recent lists.
- No retention policy enforced at the backend (depends on the browser).
- No way to compute "top recents across the team" or any analytic.
- **Gap per spec §4.1.** Resolution lives in session 2 (Phase 4) — author DB migration + RLS table, populate from existing palette via the search-ui shim already exposed.

---

## 6. Suggestions

Source: `packages/search-core/src/suggestions.ts` (`buildPaletteSuggestions`).

Signal mix today:
- **Lifecycle actionables** — first 6 from `customer_lifecycle_snapshots.snapshot.actionables`. Score: `200 + LIFECYCLE_PRIORITY_WEIGHT[priority] - index * 4`.
- **Unread notifications** — first 6 with `deep_link_url`. Score: `100 + recencyBoost (0..100) + LIFECYCLE_PRIORITY_WEIGHT[priority] - index * 2`.
- Dedup by href; sort by score DESC; cap at 8.

### Findings

- Suggestion algorithm is role/division-blind. Two users with identical actionables but in different divisions get identical suggestions.
- No "most-used commands" signal — `henry_events` clicks are never queried here.
- No "trending content for the user's role/division" — no last-7d aggregation.
- Spec §4.2 calls for: 5 recents + 5 most-used commands + 5 trending. None of these three streams is wired today.

---

## 7. Module jump (Cmd+1..9)

Source: `packages/search-ui/src/hooks/useModuleJumpKeys.ts` (owner-reserved — read-only audit).

Per the spec's existing pattern, module jump entries should be server-derived via `getOwnerRailEntries(viewer)`. The hook is in the owner-reserved package, so we audit only — no code changes in this pass.

### Finding

- Audit-only this pass. Phase 4 (session 2) verifies the registry source-of-truth and documents it in a follow-up doc.

---

## 8. Zero-result handling

Today: when `multi_search` returns zero hits and catalog scoring returns nothing, the response is `{ hits: [], total: 0, facets: {...} }`. No event is emitted. The catalogue expansion plan therefore has no driver — operators don't know which queries are landing empty.

### Findings

- No `henry.search.query.zero_results` event. **Gap per spec §5.1.**
- No owner-workspace "search-health" tile. **Gap per spec §5.2.** Optional; defer to session 2.

---

## Gap list (priority-ordered for sessions 1 + 2)

### P0 (session 1 — Phase 2 indexing reliability)

- **G1 — Fix backlog probe.** Worker queries non-existent columns (`status`, `created_at`). Replace with the actual schema (`completed_at IS NULL`, `enqueued_at`). Without this fix the backlog SLO is unobservable.
- **G2 — Add `henry.search.indexing.lag` event** to the worker so the SLO surfaces in `henry_events`. Payload: `{ backlog, threshold, oldest_pending_age_s, duration_ms, processed, failed }`.
- **G3 — Add `henry.search.indexing.failed` event** with a failure class (`network`, `schema_mismatch`, `rate_limit`, `bulk_partial`, `unknown_collection`, `payload_invalid`). Emitted per failed-batch from `drainOutbox`.
- **G4 — Backfill audit script.** `scripts/v3/search-backfill-audit.mjs` — for each collection compute `(supabase row count vs typesense document count)`; report the gap. Optional `--apply` with `OWNER_OK=true` re-enqueues missing rows via `enqueue_search_index_op`.
- **G5 — Defensive 500 wrap on account `/api/search` route.** Symmetry with hub route.

### P0 (session 1 — Phase 3 relevance/ranking)

- **G6 — Per-collection `query_by_weights`** — `title:4, summary:2, tags:1, badge:1` so title matches dominate. Wired into the multi_search body.
- **G7 — Per-collection typo tolerance** — set `num_typos: 1`, `min_len_1typo: 4`, `min_len_2typo: 7` for content-heavy collections; tighter for short-identifier collections.
- **G8 — Synonyms tables per division.** New `packages/search-core/src/synonyms.ts` with curated synonym groups (marketplace: tee↔t-shirt, naija↔nigerian; property: lekki↔lekki phase, bedroom↔bed; care: cleaning↔housekeeping; jobs: dev↔developer↔engineer; etc.). Surfaced as `multi_search.synonyms` (one-way per Typesense API) OR via per-collection synonym entities — chosen approach documented in the report.
- **G9 — Result diversity cap** — when `query.length === 0` OR no per-collection filter is supplied, cap each collection's contribution to N items (default 3) and overflow into a fallback tier. Implemented in `query.ts` after the merge step.
- **G10 — Wire `primary_division` and `active_workflow_keys`** plumbing from each route so the existing dead-code boosts come alive. Hub route: read viewer's `primary_division` from the role-resolved profile when available. Account route: same.

### P1 (session 2 — Phase 4 recents + suggestions)

- **G11 — `public.search_user_recents`** migration with RLS (user reads/writes own only). 30-day retention via cron.
- **G12 — Suggestions: most-used commands** — aggregate `henry_events` clicks where `event LIKE 'henry.%.opened'` over last 30d per user.
- **G13 — Suggestions: trending content** — aggregate `henry_events` clicks per `role + division` over last 7d.

### P1 (session 2 — Phase 5 zero-result observability)

- **G14 — `henry.search.query.zero_results` event** with `{ query, surface, role, division, hint_count }`.
- **G15 — Owner-workspace "search-health" tile** (optional) — extend V3-10 observability or add new tile reading `henry_events`.

### P1 (session 2 — Phase 6 tests)

- **G16 — Synonym + weight snapshot tests** for `query.ts` (assert the multi_search body shape).
- **G17 — Outbox lag integration smoke** — enqueue → drain → assert document in Typesense within N seconds (gated on `TYPESENSE_TEST_HOST`).
- **G18 — Federated `/api/search` E2E smoke** — assertion-driven, not visual.

---

## Recommended session-1 implementation order

1. G1 (backlog probe column fix) — blocks G2/G3 observability.
2. G2 + G3 (indexing events) — wires the observability spine.
3. G4 (backfill audit script) — answers "what's missing".
4. G5 (account 500 wrap) — symmetry.
5. G6 + G7 + G8 + G9 (relevance) — the productivity uplift the owner asked for.
6. G10 (wire dead-code boosts) — small, high-impact, completes the existing formula.

Phases 4–6 (G11–G18) carry to session 2 with this doc as the pickup brief.

---

## Owner gates

- **No migrations applied to production without explicit owner approval.** Any DDL authored in this pass (G4 audit script, G11 recents table next session) is captured as SQL in `apps/hub/supabase/migrations/` but NOT applied — owner reviews + applies.
- **No PR auto-merge.** Owner reviews search relevance visually before merge.
- **DRAFT PR only.** Owner promotes to ready.

---

End of audit.
