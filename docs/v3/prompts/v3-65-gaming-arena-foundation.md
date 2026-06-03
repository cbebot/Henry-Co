# V3-65 — Product Expansion: Gaming Arena Foundation

**Pass ID:** V3-65  ·  **Phase:** G (Product Expansion)  ·  **Pillar:** P10 (Gaming Arena)
**Dependencies:** V3-13, V3-17, V3-24  ·  **Effort:** XL  ·  **Parallel-safe:** N
**Owner gate:** D2  ·  **Risk class:** Money / Identity / Compliance

---

> **OWNER-GATED — DO NOT START until you have read the current answer to D2 in `docs/v3/DECISIONS-REQUIRED.md`.** D2 ("Gaming-arena legal posture per market") governs whether this pass runs at all, and in which shape (Option A = per-market legal opinion before launch; Option B = defer entirely to V4; Option C = skill-only no-cash variant first, stakes deferred to V3-66). The decision is the owner's; confirm it, do not re-litigate it. If D2 resolves to Option B, this pass does not execute — stop and report. If D2 resolves to Option C, the catalog/PvP/profile/lobby scope below ships **without any money mechanics** and V3-66 (stakes) stays parked until per-market legal sign-off lands. If D2 resolves to Option A, the scope below ships only in markets where an `L7` legal opinion letter has been countersigned. **No code in this pass may enable cash stakes** — stakes are V3-66 and depend on a stakes-specific legal opinion.

## Role
You are the V3 Gaming Arena foundation engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass stands up the **structural and identity foundation** of Henry Onyx's gaming surface — an original game catalog (zero copyrighted IP), the PvP match state machine, matchmaking, per-user gaming profiles, and the lobby/invitation layer — built on top of `@henryco/rooms` for real-time transport and gated behind KYC + age + geofence checks. The line you must not cross: **no money, no stakes, no payouts move in this pass.** Wallet integration, escrow, company margin, spectator, and replay are V3-66. You build the board; V3-66 puts money on it.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/65-gaming-arena-foundation` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The real-time substrate already exists. **`@henryco/rooms`** (`packages/rooms/`) is a shipped, provider-abstracted real-time engine: Daily.co primary + Jitsi fallback resolved in `src/provider-selector.ts`, typed server actions in `src/server/actions.ts` (every action gated on `requireUnifiedViewer()` from `@henryco/auth/server`, wrapped in typed `RoomError`, logged via `@henryco/observability`), realtime presence context in `src/realtime/rooms-realtime.tsx`, and a `rooms_sessions` / `rooms_participants` schema mirrored in `apps/hub/supabase/migrations/`. Its `RoomKind` union (`care_consult`, `marketplace_dispute`, `studio_review`, `academy_class`, `logistics_call`, `property_tour`, `jobs_interview`) is the extension point — gaming adds a new kind, it does not fork the engine.

The identity spine is in place. **V3-24** (KYC vendor integration) layers document-based identity verification on top of `customer_profiles.verification_status` and `customer_verification_submissions` (`apps/hub/supabase/migrations/20260410130000_kyc_verification_infra.sql`); gaming requires the highest verification level (`L4` in V3-24's level model — full identity + age proof) before a user may enter a match.

The money spine this pass **depends on but does not yet touch**: **V3-13** shipped `@henryco/payment-router` (the vendor-agnostic provider router, mock-only/test-gated). **V3-17** is the double-entry ledger; the wallet today is `customer_wallets.balance_kobo` (BIGINT minor units / kobo) + `customer_wallet_transactions` (`amount_kobo`, `type`, `status`, `reference_type`, `division`), read through `@henryco/dashboard-modules-wallet`. V3-65 reads none of these — it only asserts they exist so V3-66 can wire escrow.

**The gap this pass closes:** Henry Onyx has no gaming surface at all. There is no game catalog, no match state machine, no gaming profile, no lobby. P10 of the 12-pillar vision specifies an original PvP arena. This pass builds the legally-clean, money-free foundation so that — **and only if D2 authorizes it** — V3-66 can add wallet-funded stakes on a structurally complete, KYC-gated, geofenced base.

## Mandatory scope

### S1 — Original game catalog (zero copyrighted IP)

Three launch games, each designed from scratch with **original mechanics, original naming, original board/card art** — no clone of Whot, Ludo, or any branded trivia format. Each game ships with a rules document that **must be reviewed and countersigned by legal counsel** (the `L7` artifact) before that game is enabled in any market.

- New package **`@henryco/gaming-arena`** (`packages/gaming-arena/`), `private`, `version 0.1.0`, ESM, following the `@henryco/rooms` package shape (typed `index.ts`, `types.ts`, `errors.ts`, `server/`, `components/`, `__tests__/`).
- Game registry in `packages/gaming-arena/src/catalog/index.ts` exporting a typed `GameDefinition[]`:

```ts
export type GameId = "onyx-cards" | "onyx-quiz" | "onyx-track";

export type GameDefinition = {
  id: GameId;
  /** i18n key into surface:gaming — NEVER a hardcoded display string. */
  nameKey: string;
  descriptionKey: string;
  minPlayers: 2;
  maxPlayers: number;
  /** Skill-vs-chance ratio, used by the legal opinion + responsible-play model. */
  skillWeight: number;
  /** Path to the counsel-reviewed rules doc (the L7 artifact). */
  rulesDocPath: string;
  /** Server-authoritative move validator (S2). */
  validateMove: GameMoveValidator;
  /** Deterministic initial state from a seed (S2). */
  initialState: (seed: string, players: PlayerSeat[]) => GameState;
  /** Terminal-state + winner resolver. */
  resolveOutcome: (state: GameState) => GameOutcome;
};
```

- The three definitions:
  - **`onyx-cards`** — original shedding/matching card game, original suit system, original special-card effects. Rules doc `docs/gaming/onyx-cards-rules.md`.
  - **`onyx-quiz`** — original head-to-head trivia format, original question taxonomy, questions sourced from a Henry-Onyx-owned `gaming_quiz_questions` table (no third-party question banks). Rules doc `docs/gaming/onyx-quiz-rules.md`.
  - **`onyx-track`** — original board race game, original board topology + original token rules. Rules doc `docs/gaming/onyx-track-rules.md`.
- Each rules doc carries a `## Legal review` block with a counsel-signoff checkbox; **a game with an unsigned rules doc must not appear in the enabled catalog** — enforce with `isGameEnabled(gameId, market)` that checks both a counsel-signoff flag and a per-market enablement row (S5).

### S2 — Server-authoritative PvP match state machine

The board lives on the server; the client renders and proposes moves but never owns truth (anti-cheat foundation, completed in V3-66).

- New migration `apps/hub/supabase/migrations/<TS>_gaming_arena_foundation.sql`:

```sql
create table if not exists public.gaming_matches (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,                 -- GameId; CHECK against catalog
  status text not null default 'lobby'   -- lobby | matchmaking | in_progress | completed | abandoned
    check (status in ('lobby','matchmaking','in_progress','completed','abandoned')),
  room_session_id uuid references public.rooms_sessions(id) on delete set null,
  seed text not null,                    -- deterministic state seed (server-generated)
  market text not null,                  -- ISO market code; geofence + legal gate
  created_by uuid not null references auth.users(id) on delete cascade,
  winner_user_id uuid references auth.users(id) on delete set null,
  outcome text,                          -- win | tie | abandoned
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.gaming_match_players (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.gaming_matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  seat int not null,                     -- 0-based seat index
  joined_at timestamptz not null default timezone('utc', now()),
  left_at timestamptz,
  unique (match_id, user_id),
  unique (match_id, seat)
);

-- Append-only authoritative move log (the replay substrate V3-66 reads).
create table if not exists public.gaming_match_moves (
  id bigint generated always as identity primary key,
  match_id uuid not null references public.gaming_matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  seq int not null,                      -- monotonic per match
  move jsonb not null,                   -- validated move payload
  state_hash text not null,              -- hash of resulting server state
  created_at timestamptz not null default timezone('utc', now()),
  unique (match_id, seq)
);
```

- **RLS on all three tables:** a player may `select` only matches they participate in (`exists (select 1 from gaming_match_players p where p.match_id = gaming_matches.id and p.user_id = auth.uid())`); `gaming_match_moves` is `select`-only to participants and `insert`-only via the server action (no direct client insert — service-role path through the server action). Trust staff get read access via the existing staff-role predicate used by `@henryco/trust` queues. No client may `update`/`delete` any row.
- State machine transitions (one-directional, server-enforced in `packages/gaming-arena/src/server/match-actions.ts`):
  `lobby → matchmaking → in_progress → completed` and `* → abandoned`. Every transition emits telemetry (S6) and writes an audit row on `in_progress`/`completed`/`abandoned` via `writeAuditLog()` from `@henryco/observability/audit-log`.
- Server actions, each gated on `requireUnifiedViewer()` + the entry-gate stack from S5, returning typed `GamingError` (model the `RoomError` pattern from `@henryco/rooms`): `createMatch`, `joinMatch`, `submitMove` (validates via `GameDefinition.validateMove`, appends to `gaming_match_moves`, recomputes server state), `leaveMatch`, `completeMatch`. **`submitMove` is the single anti-cheat chokepoint** — an invalid move returns `move_rejected` and never advances state.
- The match transport binds to `@henryco/rooms`: `createMatch` calls `createRoom({ kind: "gaming_match", ... })`. Add `"gaming_match"` to the `RoomKind` union **and** the `rooms_sessions.kind` CHECK constraint (both must agree, per the `@henryco/rooms` types contract). This is the only edit to `@henryco/rooms` in this pass.

### S3 — Matchmaking

- `packages/gaming-arena/src/server/matchmaking.ts`: deterministic queue keyed by `(game_id, market, skill_bucket)`. Skill bucket derives from the player's rating (S4). No buy-in tiers in this pass (buy-in is V3-66) — matchmaking pairs purely on skill + market.
- **Anti-collusion seed:** record head-to-head pairings in a `gaming_head_to_head` table (`user_a`, `user_b`, `match_count`, `last_matched_at`, ordered pair); matchmaking down-ranks pairing two users who have faced each other above a threshold within a rolling window. This is the structural hook V3-66's fair-play audit reads — implement the tracking + the down-rank weight now; the audit queue is V3-66.
- A matchmaking smoke harness in `__tests__/matchmaking.test.ts` proving: two queued same-skill same-market players pair; cross-market players never pair (geofence); a collusion-flagged pair is de-prioritized.

### S4 — Per-user gaming profile

- `apps/hub/supabase/migrations/<TS>_gaming_arena_foundation.sql` (same migration) adds:

```sql
create table if not exists public.gaming_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null,           -- public lobby handle (NOT email/name)
  rating int not null default 1000,      -- Elo-style; updated by resolveOutcome
  wins int not null default 0,
  losses int not null default 0,
  ties int not null default 0,
  abandoned int not null default 0,
  achievements jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
```

- **RLS:** a user may `select`/`update` only their own profile (`user_id = auth.uid()`); other users' profiles are visible **only** through a `select`-safe public view `gaming_profiles_public` exposing `handle`, `rating`, `wins`, `losses`, `ties` — never internal identity. The lobby (S5) reads the public view.
- Rating update is server-side only, applied in `completeMatch` via `GameDefinition.resolveOutcome` → Elo delta. Profile creation is lazy on first lobby entry.
- Emit `henry.gaming.profile.updated` on every rating/record change.

### S5 — Lobby, invitations, and the entry-gate stack

- `packages/gaming-arena/src/components/`: `<GamingLobby>`, `<MatchInviteCard>`, `<GamingProfileCard>` — all consuming `@henryco/ui` tokens + `@henryco/i18n` labels, no ad-hoc strings, light + dark, mobile-first.
- Lobby shows online players (presence via `@henryco/rooms` realtime) by public handle; invite-by-handle creates a `gaming_invitations` row (`from_user`, `to_handle`, `game_id`, `status: pending|accepted|declined|expired`, `expires_at`) and notifies the invitee through `@henryco/notifications-ui` / `@henryco/notifications` — never a raw client.
- **Entry-gate stack** — a single server helper `assertGamingEligible(userId, market)` that ALL match/lobby entry paths call, failing closed:
  1. **KYC:** `customer_profiles.verification_status` resolves to the `L4` level required by V3-24 (full identity + age proof). Below that → `kyc_required`.
  2. **Age:** verified 18+ (sourced from the KYC vendor result, not self-declared) → else `age_gate`.
  3. **Geofence:** `market` is in the set of markets with a countersigned `L7` legal opinion AND the requested `game_id` is enabled there (`isGameEnabled` from S1). Else `market_unavailable`. Geofence resolves server-side from request signals + the KYC-verified country — never trust a client-supplied market.
  4. **Self-exclusion hook:** check a `gaming_self_exclusions` row (created empty here; the enforcement flow + cool-downs are V3-66) → `self_excluded`.
- Every gate failure is a typed `GamingError`, rendered by the consumer as a branded empty-state (never a 500), and emits no PII to telemetry.

### S6 — Telemetry

Emit via `emitEvent(...)` from `@henryco/observability`, names exactly:

- `henry.gaming.session.started` — a match transitions to `in_progress`.
- `henry.gaming.session.completed` — a match transitions to `completed`.
- `henry.gaming.match.completed` — outcome resolved (carries `outcome`, `game_id`, `market`; no user identity beyond hashed ids).
- `henry.gaming.profile.updated` — rating/record changed.

Plus gate-instrumentation (no new public events, but log via the structured logger): KYC/age/geofence/self-exclusion denials, for trust-team visibility.

## Out of scope

- **Wallet-funded stakes, escrow, company margin, payouts** → V3-66 (depends on V3-17 ledger + V3-13/V3-15 providers + D9 rate ratification).
- **Spectator mode + match replay UI** → V3-66 (the append-only `gaming_match_moves` log is the replay substrate this pass lays down; the viewer is V3-66).
- **Anti-cheat depth** (anomaly detection on move timing/patterns, manual review queue) → V3-66; this pass ships only server-authoritative state as the foundation.
- **Self-exclusion enforcement + responsible-play cool-downs + daily limits** → V3-66 (this pass creates the `gaming_self_exclusions` table + the gate check; the funded-play enforcement is V3-66).
- **Tournament formats, real-money cashout beyond wallet** → future (cashout uses V3-69 payouts).
- **KYC vendor integration itself** → owned by V3-24; this pass consumes its verification-level output only.

## Dependencies

**Depends on:** V3-13 (payment-router exists, asserted not wired here), V3-17 (ledger exists, not touched here), V3-24 (KYC verification levels — the `L4` gate). **Blocks:** V3-66 (stakes + spectator + replay + anti-cheat depth build directly on this pass's catalog, match state machine, move log, profile, lobby, and gate stack). V3-66 cannot start until V3-65 merges.

## Inheritance

- **`@henryco/rooms`** — real-time transport; extend `RoomKind` with `gaming_match`, reuse `createRoom`/`joinRoom`/realtime presence; never re-implement WebRTC.
- **`@henryco/auth`** (`requireUnifiedViewer()` server gate), **`@henryco/observability`** (`emitEvent`, structured `logger`, `writeAuditLog` from `/audit-log`), **`@henryco/config`** (brand + `henryDomain`/`henryWebRoot` for any link), **`@henryco/i18n`** (all copy), **`@henryco/ui`** (tokens + chrome), **`@henryco/notifications` / `@henryco/notifications-ui`** (invites).
- **V3-24 KYC verification-level resolver** — for the `L4` entry gate.
- **`@henryco/payment-router` (V3-13)** and **V3-17 ledger** — referenced as the substrate V3-66 will wire; not imported here.

## Implementation requirements

### Files
- `packages/gaming-arena/` — new package: `package.json`, `tsconfig.json`, `README.md`, `src/index.ts`, `src/types.ts`, `src/errors.ts`, `src/catalog/index.ts` (+ three game modules), `src/server/match-actions.ts`, `src/server/matchmaking.ts`, `src/server/supabase.ts`, `src/components/` (`GamingLobby.tsx`, `MatchInviteCard.tsx`, `GamingProfileCard.tsx`, `index.ts`), `src/__tests__/` (`match-state-machine.test.ts`, `matchmaking.test.ts`, `entry-gate.test.ts`, `catalog.test.ts`).
- `apps/hub/supabase/migrations/<TS>_gaming_arena_foundation.sql` — `gaming_matches`, `gaming_match_players`, `gaming_match_moves`, `gaming_profiles` (+ `gaming_profiles_public` view), `gaming_head_to_head`, `gaming_invitations`, `gaming_self_exclusions`, `gaming_market_enablement`, `gaming_quiz_questions`; all RLS-enabled.
- `apps/hub/.../app/(account)/play/` — the gaming surface route (lobby + match shell), mounting `@henryco/gaming-arena` components. Confirm the host app from `RoomKind` consumers; gaming lives in the account super-app surface.
- One edit to `packages/rooms/src/types.ts` + the `rooms_sessions.kind` CHECK migration to add `gaming_match`.
- `docs/gaming/onyx-cards-rules.md`, `onyx-quiz-rules.md`, `onyx-track-rules.md` — counsel-reviewed rules docs with `## Legal review` signoff blocks.

### Trust / safety / compliance
- **Owner gate D2 is binding** — read `docs/v3/DECISIONS-REQUIRED.md` first; honor the resolved option exactly (see banner). Do not enable any game in a market without a countersigned `L7` legal opinion (`docs/gaming/legal/<market>-opinion.md`, signoff block) AND an `gaming_market_enablement` row.
- **`L8` gaming-specific insurance** must be confirmed in place per launch market before that market is enabled — assert it in `gaming_market_enablement` (`insurance_confirmed boolean`).
- **KYC L4 required** (V3-24); **age 18+ verified** (vendor-sourced, not self-declared); **geofence** server-resolved from KYC country, never client-supplied.
- **Server-authoritative state** is non-negotiable: the client proposes moves, the server validates + owns state, the move log is append-only. No client `update`/`delete` on any gaming table.
- **Audit log** (`writeAuditLog`) on match start/complete/abandon and on every entry-gate denial.
- **Sensitive-action guard:** match creation and join are state-changing identity-bound actions — wrap with `requireSensitiveAction` (server) / `fetchWithSensitiveAction` (client) from V3-02 where a re-auth step is warranted (at minimum on first lobby entry per session).
- **Anti-clone:** apply ANTI-CLONE Principles 1 (server-side proprietary logic), 7 (authenticated APIs), 10, 12 — all game logic, matchmaking, and rating computation live server-side; the client never holds the move validator or the rating formula.
- **No PII in telemetry or replay payloads** — hashed user ids only; `@henryco/observability/redaction` on any logged payload.

### Mobile + desktop parity
**Mobile-first** — gaming is primarily a mobile surface. Lobby, match shell, and profile must be fully usable on web mobile (safe-area insets, no keyboard-trap, touch-first move input) AND in the Expo super-app. The match shell binds to `@henryco/rooms`, which already supports the super-app transport. Desktop is a parity target, not the primary.

### i18n
All copy through **`@henryco/i18n`**, namespace **`surface:gaming`** — game names/descriptions, lobby labels, invite states, profile stats labels, every `GamingError` user-facing message, gate-denial empty states. Game rules **display copy** is i18n'd; the legal rules docs themselves are counsel artifacts in `docs/gaming/` (not user runtime strings). Twelve locales; Pattern A typed keys for the fixed UI, Pattern B `translateSurfaceLabel` for any dynamic label. Per-market legal disclaimer copy is keyed but the **stakes** disclaimers are V3-66.

### Brand & design system
- Brand strings come from **`@henryco/config`** — the surface is **"Henry Onyx Live"** (the gaming division label) sourced from `company.ts`, never hardcoded; legal entity on any compliance/age-gate copy is **"Henry Onyx Limited"**. Never "Henry & Co.".
- **Fraunces** display + system-sans body; locked design-system tokens only (`--site-*` / `--accent` per the gaming surface's accent in `company.ts`); no ad-hoc hex. Light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed.
- **Zero hardcoded domains** — every link via `henryDomain()` / `henryWebRoot()` / `getAccountUrl()`.

## Validation gates

1. **Standard CI** green: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` across the workspace.
2. **D2 + L7 verified per launch market** — the gate stack proves no game is enterable in a market lacking a countersigned legal opinion + enablement row + confirmed insurance. (CI assertion: `entry-gate.test.ts` proves fail-closed.)
3. **Game rule audit** — each of the three rules docs has a checked counsel-signoff block; `catalog.test.ts` proves an unsigned game is excluded from `isGameEnabled`.
4. **Match state-machine suite** (~12–16 cases) — legal transitions advance, illegal transitions reject, `submitMove` rejects invalid moves without advancing state, move log is append-only + monotonic, `state_hash` recomputes deterministically from the seed + move log.
5. **Matchmaking smoke** — same-skill same-market pairs; cross-market never pairs; collusion-flagged pair de-prioritized.
6. **Entry-gate suite** (~8–10 cases) — KYC-below-L4 blocked, age<18 blocked, off-geofence blocked, self-excluded blocked, all fail-closed, no PII leaked.
7. **RLS verification** — a participant reads only their matches; a non-participant reads nothing; nobody client-side writes `gaming_match_moves`; profile public view exposes no identity. Run the standard RLS test harness.
8. **Real-browser UI pass** — lobby + match shell + profile in light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed.
9. **Telemetry baseline** — the four `henry.gaming.*` events fire with correct shape and no PII.

## Deployment gate
- D2 resolved + the resolved option honored; if D2 = defer (Option B), this pass does not ship.
- `L7` legal opinion countersigned and `L8` insurance confirmed **for every market in `gaming_market_enablement`** — no market enabled without both.
- All validation gates green; owner review (this is a P10 Money/Identity/Compliance surface).
- **30-day soak in a single authorized test market** with the surface gated to internal + invited testers before any wider enablement. No stakes during soak (stakes are V3-66).

## Final report contract
`.codex-temp/v3-65-gaming-arena-foundation/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion. Deferred items must explicitly hand V3-66 the stakes/escrow/spectator/replay/anti-cheat-depth/self-exclusion-enforcement scope and confirm the move-log + gate substrate is ready for it.

## Self-verification
- [ ] D2 read in `docs/v3/DECISIONS-REQUIRED.md` and the resolved option honored exactly; no cash mechanics anywhere in this pass.
- [ ] Three original games (`onyx-cards`, `onyx-quiz`, `onyx-track`) designed from scratch — zero copyrighted IP — each with a counsel-signed rules doc, excluded from the catalog until signed.
- [ ] `@henryco/gaming-arena` package created; `gaming_match` added to `RoomKind` union + `rooms_sessions.kind` CHECK (both agree).
- [ ] Server-authoritative match state machine + append-only move log + deterministic state-hash; client cannot write moves.
- [ ] Matchmaking pairs on skill + market, enforces geofence, de-prioritizes collusion pairs; head-to-head tracking in place.
- [ ] Per-user `gaming_profiles` + public view; rating/record updated server-side only; RLS proven.
- [ ] Lobby + invite-by-handle + presence; invites route through `@henryco/notifications`.
- [ ] `assertGamingEligible` entry-gate stack fails closed on KYC-L4 / age-18 / geofence / self-exclusion; `L7` + `L8` per-market enforced.
- [ ] All copy via `@henryco/i18n` `surface:gaming`; brand via `@henryco/config` (Henry Onyx Live / Henry Onyx Limited); zero hardcoded strings/domains; Fraunces + locked tokens; light+dark, mobile+desktop, CLS≈0, contrast not regressed.
- [ ] Four telemetry events (`henry.gaming.session.started/.completed`, `henry.gaming.match.completed`, `henry.gaming.profile.updated`) fire with no PII; audit log on start/complete/abandon + gate denials.
- [ ] Report written with explicit V3-66 handoff.
