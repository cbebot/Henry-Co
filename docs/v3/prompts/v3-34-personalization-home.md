# V3-34 — Personalization & Predictive: Per-User Home

**Pass ID:** V3-34  ·  **Phase:** E (Personalization & Predictive)  ·  **Pillar:** P3 (Personalization Engine)
**Dependencies:** V3-12 (Foundation Lock), V3-26 (AI provider router)  ·  **Effort:** L  ·  **Parallel-safe:** N (foundation for Phase E)
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 personalization engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass adds a **per-user persistent home layout** — pin, hide, reorder — *on top of* the already-shipped DASH Smart Home signal feed, so the account home opens to the exact modules each user cares about and remembers that choice across devices. You are the foundation every other Phase E pass (V3-35..V3-39) hangs its surfaces on. The line you must not cross: the **relevance score stays server-computed and opaque** (ANTI-CLONE Principle 1). The user may override ordering (pin/hide); the user may never read or manipulate the score itself, and you never replace the existing `get_signal_feed` ranking — you layer a user-preference projection over it.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/34-personalization-home` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The account home is **already a ranked, real-data Smart Home** (DASH-4), not a static dashboard. The truth on `main`:

- `apps/account/app/(account)/page.tsx` is a thin RSC entry that resolves the `UnifiedViewer` (`buildUnifiedViewer` from `@henryco/auth/server`), parses a `SignalFeedCursor`, and hands off to `apps/account/components/smart-home/SmartHome.tsx`.
- Ranking lives in SQL: `public.get_signal_feed(viewer_id, limit_count, after_score, after_created_at)` (DASH-1 migration G6), `SECURITY DEFINER` + RLS-aware, joining `customer_notifications` + `customer_activity`, scored by `priority weight × recency weight`, cursor-paginated. The typed wrapper is `getSignalFeed(viewer, opts)` in `packages/data/src/signal-feed.ts`, with `signalFeedTag(viewerId)` / `SMART_HOME_TAG` cache tags and a 30s TTL wrapper at `apps/account/lib/smart-home/signal-feed-cache.ts`.
- Modules contribute home widgets via the `getHomeWidgets` contract in `packages/dashboard-shell/src/home-widget.ts` (each `HomeWidget` has `id`, `source: ModuleSlug`, `size: ModuleSize`, `weight 0..100`, server-side `render()`). Registration happens through the side-effect import `apps/account/app/(account)/_modules`. The shell registry, role gates, and command palette are `@henryco/dashboard-shell` (`register.ts`, `role-gate.ts`, `owner-register.ts`, `staff-register.ts`).
- Telemetry is `@henryco/intelligence`: every event is validated against `henryEventNameSchema` (`henry.<domain>.<noun>.<verb>`) and emitted through the analytics envelope.

**The gap this pass closes:** the Smart Home ranks signals globally but has **no per-user persistence of intent** — a user cannot pin a module to the top, hide one they never use, or reorder, and nothing survives a refresh or follows them to mobile. V3-34 introduces `user_home_layouts` plus a deterministic, explainable layout projection that re-orders the *registered modules/widgets* by user preference first, then by the existing signal score, with a clean fallback to the default DASH ordering for new users.

## Mandatory scope

### S1 — `user_home_layouts` schema + RLS

New migration `supabase/migrations/<ts>_v3_34_user_home_layouts.sql`:

```sql
CREATE TABLE public.user_home_layouts (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  surface TEXT NOT NULL DEFAULT 'account'
    CHECK (surface IN ('account','owner','staff')),
  desktop_module_order TEXT[] NOT NULL DEFAULT '{}',
  mobile_module_order  TEXT[] NOT NULL DEFAULT '{}',
  hidden_modules       TEXT[] NOT NULL DEFAULT '{}',
  pinned_modules       TEXT[] NOT NULL DEFAULT '{}',
  last_personalized_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  personalization_signal_version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_home_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_home_layouts_select_own ON public.user_home_layouts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY user_home_layouts_insert_own ON public.user_home_layouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_home_layouts_update_own ON public.user_home_layouts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_user_home_layouts_updated_at
  BEFORE UPDATE ON public.user_home_layouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

`(user_id, surface)` is the natural key — a single user has one layout per surface (account/owner/staff). Module IDs stored are `ModuleSlug` values from `@henryco/dashboard-shell` register; never store widget render output. Regenerate types with `pnpm supabase:types` so `Database["public"]["Tables"]["user_home_layouts"]` is available to `@henryco/data`.

### S2 — Deterministic layout projection

New `packages/dashboard-shell/src/personalization/compute-layout.ts` exporting `computeHomeLayout(input): HomeLayoutResult`:

```ts
export type HomeLayoutInput = {
  registeredModules: ReadonlyArray<{ slug: ModuleSlug; defaultWeight: number }>;
  signalScores: ReadonlyMap<ModuleSlug, number>; // derived from get_signal_feed items grouped by source
  preference: {
    desktopOrder: ModuleSlug[];
    mobileOrder: ModuleSlug[];
    hidden: ModuleSlug[];
    pinned: ModuleSlug[];
  } | null; // null = new user, no row yet
  device: "mobile" | "desktop";
};

export type LayoutReasonCode =
  | "user_pinned"
  | "user_hidden"
  | "user_ordered"
  | "high_signal_score"
  | "recent_division_use"
  | "open_blocker"          // unfinished KYC, payment failure, expiring session
  | "default_order";

export type HomeLayoutResult = {
  ordered: ReadonlyArray<{ slug: ModuleSlug; reason: LayoutReasonCode }>;
  hidden: ReadonlyArray<ModuleSlug>;
  computedAt: string;
};
```

Rules, in strict precedence: (1) `pinned` modules first, in user order; (2) `open_blocker` modules next (a module exposes `hasOpenBlocker` via its register entry — unfinished KYC, failed payment, expiring session) — these can never be hidden; (3) remaining modules by the user's explicit `desktopOrder`/`mobileOrder`; (4) anything not in the user order falls back to descending `signalScore`, then `defaultWeight` as tiebreaker; (5) `hidden` modules excluded from `ordered` and returned in `hidden`. Pure function, zero IO, fully unit-tested in `packages/dashboard-shell/src/personalization/__tests__/compute-layout.test.ts` (≥ 20 cases: empty preference fallback, pin-overrides-signal, blocker-cannot-be-hidden, device divergence, unknown-module pruning).

### S3 — Persistence helper in `@henryco/data`

New `packages/data/src/home-layout.ts`: `getUserHomeLayout(viewer, surface)` and `upsertUserHomeLayout(viewer, surface, patch)`. RLS-scoped via the viewer's authenticated client (NOT the admin client — this is user-owned data). `upsert` validates every slug against the live register, drops unknown slugs, bumps `last_personalized_at`, and emits the telemetry in S6. Export both from `packages/data/src/index.ts`.

### S4 — Customize UI

New route `apps/account/app/(account)/customize/page.tsx` + client `apps/account/components/customize/CustomizeHomeClient.tsx`:

- Lists every module the user is entitled to (filtered through `@henryco/dashboard-shell` `role-gate`).
- Drag-to-reorder (keyboard-accessible: arrow-key reorder + visible focus ring — not pointer-only).
- Per-module **Hide** toggle (blocker modules render the toggle disabled with a translated reason).
- Per-module **Pin to top** toggle.
- Separate desktop vs mobile order tabs (each writes its own `*_module_order`).
- **Reset to default** clears the row's overrides (sets arrays to `{}`).
- Saves via a server action calling `upsertUserHomeLayout`. Optimistic UI; reconciles on server response.

### S5 — Smart Home consumes the projection

Wire `apps/account/components/smart-home/SmartHome.tsx` to call `getUserHomeLayout` for the viewer, derive `signalScores` from the existing `getSignalFeed` result (group items by `source` → max score), call `computeHomeLayout`, and render registered widgets in the projected order. If `last_personalized_at` is older than 24h, recompute the signal-derived ordering server-side and persist the refreshed projection. Apply the **same projection** to the Hub owner workspace home (`apps/hub` owner shell, surface `owner`) and the staff dashboard home (surface `staff`) using `@henryco/dashboard-shell` `owner-register`/`staff-register` module sets and the same Customize UI gated by role. Never break the cursor pagination contract or the `signalFeedTag`/`SMART_HOME_TAG` cache invalidation.

### S6 — Telemetry + owner observability

Emit via `@henryco/intelligence` (validated names):

- `henry.personalization.layout.computed`
- `henry.personalization.module.hidden`
- `henry.personalization.module.pinned`
- `henry.personalization.layout.reset`

Add an owner tile "Personalization signals" to the Hub owner workspace: daily layouts computed, top-pinned modules, top-hidden modules (aggregate, no per-user PII beyond counts).

## Out of scope

- Personalized **deals** surfacing on the home — V3-35.
- Cross-division **recommendations** modules — V3-36.
- **Abandoned-task** recovery surface — V3-37.
- Geo / "available in your area" badges — V3-38.
- AI-learned re-ranking of the signal score itself — deferred to a Phase E predictive pass; V3-34 stays deterministic.

## Dependencies

Depends on V3-12 (Foundation Lock closed) and V3-26 (AI provider router — available for later signal enrichment, not required for the deterministic projection). **Blocks all of Phase E**: V3-35, V3-36, V3-37, V3-38, V3-39 each render their module/surface inside the per-user home this pass establishes.

## Inheritance

- `@henryco/dashboard-shell` — `register`, `role-gate`, `home-widget` (`getHomeWidgets`/`HomeWidget`), `owner-register`, `staff-register`, `command-palette`.
- `@henryco/data` — `getSignalFeed`, `SignalFeedCursor`, `signalFeedTag`, `SMART_HOME_TAG`, `createDataAdminClient`.
- `@henryco/auth` — `UnifiedViewer`, `buildUnifiedViewer`.
- `@henryco/intelligence` — analytics envelope + `henryEventNameSchema`.
- `@henryco/i18n`, `@henryco/config`, `@henryco/ui` (chrome + `RouteLiveRefresh`).

## Implementation requirements

### Files
- `supabase/migrations/<ts>_v3_34_user_home_layouts.sql` (new)
- `packages/dashboard-shell/src/personalization/compute-layout.ts` (new) + `__tests__/compute-layout.test.ts`
- `packages/dashboard-shell/src/index.ts` (export the personalization surface)
- `packages/data/src/home-layout.ts` (new) + export from `packages/data/src/index.ts`
- `apps/account/app/(account)/customize/page.tsx` (new)
- `apps/account/components/customize/CustomizeHomeClient.tsx` (new) + server action
- `apps/account/components/smart-home/SmartHome.tsx` (changed — consume projection)
- Hub owner + staff home composition (changed to consume projection) + owner "Personalization signals" tile

### Trust / safety / compliance
RLS owner-only on `user_home_layouts` (no admin-client reads for layout). The relevance **score is never serialized to the client** — only the projected order + reason codes. `upsertUserHomeLayout` is a mutating route: wrap with `requireSensitiveAction` is NOT required (non-destructive preference write), but it MUST validate every slug against the live register, reject unknown slugs, and write the audit log via `@henryco/observability/audit-log` (`personalization.layout.updated`). Blocker modules cannot be hidden — enforce server-side, not just in the UI.

### Mobile + desktop parity
Distinct `mobile_module_order` vs `desktop_module_order`; the projection takes `device`. Web mobile: drag-reorder must work with touch + keyboard. Expo super-app: the home reads the same `user_home_layouts` row via the shared `@henryco/data` helper — note this as the contract the V3-87 mobile parity wave consumes; no native UI in this pass.

### i18n
All Customize UI copy through `@henryco/i18n`. Add typed copy module `packages/i18n/src/personalization-copy.ts` (namespace `surface:personalization`): module labels, "Pin to top", "Hide", "Reset to default", blocker-disabled reasons, save/success/error states. Reason codes render to localized strings via the typed copy; never hardcode. Runtime-dynamic module titles fall back through `translateSurfaceLabel`.

### Brand & design system
Customize UI uses `@henryco/dashboard-shell` tokens + `@henryco/ui` chrome only — no ad-hoc hex. Any brand string (division module labels) reads from `@henryco/config` `company.ts` (`Henry Onyx <Division>`), never hardcoded. Zero hardcoded domains — deep links via `getAccountUrl()` / `henryWebRoot()`. Light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed.

## Validation gates
1. `pnpm typecheck && pnpm lint && pnpm test && pnpm build` green.
2. `compute-layout.test.ts` ≥ 20 cases green (fallback, pin-over-signal, blocker-cannot-hide, device divergence, unknown-slug pruning).
3. RLS verification: a live probe confirms user A cannot SELECT/UPDATE user B's `user_home_layouts` row.
4. e2e (`apps/account`): pin a module → refresh → it stays top; hide a module → it disappears and survives reload; reset → default DASH order returns; mobile order differs from desktop.
5. Real-browser check on `/customize` and `/` (account, owner, staff): light + dark, mobile + desktop, CLS ≈ 0, contrast pass, keyboard-only reorder works.
6. Telemetry: all 4 events validate against `henryEventNameSchema` and appear in the analytics sink.

## Deployment gate
All gates green; owner reviews the Customize UX and the owner "Personalization signals" tile. Ship behind a per-surface kill switch (env flag) so the home can fall back to pure DASH ordering instantly. 14-day soak with the kill switch monitored before declaring Phase E foundation stable.

## Final report contract
`.codex-temp/v3-34-personalization-home/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion.

## Self-verification
- [ ] `user_home_layouts` migration applied; RLS owner-only proven by live cross-user probe.
- [ ] `computeHomeLayout` is a pure, deterministic, explainable function with ≥ 20 passing unit tests; score never leaves the server.
- [ ] `getUserHomeLayout` / `upsertUserHomeLayout` shipped in `@henryco/data`, RLS-scoped, slug-validated, audit-logged.
- [ ] `/customize` ships: drag-reorder (keyboard + touch), hide, pin, separate mobile/desktop tabs, reset; blocker modules cannot be hidden.
- [ ] Account, owner, and staff homes consume the projection without breaking cursor pagination or cache invalidation.
- [ ] 4 telemetry events + owner "Personalization signals" tile live.
- [ ] All copy via `surface:personalization`; brand via `@henryco/config`; zero hardcoded domains/strings; light+dark, mobile+desktop, CLS ≈ 0.
- [ ] Kill switch wired; report written.
