# V3-GAMING-01 — Free-Play Arena Foundation — Implementation Plan

> **For agentic workers:** execute task-by-task with TDD. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build the Pass-1 free-play turn-based arena ("Henry Onyx Live") exactly as `docs/v3/gaming/{ARCHITECTURE,PHASED-PLAN,GAME-CATALOG,LEGAL-GATE-MAP}.md` specify — server-authoritative, provably-fair, Register-L, zero money.

**Architecture:** New shared package `@henryco/gaming-arena` (`. / ./server / ./types`) holding the **pure** game rules + commit–reveal verifier (client-safe) and the **server-only** authoritative orchestrator. A Pass-1 migration adds `gaming_*` free tables (RLS default-deny, append-only move log, two-layer state machine, SECDEF RPCs derived from `auth.uid()`). A Register-L surface in `apps/account/(account)/play`. No wallet, no stake, no escrow, no `payments_private`.

**Tech Stack:** TypeScript ESM (`moduleResolution: bundler`, no `.js` ext, `noEmit`), `node:test`+`tsx`, Supabase Postgres + Realtime, Web Crypto (`crypto.subtle`), Next 16 (apps/account), `@henryco/{config,i18n,observability,notifications,dashboard-shell,auth,trust}`.

## Global Constraints (verbatim from directive + design)

- **ZERO MONEY.** No wallet/stake/escrow object; never touch `payments_private`. Money layer stays designed-but-unbuilt and structurally decoupled (separate flag `GAMING_REAL_MONEY_ESCROW` — NOT created here).
- **SERVER-AUTHORITATIVE.** Every move validated server-side; winner decided server-side via `resolveOutcome`; client never reports its own result. DB triggers + grant-locks make forgery structurally impossible.
- **NO IDOR.** Every SECDEF fn derives actor from `auth.uid()`; never trust a caller-supplied id for authz. New tables RLS default-deny. `revoke all from public, anon, authenticated` then grant narrowly.
- **Register-L.** Light-primary, `--hc-*`/`--acct-*` tokens, dashboard-shell primitives, `--hc-text-on-accent` (dark ink) on gold.
- **Brand via `@henryco/config` + `toBrandName`.** "Henry Onyx Live" label, "Henry Onyx Limited" legal entity — never hardcoded.
- **i18n strict.** No hardcoded JSX strings; `surface:gaming` typed copy (Pattern A `arena-copy.ts`); 12 locales; ig/yo/ha/hi fall back to EN. Re-baseline via `pnpm i18n:scan`.
- **Observability.** `emitEvent` on match lifecycle; structured `logger`; no bare `catch{}`; degraded paths return 207 + `degraded:[...]`.
- **Resilience.** Public reads via `unstable_cache({revalidate,tags})`; per-user reads live + `withTimeout`. Edge crypto = `crypto.subtle`, never `node:crypto`.
- **HANDS OFF** `payments_private`, `packages/search-ui`, money/account flows.
- **D2 ratified** to refined Option C (2026-06-21) — recorded in `DECISIONS-REQUIRED.md`.

---

## File map (create unless noted)

### Package `packages/gaming-arena/`
- `package.json`, `tsconfig.json` — copy kyc/moderation template verbatim (no `lint` script).
- `src/types.ts` — `GameId`, `MatchStatus`, `Seat`, `PlayerSeat`, `GameState`, `GameMove`, `GameOutcome`, `MoveValidation`, `GameDefinition`, fairness/profile/realtime view types. **type-only entry.**
- `src/errors.ts` — `GamingError` base + `IllegalMatchTransitionError`, `MoveRejectedError`, `EntryDeniedError`, `NotYourTurnError` (mirrors RoomError).
- `src/fairness/web-crypto.ts` — `sha256`, `hmacSha256`, `randomBytes32`, `randomSeedHex`, `stableStringify`, `timingSafeEqualHex` (Web Crypto only; PURE/client-safe).
- `src/fairness/commit-reveal.ts` — `commitSeed`, `deriveDraw`, `verifyReveal`, `shuffleFromSeed` (PURE).
- `src/state/state-machine.ts` — `LEGAL_MATCH_TRANSITIONS`, `isLegalMatchTransition`, `assertMatchTransition`.
- `src/state/reducer.ts` — generic `applyValidatedMove`, `isTerminal`.
- `src/rating/elo.ts` — `eloDelta`, `applyElo` (PURE).
- `src/catalog/onyx-lines.ts` — connection game (union-find), `validateMove`/`initialState`/`applyMove`/`resolveOutcome` (zero RNG).
- `src/catalog/onyx-cards.ts` — simultaneous-selection duel, commit–reveal prize order (uses RNG).
- `src/catalog/index.ts` — `CATALOG: Record<GameId, GameDefinition>`, `getGame`, `GAME_IDS`.
- `src/index.ts` — pure barrel (NO `server-only`).
- `src/server.ts` — `import "server-only"` first line; `export * from "./index"` + server exports.
- `src/server/supabase.ts` — `resolveAdminClient()` (service-role; SUPABASE_URL/SERVICE_ROLE_KEY).
- `src/server/entry-gate.ts` — `assertCanPlayFree(userId)` (logged-in only; no KYC/age/geo).
- `src/server/match-actions.ts` — `createMatch`, `joinMatch`, `submitMove`, `leaveMatch`, `completeMatch` (actor from session; call SECDEF RPCs).
- `src/server/matchmaking.ts` — skill-bucket queue + `gaming_head_to_head` anti-collusion down-rank.
- `src/realtime/gaming-match-realtime.tsx` — per-match Realtime provider (Register-L client component).
- `src/components/*` — `GamingLobby`, `MatchShell`, `OnyxLinesBoard`, `OnyxCardsTable`, `GamingProfileCard`, `Leaderboard`, `FairnessVerifier` (Register-L; copy via getArenaCopy).
- `src/__tests__/*.test.ts` — node:test for fairness, state machine, elo, onyx-lines, onyx-cards, catalog, entry-gate.

### Migration + CI
- `apps/hub/supabase/migrations/20260621120000_v3_gaming_01_free_play.sql` — tables, RLS, triggers, SECDEF RPCs, grants. Idempotent, existence-guarded, committed-NOT-applied.
- `apps/hub/supabase/tests/gaming_grant_invariant.sql` — clone of `payments_grant_invariant.sql` (all_fns/writers/public_read arrays).
- `apps/hub/supabase/tests/gaming_rls_behaviour.sql` — `set local role authenticated` → INSERT into moves/another's match rejected; public-read RPC anon-callable.
- `.github/workflows/ci.yml` — append 3 steps to `payments-grant-invariant` job.

### Config + i18n + observability
- `packages/config/company.ts` — DivisionKey `+gaming`; `COMPANY.divisions.gaming`; `PUBLIC_DIVISION_KEYS +gaming`.
- `packages/config/brand-emails.ts` — `gaming: at("gaming")`.
- `apps/account/lib/account-links.ts` — DIVISION_KEYS `+gaming`.
- `packages/dashboard-shell/src/components/section.tsx` — `SectionDivisionAccent +gaming`.
- `apps/account/app/globals.css` — `--acct-div-gaming` (light+dark).
- `packages/i18n/src/arena-copy.ts` + `index.ts` barrel export.
- `packages/observability/src/events.ts` — add 4 `henry.gaming.*` names to union.

### Surface (apps/account)
- `apps/account/app/(account)/play/page.tsx` — lobby landing (DivisionLanding/HeroCard/EmptyStateCard; force-dynamic; withTimeout).
- `apps/account/app/(account)/play/[matchId]/page.tsx` — match shell.
- `apps/account/app/(account)/play/verify/[matchId]/page.tsx` — public fairness verifier.
- `apps/account/lib/gaming/arena-flag.ts` — `isGamingArenaEnabled/Ready` (server-only).
- `apps/account/lib/gaming/play-module.ts` — per-user reader.
- `apps/account/lib/navigation.ts` — `/play` NavItem (Gamepad2), gated in `getNavSections`.

### Proof + docs
- `apps/account/scripts/prove-gaming-arena.mts` — e2e: full PvP playthrough (lines+cards), commit–reveal verifiable, tampered-client rejection, server-authority.
- `docs/gaming/onyx-lines-rules.md`, `docs/gaming/onyx-cards-rules.md` — counsel-reviewed rules (L7 inputs).
- `.codex-temp/v3-gaming-01/report.md`.

---

## Server-authority model (the anti-cheat foundation)
1. **`submitMove`** resolves actor from session → loads authoritative state → runs **pure** `validateMove` → rejects illegal with typed `move_rejected` (state never advances) → appends to `gaming_match_moves` via `apply_gaming_move` optimistic-mutex RPC with recomputed `state_hash`.
2. **`completeMatch`/`settle_gaming_match`** computes winner via **pure** `resolveOutcome(serverState)` — NEVER a client claim. Only this RPC sets the `gaming.settling_match` txn marker, so `guard_gaming_match_completed` rejects any other path to `completed`.
3. **DB** makes it structural: moves append-only (revoke UPDATE/DELETE), tables write-revoked from anon/authenticated/public, RPCs grant-locked, transition + completion triggers.

## Test plan
- **node:test (pure):** fairness commit/verify (+ tamper → false), state machine legal/illegal edges, Elo symmetry/zero-sum, onyx-lines win/illegal-move/swap/no-draw, onyx-cards rounds/facet/vein-carry/tie-break, catalog integrity.
- **prove-gaming-arena.mts:** full PvP playthrough to a real win for both games; commit–reveal end-to-end verifiable; **tampered client** (illegal move → rejected; forged "I win" → resolveOutcome ignores it).
- **CI SQL:** gaming_grant_invariant (anon/auth=false on writers; public-read anon=true) + behavioural (authenticated INSERT rejected) + class-drift passes with NO allowlist add. Validate migration in throwaway PGlite outside repo first.

## Verification (before done)
`lint:all → typecheck:all → i18n:check:strict → test:workspace → build:all` (confirm DIVISION apps build) + package `test` + prove script + adversarial self-review (forge outcome / IDOR-by-param / no-money-path) + re-run SECDEF audit (zero new anon/authenticated holes).

## Self-review (spec coverage)
- [x] Package `. / ./server / ./types`; pure rules + server-only authoritative half.
- [x] Onyx Lines + Onyx Cards (Pass-1 two titles); Quiz structured for Pass 2.
- [x] Two-layer state machine + append-only moves + state_hash + submitMove chokepoint.
- [x] Commit–reveal + public verifier (Cards); Lines proves fairness with zero RNG.
- [x] Matchmaking + head_to_head anti-collusion substrate.
- [x] gaming_profiles (Elo) + public view + leaderboards (read model).
- [x] Lobby + invite-by-handle + presence; Realtime per-match (no @henryco/rooms).
- [x] Register-L surface in apps/account/(account)/play; division + PUBLIC_DIVISION_KEYS.
- [x] assertCanPlayFree only (no KYC/age/geo).
- [x] i18n surface:gaming 12 locales; telemetry 4 events + audit; flag GAMING_ARENA_ENABLED.
- [x] RLS default-deny + gaming grant invariant; zero payments_private.
- **Scope note:** `apps/super-app` (Expo mobile) screens deferred — the shared package is structured for mobile reuse; web is the launchable Pass-1 surface. Documented in report.
