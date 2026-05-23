# SEARCH-01 — Dashboard Search Productivity Uplift (backend only)

**Pass ID:** SEARCH-01
**Phase:** Polish / capability
**Pillar:** P3 (Personalization), P12 (Global UX)
**Dependencies:** Wave B.1 + close-out PRs all on main
**Effort:** L (2–4 sessions; this session targets Phases 1–3)
**Parallel-safe:** YES
**Owner gate:** Visual sign-off on the upgraded relevance + recents UX
**Risk class:** None

---

## Role

You are the V3 Search engineer. Owner directive, verbatim:

> "Maximize, standardize and upgrade the dashboard search engine to be more accurate and helpful, also so that it will be more productive. … production ready, no shallow or fake data or fake work … should complete the whole wonderful work the theme has done so that it will be well polished, smooth, and satisfying in maximum."

**The bar:** every query returns relevant, freshly-indexed results; recents persist sensibly per user; suggestions surface the right next thing for the user's role; module-jump shortcuts are reliable; zero-result queries become observable so the catalogue can be expanded. Production-ready — no fake-data fixtures, no stubbed endpoints.

**HARD CONSTRAINT (owner-reserved):** `packages/search-ui/` is **OFF-LIMITS** per memory `feedback_dashboard_search_engine_no_touch.md`. It is the quality reference renderer — do NOT modify any file under `packages/search-ui/`. This pass works on the BACKEND that feeds the renderer: `packages/search-core/`, per-app `/api/search/*` routes, the outbox pipeline, Typesense collection config, and ranking helpers.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `feat/search-productivity-uplift` |
| Worktree | `C:/Users/HP VICTUS/HenryCo/.worktree/search-productivity` |
| Branch base | `main @ 1768a99d` (Wave B.1 + close-out merged) |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |

Use ABSOLUTE PATHS. For Bash, first call `cd "C:/Users/HP VICTUS/HenryCo/.worktree/search-productivity"`. For git, prefer `git -C "<path>" <cmd>`. DO NOT touch the parent repo or sibling worktrees (REALTIME-01 + MODULES-01 + FIX-MOBILE-CLICKS agents run in parallel).

---

## Reference architecture (conductor-verified)

### Backend touch-points (in scope)

`packages/search-core/src/`:
- `client.ts` — Typesense client wrapper
- `collections.ts` — schema definitions for searchable types (per-division)
- `outbox.ts` — outbox pipeline that syncs DB → Typesense
- `palette-ranker.ts` — ranking for command palette results
- `query.ts` — query construction (filters, facets, sort)
- `ranking.ts` — relevance scoring
- `rate-limit.ts` — search rate-limit policy
- `role.ts` — role-aware collection access
- `schema.ts` — shared schema types

Per-app search routes (in scope):
- `apps/account/app/api/search/route.ts` (or similar — verify)
- `apps/hub/app/api/search/route.ts` (or similar — verify)
- per-division federated routes

Consumer that must stay stable:
- `packages/search-ui/src/palette/DashboardCommandPalette.tsx` — **OWNER-RESERVED, do NOT modify**
- `packages/search-ui/src/palette/KeyboardCheatSheet.tsx` — **OWNER-RESERVED**

If the palette's interface needs widening to consume new ranking signals, work via the props/types that search-ui already exposes — don't change the renderer.

### Out of scope (HARD)

- `packages/search-ui/` — owner-reserved, full reservation
- `apps/account/**` — customer dashboard per existing memory (search RESULTS for customers are NOT out of scope, but the customer UI shell stays untouched)
- Mobile apps (`apps/super-app`, `apps/company-hub`) — Expo, separate stack
- New search providers (Algolia, Elasticsearch) — stay on Typesense
- New search SURFACES (don't add new search pages; improve the existing palette + per-app search routes)

---

## Mandatory scope

### Phase 1 — Audit (this is the foundation)

Walk the existing search backend and document:

1. **Collections** — every Typesense collection: schema, indexed fields, weights, facets, sort signals. Which divisions have collections? Which content types feed each?
2. **Outbox** — what writes to the outbox? Which DB triggers fire? What's the latency from DB write → Typesense index?
3. **Routes** — every `/api/search` endpoint: request shape, role check, query construction, response shape, rate-limit policy.
4. **Ranking** — current relevance scoring: weights, typo tolerance, synonym tables, boost rules.
5. **Recents** — where are user recents stored? Is the storage cross-device or per-device? Is there a retention policy?
6. **Suggestions** — how are "top picks" / "suggestions" computed? Are they static, role-aware, or learned from usage?
7. **Module jump** — how do Cmd+1..9 entries resolve? Where's the registry?
8. **Zero-result handling** — what happens when a query returns no results? Is it logged?

Output: `docs/v3/search-audit-2026-05-23.md` — per-area findings + gap list + recommended uplift.

### Phase 2 — Indexing reliability

The outbox pipeline must guarantee every searchable write reaches Typesense within an SLO:

1. Audit each DB trigger that writes to the outbox. Is the trigger fired for the right events (INSERT, UPDATE, DELETE)? Does it handle bulk operations correctly?
2. Verify the outbox consumer (worker / cron / edge function) processes items reliably with retries on transient Typesense failures.
3. Add `henry.search.indexing.lag` event emitting from the outbox worker so the SLO is observable (V3-10 owner observability tile already reads `henry_events`).
4. Add a `henry.search.indexing.failed` event with the failure class (network / schema mismatch / rate limit) so the failure pattern is debuggable.
5. Backfill missing-index audit script: `scripts/v3/search-backfill-audit.mjs` that compares each DB table's row count against the corresponding Typesense collection's document count. Report the gap. Owner-gated apply mode (`OWNER_OK=true --apply`) re-indexes missing rows.

### Phase 3 — Relevance + ranking

1. **Typo tolerance** — confirm Typesense's `num_typos: 1` (or 2 for longer queries) is set on the right fields. Tune per collection.
2. **Synonyms** — author a synonyms table per division (e.g., for marketplace: `tee → t-shirt`, `nigerian → naija`; for care: `cleaning → housekeeping`). Wire via Typesense's `synonyms` API.
3. **Field weights** — boost name/title fields over body fields. Boost recent + active items.
4. **Personalization signals** — pass the user's role + division + recent activity to the search query so results are scored against context. Document the signals + how they influence ranking.
5. **Result diversity** — when a query is generic, the result set should span divisions, not flood with one type. Implement a per-division cap with overflow fallback.

### Phase 4 — Recents + suggestions

1. **Recents persistence** — move from localStorage-only (per-device) to Supabase-backed (cross-device per user). Table: `search_user_recents (user_id, surface, query, result_clicked_id, created_at)`. RLS: user reads/writes their own only. Retention: 30 days rolling.
2. **Suggestions surface** — when the palette opens with no query, show: most-recent (5 items), most-used commands (5 items), trending content for the user's role/division (5 items). Compute "trending" from `henry_events` clicks over the last 7d filtered by role.
3. **Module jump entries** — verify the Cmd+1..9 registry is server-derived (not client-hardcoded) per the existing `getOwnerRailEntries(viewer)` pattern. Document the registry source-of-truth.

### Phase 5 — Zero-result observability

1. Emit `henry.search.query.zero_results` event with `{ query, surface, role, division, hint_count }` when a query returns nothing useful (less than N relevant hits).
2. Owner-workspace tile (extend V3-10's observability tile or add a new "search-health" tile) shows the top-N zero-result queries from the last 7d. This drives the catalogue expansion plan.

### Phase 6 — Tests + verification

- Unit tests for ranking helpers (snapshot of the score function on canonical inputs)
- Integration smoke for the outbox pipeline (write to DB → assert document in Typesense within N seconds)
- E2E smoke for the federated `/api/search` route (assertion-driven, not visual)

---

## Anti-patterns (HARD stops)

- **NO touching `packages/search-ui/`.** Owner-reserved.
- **NO new search providers** (no Algolia, no Elasticsearch).
- **NO fake data / stubbed results.** Every search response must be backed by Typesense or by a documented degraded fallback (V3-10 pattern).
- **NO removing existing typed events** in `packages/observability/src/events.ts` — only add.
- **NO breaking V3-07 strict `pnpm i18n:check:strict` gate.**
- **NO migrations applied to production without owner explicit approval** — author the SQL, document it, propose dry-run.
- **NO `git push --force`** (use `--force-with-lease` if needed).
- **NO PR auto-merge** — owner reviews search relevance visually before merge.

---

## Self-verification checklist

- [ ] `docs/v3/search-audit-2026-05-23.md` written, per-area findings + gaps
- [ ] Outbox indexing reliability hardened (retries, backoff, observability)
- [ ] `henry.search.indexing.lag/failed` events registered + emitting
- [ ] Synonyms + typo tolerance + field weights tuned per collection
- [ ] Recents migrated to Supabase-backed with RLS
- [ ] Suggestions algorithm wired (recents + most-used + trending)
- [ ] Zero-result observability event firing
- [ ] Optional: search-health owner tile rendering
- [ ] `pnpm -F search-core typecheck` + lint PASS
- [ ] V3-07 strict gate PASS
- [ ] DRAFT PR opened with audit doc + per-area improvement summary

Session 1 target: Phases 1–3. Phases 4–6 can spill to session 2 with crisp pickup notes.

You're Opus 4.7. The owner asked for "remarkably and magnificently done". Search productivity isn't visual sparkle — it's the moment when a query lands the user on the exact next step they wanted. Every weight, every synonym, every recent — they all compound.
