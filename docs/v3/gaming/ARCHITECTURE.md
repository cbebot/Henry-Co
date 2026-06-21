# Henry Onyx Live — Gaming Arena Architecture (Design)

**Pass:** V3-GAMING-DESIGN-01 (design only — no feature code, no migration in this pass)
**Compiled:** 2026-06-21 · Opus 4.8 (1M context), max effort
**Status:** Draft for owner + counsel review.
**Companion docs:** [`GAME-CATALOG.md`](./GAME-CATALOG.md) · [`PHASED-PLAN.md`](./PHASED-PLAN.md) · [`LEGAL-GATE-MAP.md`](./LEGAL-GATE-MAP.md) · [`README.md`](./README.md)
**Grounded in:** the live `origin/main` tree (studied 2026-06-21). Every architectural claim cites the existing primitive it builds on; paths are relative to the repo root.

---

## 0. What this document is, and the one idea it turns on

Henry Onyx is a multi-division platform whose one promise is an **honest standard** — money that reconciles to zero, identity handled with data-minimisation, security that defaults to deny. This document applies that same standard to **play**.

The arena's differentiator is **trust, fairness, transparency** — not AAA graphics. We win because a player can *verify* the deal was fair, the server (never the client) decided the outcome, and — when money is eventually involved — every kobo is double-entry and reconciled. That is a product position the existing money + KYC + security spine already earns us; this design extends it to a gaming surface rather than bolting on a separate, lesser-governed stack.

**The one idea everything else follows from:** gambling, in law, is *consideration* + *chance* + *prize*. **Free practice play removes two of the three** (no money in, no money out). So the architecture is built as **two cleanly separated layers**:

- **The free-play foundation** (Pass 1) — original skill games, server-authoritative, provably fair, playable on registration. No stake, no prize, **no money layer, no gambling legal gate**. Ships now, while counsel reviews the rest.
- **The real-money layer** (later passes) — wallet-funded match-escrow on the proven money spine, 18+/KYC-gated, responsible-gaming controlled. **Designed here in full; built and activated only on per-market legal sign-off.**

The two layers are decoupled at the architecture level (separate flags, separate schema additions, separate gate stacks — §12), so the free foundation has **zero dependency** on the legally-gated money code and can launch independently. The original V3-65 prompt bundled the KYC/age/geofence/legal gate *into* the free foundation; this design pulls that gate out into the money layer where it belongs (§2, §8).

---

## 1. Prime directives this design honors

These are the platform's non-negotiables (`CLAUDE.md`, `docs/v3/README.md` "Non-negotiables", `ANTI-CLONE.md`). Each is carried into the arena design and cited where it lands.

| Directive | How the arena honors it | Section |
|---|---|---|
| **Server-authoritative** (client never owns truth) | The board lives on the server; the client proposes moves and renders; `submitMove` is the single validated chokepoint; the move log is append-only and server-written. | §3, §5 |
| **Provably fair** (verifiable randomness where used) | Commit–reveal RNG; the flagship game uses *no* randomness at all; every random draw is symmetric (same for both players) and verifiable post-match. | §6, `GAME-CATALOG.md` |
| **Money-grade discipline for the future escrow** | Kobo `bigint`, balanced double-entry, idempotent guarded RPCs, reconciliation, status = ledger-confirmed truth — *the existing FL2 spine, reused, not reinvented*. | §9 |
| **Identity / age gating** | Verdict-only consumption of `@henryco/kyc`; no raw PII in the arena; a derived `over18` signal (net-new) gates staking only. | §8 |
| **RLS default-deny** | Every table enables RLS with no permissive write policy; no `using(true)` policy (it would trip the class-drift CI guard); writes only via SECURITY DEFINER RPCs. | §10 |
| **Observability** | `emitEvent` `henry.gaming.*`, structured `logger`, `writeAuditLog`, PII `redaction` — Sentry already wired per app. | §11 |
| **Register-L player surface** | Lives in `apps/account` `(account)/play` (+ `apps/super-app` mobile), light-primary Register-L, shared `dashboard-shell`. | §2.3 |
| **Brand via config** | "Henry Onyx Live" + "Henry Onyx Limited" sourced from `@henryco/config`; never hardcoded; `toBrandName` on stored text; zero hardcoded domains. | §2.3 |
| **i18n, voice** | All copy via `@henryco/i18n` `surface:gaming`, 12 locales; calm-authority voice (`tone:check`). | §2.3 |
| **Don't touch reserved surfaces** | `packages/search-ui` untouched; the frozen money/account flows untouched; the arena composes the spine through its public seams only. | §9, §12 |

---

## 2. Posture, placement, and the D2 decision

### 2.1 The D2 decision posture (read this first)

Gaming is governed by owner decision **D2 — "Gaming-arena legal posture per market"** (`docs/v3/DECISIONS-REQUIRED.md`). Its recorded answer:

> **Owner answer (2026-05-28): ANSWERED — Defer gaming arena entirely from V3 (Option B).** "Wallet-funded player-vs-player matches with company margin is gambling under Nigerian law and most jurisdictions; requires gaming license, age verification, deposit limits, responsible-play features, exclusion lists, audited fairness… Revisit in V4 only after a lawyer signs off per market."

**This design pass revisits that decision.** The 2026-06-21 directive that commissioned this document asks for a *free-play-first* arena that ships now (no money, no legal gate) with the real-money layer *designed but dormant*. That is materially **D2 Option C** ("launch as skill-only no-cash variant first… add stakes only after legal sign-off per market") — and the owner's own 2026-05-28 reasoning is *entirely about the money layer* (staking, margin, deposit limits, exclusion, licensing). None of that reasoning applies to free, no-prize practice play.

**Recommended D2 update (owner to ratify):**

> **D2 (refined Option C, 2026-06-21):** Build and launch the **free-play foundation now** — original skill games, server-authoritative, provably fair, no stake/prize, decoupled from the gambling legal gate. **Design** the real-money match-escrow layer in full but keep it **dormant**, activated per market only on a countersigned stakes-specific legal opinion (`L7`), AML review (`L15`), age-verification capability, and insurance (`L8`). The owner's 2026-05-28 deferral stands *for the money layer*; the free foundation is unblocked.

This document is written to that refined posture. **It changes a recorded owner decision and therefore must be owner-ratified before any build pass starts.** (Note: `docs/v3/orientation/architect-briefing.md` still shows D2 as "PENDING" — the canonical answer is in `DECISIONS-REQUIRED.md`; both should be updated to the refined Option C when ratified.)

### 2.2 Why "skill-based, turn-based, free-first" is the right shape

- **Skill-predominant games** make the only honest version of this product *and* give the eventual money layer its only defensible legal footing ("game of skill", not chance). See `GAME-CATALOG.md` for how each title engineers skill up and chance down.
- **Turn-based first** — easier to build flawlessly, fairer (no reflex/latency advantage), far cheaper to make server-authoritative (no per-frame state sync), and the variance is fully under design control. Real-time comes in a later phase (§4.3, `PHASED-PLAN.md`).
- **Free-first** — the foundation is a real product on its own (practice + ranked-for-pride PvP + leaderboards), it ships without legal lead time, and it lets us prove fairness, anti-cheat, and matchmaking *before* a single naira is at stake.

### 2.3 Surface placement and the two-register design

**Decision: a new shared package `@henryco/gaming-arena` + a player surface inside `apps/account`, not a new standalone app.** Grounded in the topology (`stack-design` findings):

- `apps/account` is the authenticated **SSO host / super-app** — every division surface already mounts under its `(account)/` route group with the shared `@henryco/dashboard-shell` (drawer/rail/palette), a single realtime bridge, division-accent mapping, and the verification/security surfaces the money layer will later need (`apps/account/app/(account)/layout.tsx`). A standalone app would re-implement the SSO host, `proxy.ts`, shell, realtime spine, and `requireUnifiedViewer` header plumbing for no benefit.
- **Web route:** `apps/account/app/(account)/play/` (the V3-65 prompt's `(account)/play` intent; resolved to the canonical `apps/account` host — the prompt's `apps/hub/.../(account)/play` path string is an ambiguity, corrected here).
- **Mobile:** `apps/super-app` (Expo) consumes the same package, so the arena renders on web and mobile without a fork. Gaming is **mobile-first**.
- **Schema:** `apps/hub/supabase/migrations/` (the cross-division / identity spine home).
- **Package shape:** mirror `packages/moderation` / `packages/kyc` — a three-entry exports map (`.` client-safe pure · `./server` `server-only` authoritative half · `./types`), `private`, `type: module`, workspace deps + `@supabase/supabase-js`/`server-only` as peerDependencies. The provably-fair math, the state reducer, and the move validators are pure (`.`); the orchestrating server actions + persistence are `./server`.

**Register-L vs Register-D.** The codebase encodes two design "registers" (in `globals.css`/layout comments, not a single doc): **Register-L** = the light-primary, theme-aware *customer/player* surface (`apps/account`, marketplace buyer/seller, learn, jobs, studio client, etc.); **Register-D** = the dark *operator/owner-staff* counterpart (`staff`, `cms`, `hub` owner command, Expo `company-hub`). The arena is built on **two registers**:

- **Player surface (Register-L):** the lobby, match shell, profile, leaderboards, replay — in `apps/account`/`apps/super-app`, light-primary, shared shell, division accent for "Henry Onyx Live" from `COMPANY.divisions`. (Gaming is **not** yet in `PUBLIC_DIVISION_KEYS` in `packages/config/company.ts:547` — adding it is a Pass-1 step.)
- **Operator surface (Register-D):** the trust/fair-play staff queues (cheat review, fair-play audit, settlement-hold resolution) — reuse the `@henryco/trust` staff queue shell on the staff/owner register, gated by `is_staff_in(...)`.

**Conventions every player surface must follow** (non-negotiable, from `CLAUDE.md` + `stack-design`): brand from `@henryco/config` (`toBrandName` on stored text, links via `henryDomain()`/`getAccountUrl()`); copy via `@henryco/i18n` namespace `surface:gaming`, 12 locales (`ALL_LOCALES`), Pattern A typed keys + Pattern B `translateSurfaceLabel`; calm-authority voice (`pnpm tone:check`); `@henryco/ui` tokens + both themes, Fraunces display + system-sans body, CLS≈0, `a11y:contrast` not regressed; gate failures render branded empty-states, never 500s.

---

## 3. Data model

All tables `public` schema, RLS-enabled, in `apps/hub/supabase/migrations/`. Names are design intent (the build pass finalises). The **free-play foundation** tables (3.1) carry no money and ship in Pass 1; the **money tables** (3.4) are designed here but live in a *separate, later, gated* migration.

### 3.1 Free-play foundation tables (Pass 1)

```
gaming_games            -- catalog registry mirror (id, skill_weight, uses_randomness, enabled, rules_doc_path)
                        --   CHECK id in (...) kept in lockstep with the TS GameId union
gaming_matches          -- one row per match: game_id, status, market(optional, free), created_by,
                        --   winner_user_id, outcome, fairness_commitment, fairness_revealed_seed,
                        --   started_at, completed_at  (status: lobby|matchmaking|in_progress|completed|abandoned)
gaming_match_players    -- (match_id, user_id, seat) — unique(match_id,user_id), unique(match_id,seat)
gaming_match_moves      -- APPEND-ONLY authoritative move log: (match_id, seq, user_id, move jsonb,
                        --   state_hash text) — unique(match_id, seq). The replay + audit substrate.
gaming_profiles         -- per-user: handle (public, not email/name), rating (Elo), wins/losses/ties/abandoned,
                        --   achievements jsonb. + gaming_profiles_public VIEW (handle, rating, w/l/t only)
gaming_invitations      -- invite-by-handle: (from_user, to_handle, game_id, status, expires_at)
gaming_head_to_head     -- anti-collusion substrate: (user_a, user_b ordered, match_count, last_matched_at)
gaming_quiz_questions   -- Henry-Onyx-owned question bank for Onyx Quiz (no third-party banks)
```

Design notes, each grounded in an existing precedent:
- **`gaming_match_moves` is the spine.** It is append-only (no UPDATE/DELETE policy + revoke), `seq`-monotonic per match, each row carrying `state_hash` (the hash of the resulting server state). This *is* the replay substrate (§5) and the anti-cheat evidence (§7). Append-only immutability mirrors the ledger's `block_ledger_mutation()` (`apps/hub/.../20260607120000_double_entry_ledger.sql`).
- **`gaming_matches.status`** is a one-directional state machine enforced two ways (in-process + DB trigger), mirroring `payment_intents` exactly (§5.2).
- **`fairness_commitment` / `fairness_revealed_seed`** persist the commit–reveal lifecycle (§6) so any match is independently verifiable from its row + move log.
- **`market` is optional/free in Pass 1** — there is no geofence on free play. It becomes load-bearing only in the money layer (§8).

### 3.2 RLS shape (every table)

Per the V3-57 default-deny template (`apps/hub/.../20260618120000_v3_57_business_profiles.sql`) and the class-drift CI guard (§10):

- `alter table ... enable row level security;` on **every** table. No `using(true)` write policy anywhere (it would fail `sec_harden_03_grant_invariant.sql`).
- **Participant-scoped SELECT:** a player reads only matches they are in — via a SECURITY DEFINER helper (`gaming_is_match_participant(match_id, auth.uid())`) so the policy does not self-recurse (the recursion trap; enable-not-force so the helper bypasses RLS).
- **No open INSERT/UPDATE:** match creation, joins, moves, completion are all SECURITY DEFINER RPCs (server-authoritative by construction). A player can **never** write their own result or another player's move (the SEC-HARDEN-02 self-escalation lesson).
- **Public reads** (lobby presence handles, leaderboards) via a single **grant-locked SECURITY DEFINER RPC** returning public columns of finalized/active rows only (the `get_business_public_profile` pattern) and the `gaming_profiles_public` view — never internal identity.
- **Trust staff read** via `is_staff_in('gaming')` (SECURITY DEFINER, bypasses RLS) for the operator queues.

### 3.3 Leaderboards

Leaderboards are a **read model**, not a source of truth: a server-side ranking over `gaming_profiles` (Elo rating, per-game, per-window), exposed through the grant-locked public-read RPC. Ratings are written **only** server-side in `completeMatch` via the game's `resolveOutcome` → Elo delta (mirroring V3-58 `seller_tiers`, where only the SECURITY DEFINER `recompute_seller_tier()` writes — no client path).

### 3.4 Money tables (designed; dormant until legal — see §9)

```
gaming_stake_config       -- per (game_id, market): min/max buy-in kobo, margin_bps (D9), enabled=false
gaming_match_escrow       -- one row per staked match (the money-truth row): buy_in_kobo, pot_kobo,
                          --   margin_kobo (rake), payout_kobo, status (held|paid_out|refunded),
                          --   idempotency_key unique, settled_at
processed_match_results   -- dedup table for settlement events (mirrors processed_webhooks)
gaming_self_exclusions    -- responsible-play: irreversible-until-window exclusions per market
gaming_responsible_play_*  -- daily limits, consecutive-loss cool-down config (per market)
gaming_match_spectators   -- spectator join/leave (later social phase)
gaming_cheat_flags        -- (match_id, user_id, reason, signal_payload jsonb, status open|cleared|upheld)
gaming_fair_play_audits   -- sampled completed staked matches for trust review
```

Plus two new **ledger accounts** seeded into `public.ledger_accounts` (§9): `match_escrow_liability` (liability/credit) and, if rake must be reported separately, `match_rake_revenue` (revenue/credit).

---

## 4. Transport — turn-based first (Supabase Realtime), real-time later

### 4.1 The correction over V3-65

V3-65 specified binding every match to `@henryco/rooms` via a new `gaming_match` `RoomKind` — i.e. routing turn-based games through the **WebRTC video engine** (Daily.co + Jitsi). **That is the wrong transport for turn-based play.** `@henryco/rooms` exists for live audio/video consults, interviews, and tours; a turn-based card/board/quiz game needs *state synchronisation*, not a video call. The `fairness-primitives` study confirms the correct substrate is already in production-grade use.

### 4.2 The turn-based transport (Pass 1)

Authoritative state lives in the DB; clients sync via **Supabase Realtime** — all three mechanisms already proven in this repo:

- **`postgres_changes` for authoritative state.** A **per-match channel** streams `gaming_match_moves` / `gaming_matches` filtered by `match_id`, modelled directly on the **page-scoped provider** `packages/rooms/src/realtime/rooms-realtime.tsx` (mount on the match page, tear down on leave; `session_id=eq.<id>` → `match_id=eq.<id>`). Reliability discipline is the **gold-standard provider** `packages/dashboard-shell/src/shell/supabase-realtime-provider.tsx`: exponential backoff, a connect watchdog, a **30s polling fallback** (covers dropped events), and **`realtime.setAuth(newToken)` on `TOKEN_REFRESHED`** so long-lived match channels survive JWT rotation. The Realtime `filter` is defence-in-depth *on top of* RLS, never instead of it.
- **`broadcast` for fast move/clock fan-out.** Ephemeral move-made / turn-clock ticks go over a broadcast channel (the `.on("broadcast", …)` subscription as in `packages/messaging-thread/src/thread.tsx`, with the `config: { broadcast: { self: false } }` send config as in `apps/studio/components/messaging/use-realtime-messages.ts`) — the *authoritative* state is still settled server-side; broadcast is only the low-latency nudge so the opponent re-reads.
- **`presence` for disconnect-forfeit.** Lobby "online" and in-match "opponent connected" use Realtime presence (`channel.track()` / `presenceState()`, as in `apps/studio/.../use-typing-indicator.ts`) — a disconnect beyond a grace window drives a server-side forfeit/abandon.

Because turn-based correctness does **not** depend on sub-second latency, even a pure server-action + `postgres_changes` loop is correct; broadcast/presence are UX accelerants. No WebRTC, no `@henryco/rooms`, no `RoomKind` edit in Pass 1.

### 4.3 Real-time games (later phase)

When real-time games arrive (`PHASED-PLAN.md`, later pass), **then** `@henryco/rooms` becomes relevant — for optional voice/video alongside a match, and for the lower-latency transport real-time reflex games need. That is the one place the V3-65 `gaming_match` `RoomKind` extension is warranted, and it is explicitly deferred to that phase.

---

## 5. The package and the server-authoritative game-logic model

### 5.1 Package layout (`@henryco/gaming-arena`)

```
packages/gaming-arena/
  package.json            // private, type:module, exports { ".":pure, "./server":server-only, "./types" }
  src/
    index.ts              // client-safe barrel: types + pure validators + pure fairness verifier
    types.ts  errors.ts   // GameId union, GameState, typed GamingError (mirrors RoomError)
    catalog/              // GameDefinition[] — onyx-lines, onyx-cards, onyx-quiz (pure)
    fairness/             // commit-reveal: commit(), deriveSeed(), verify() — PURE, also client-safe
    state/                // pure reducers: applyMove(state, move) -> state', isTerminal, resolveOutcome
    server.ts             // import "server-only"; orchestrators + persistence
    server/
      match-actions.ts    // createMatch, joinMatch, submitMove, leaveMatch, completeMatch
      matchmaking.ts      // skill+market queue + anti-collusion down-rank
      anti-cheat.ts       // detectors (deterministic) -> verdict
      supabase.ts         // service-role write path (createAdminSupabase)
    components/           // GamingLobby, MatchShell, GamingProfileCard, Leaderboard, ReplayView (Register-L)
    __tests__/            // node:test + tsx
```

**The pure/server split is load-bearing for fairness and anti-cheat:** the move validators, the state reducer, the Elo math, and the commit–reveal *verifier* are **pure** and live in `.` — so the client can render and even *locally predict* using the exact same code the server runs authoritatively, and a third party can verify a finished match. The *authoritative execution* (which seed, which move is accepted, what gets persisted) lives behind `server-only` and runs with the service-role client. ANTI-CLONE Principle 1 holds: the validator and the rating formula being readable does not matter because **the server is the only writer**; the client never holds the *authority*, only the *rules*.

### 5.2 The match state machine (two-layer, exactly like `payment_intents`)

The fairness reader found the canonical state-machine pattern and it transfers verbatim:

- **In-process guard:** a `LEGAL_TRANSITIONS` table + `assertTransition()` in `packages/gaming-arena/src/state/`, modelled on `packages/payment-router/src/state-machine.ts` (`lobby → matchmaking → in_progress → completed`, and `* → abandoned`; terminal states have no out-edges; same-state is an idempotent no-op).
- **Unbypassable DB guard:** a `BEFORE UPDATE` trigger `enforce_gaming_match_transition()` transcribing the **same** edges, modelled on `enforce_payment_intent_transition()` (`apps/hub/.../20260529120000_payment_intents.sql`). The two are kept in lockstep deliberately — defence in depth.
- **"Only the settlement RPC may finalize":** the transition into `completed`/`settled` is guarded by a txn-local marker (`set_config('gaming.guarded_completion','on',true)` + a BEFORE trigger that rejects the protected transition unless the marker is set) — the exact `care_private.guard_payment_request_paid()` idiom (`apps/care/.../sec_harden_05_care_payment_guard.sql:315-333`). "Free-mark-won" is the gaming analogue of "free-mark-paid"; this closes it by construction.
- **"Exactly one move per turn":** `submitMove` advances turn state with an optimistic-mutex conditional UPDATE (`where ... and current_seq = expected`), the `advance_payment_intent` `row_count` pattern — concurrent submissions race, exactly one wins.

### 5.3 `submitMove` — the single anti-cheat chokepoint

Every move flows through one server action: resolve the actor server-side from the session (**never** trust a client-passed player id — the recurring CRITICAL review finding for SECURITY DEFINER RPCs), load authoritative state, run the **pure** `validateMove`, reject with a typed `move_rejected` if illegal (state never advances), else append to `gaming_match_moves` with the recomputed `state_hash` and broadcast the change. Because the move log is append-only and the validator is deterministic, the entire match is **replayable and auditable** from its log + seed.

### 5.4 Matchmaking

A deterministic queue keyed by `(game_id, market, skill_bucket)` where the bucket derives from Elo rating. Anti-collusion is built in from the start: `gaming_head_to_head` tracks ordered pairings and matchmaking **down-ranks** pairing two users who have faced each other above a threshold in a rolling window. This is the structural hook the fair-play audit (§7) over-samples.

---

## 6. The provably-fair engine (commit–reveal)

This is the trust differentiator, and it is **genuinely new** — the crypto building blocks all exist (`fairness-primitives` found HMAC-SHA256, SHA-256, CSPRNG, GCM AAD-binding, canonical JSON), but no commit–reveal *composition* exists yet.

### 6.1 The protocol

For any game that uses randomness (Onyx Cards' prize order, Onyx Quiz's question selection — *not* Onyx Lines, which uses none):

1. **Commit (match creation):** the server mints `serverSeed = randomBytes(32)` (CSPRNG, the `generateDataKey()` idiom from `packages/kyc/src/crypto/envelope.ts:38`) and publishes `commitment = SHA-256(serverSeed)` into `gaming_matches.fairness_commitment` *before any move*. The commitment is visible to both players.
2. **Contribute:** each player contributes a `clientSeed` (and a per-round `nonce`). These are recorded.
3. **Derive:** every random draw is `outcome_n = HMAC-SHA256(serverSeed, clientSeedA ‖ clientSeedB ‖ nonce_n)` mapped to the needed range. The derivation is **pure** and lives in the client-safe `fairness/` module, so both clients compute the *same* draw and the server's authoritative draw is identical and checkable.
4. **Reveal (match end):** the server writes `serverSeed` into `gaming_matches.fairness_revealed_seed`. Anyone can now check `SHA-256(revealed_seed) == commitment` and recompute every draw — proving the server neither rigged the seed nor changed it mid-match.

### 6.2 Why this is honest, not theatre

- **The server commits before it knows the players' seeds**, so it cannot grind a favourable seed; the players' seeds enter after the commitment, so they cannot grind either. Neither side, nor the house, can bias the result.
- **The randomness is symmetric** (both players face the same prize order / question set), so even the random element is not an *advantage* to either side — it is shared terrain skill is exercised over (`GAME-CATALOG.md`).
- **Signing for tamper-evidence:** the final board state and the move log are signed with HMAC-SHA256 over a **canonical, pinned-field JSON** (`stableStringify` + `canonicalizeSnapshot` from `apps/studio/lib/studio/approval-signature.ts`), so a stored result cannot be altered after the fact without detection. Verification uses `timingSafeEqual`.
- **Public verifier:** a small read-only route reconstructs and verifies any completed match from its row + move log — the literal "provably fair" promise, surfaced to players.

### 6.3 The flagship needs none of this

Onyx Lines has zero randomness. Its fairness is *self-evident from the move log alone* — anyone can replay it and there is no seed to trust. Leading with a zero-RNG game means the arena's fairness claim is demonstrable on day one, before the commit–reveal engine is even exercised.

---

## 7. The anti-cheat + anti-collusion engine

The `fairness-primitives` study found the framework to host detectors already exists (`packages/moderation` deterministic-floor → verdict-lattice → human-gate; `packages/trust` flag model + escalation); the **game-specific detectors are new**. The engine reuses the framework and adds the detectors.

### 7.1 The deterministic floor (authoritative)

Server-authoritative state *is* the primary anti-cheat: the client cannot manipulate the board, and `submitMove` rejects illegal moves by construction (§5.3). The deterministic floor adds **server-side replay verification** — re-execute the move log to confirm the recorded `state_hash` chain is consistent. A mismatch is not a heuristic; it is proof, and it holds settlement (in the money layer).

### 7.2 Statistical detectors (advisory → human-gated)

Modelled on the moderation pipeline's monotonic lattice (`approve < hold < reject`), where **deterministic verdicts are authoritative and statistical signals can only escalate to *review*, never auto-ban** (human-gated):

- **Move-timing / input-entropy anomalies** — impossibly fast or machine-regular move cadence.
- **Win-rate / Elo anomalies** — improbable streaks, rating-inconsistent play.
- **Collusion-pair signals** — the `gaming_head_to_head` graph + the existing **payout-diversion / off-platform-coordination** detector (`packages/trust/detect.ts` `detectSuspiciousContent`, the payout-diversion patterns) repurposed for chat/coordination signals; shared-IP/device correlation across a match's two players. (`packages/trust` is a flat package — no `src/` dir.)

### 7.3 Flags, escalation, queues

A flagged match writes a `gaming_cheat_flags` row reusing the `trust_flags` model (`flag_type` free-text like `collusion_suspected`, `signal_payload jsonb`, severity ladder) and escalates repeat offenders via the existing `escalateSeverityForRepeatOffender`. Trust staff resolve flags through the `@henryco/trust` queue shell on the Register-D operator surface. **In the money layer, an open flag holds settlement** — escrow stays `held` until resolution (§9).

---

## 8. Identity and age gating (KYC vault integration)

The `kyc-vault` study makes the gating story precise — and surfaces a hard dependency.

### 8.1 Free play: (almost) no gate

Free, no-prize play needs **no identity verification** — you do not need a verified identity to play a free game. At most, Pass 1 requires a logged-in account (so `requireUnifiedViewer()` and a `gaming_profiles.handle`) and basic ToS/acceptable-use acceptance. No KYC, no age proof, no geofence. This is what lets the foundation ship without legal lead time.

### 8.2 Real-money staking: verdict-only consumption, plus a net-new age signal

When staking is legally enabled, the eligibility gate consumes the KYC vault **verdict-only** — it must **never** touch ciphertext, data keys, or `kyc_vault_artifacts` (those RPCs are service-role, artifact-only). It reads:

- **Identity level (LIVE today):** `meetsLevel(actual, required)` from `@henryco/kyc` (the L0–L4 ladder; L3 = document, L4 = biometric) against `customer_profiles.verification_level`, and/or `satisfiesVerificationRequirement(status, "verified")` from `packages/trust/verification.ts` — the **same gate the other divisions already use**. Staking should require **≥ L3, ideally L4**.
- **Age (NET-NEW — a hard prerequisite, not a read):** **there is no age / DOB / 18+ signal anywhere in the consumable surface today.** The redaction allowlist (`SAFE_VERDICT_KEYS`, `packages/kyc/src/redaction.ts`) deliberately *drops* DOB, and `KycVerdict` has no age field. To gate staking by age, a **derived, data-minimised** `over18: boolean` (or coarse `age_band`) must be added: the vendor adapter emits it (never the raw DOB), it is allowlisted into `SAFE_VERDICT_KEYS`, surfaced on the verdict + a verdict-table column, and exposed via a client-safe `isAdult(verdict)` helper from the package root. **This is build work that gates the money layer, and it is tracked as such in `PHASED-PLAN.md` and `LEGAL-GATE-MAP.md`.** The arena then gates staking on `status === "verified" && level ≥ L3 && over18 === true` — reading a boolean only, no PII ever entering the arena.
- **Geofence (money layer only):** `market` resolved server-side from the KYC-verified country (never client-supplied), checked against the set of markets with a countersigned `L7`.

### 8.3 The entry-gate stack

A single fail-closed server helper composes the gate so all entry paths call one thing:

- **Free play:** `assertCanPlayFree(userId)` → logged-in + not self-excluded (self-exclusion applies to free play too, as a responsible-play courtesy). No KYC/age/geo.
- **Staked play (gated):** `assertCanStake(userId, market)` → free gate **plus** KYC ≥ L3 + `over18` + geofence + responsible-play limits (daily cap, consecutive-loss cool-down) + wallet balance. Every denial is a typed `GamingError` rendered as a branded empty-state, emitting no PII.

---

## 9. Money-spine integration — the future match-escrow

Designed in full here; **built and activated only on legal sign-off** (§12, `LEGAL-GATE-MAP.md`). The `money-spine` study confirms the escrow is a **clone of existing primitives**, not an invention. The governing principle: **the house is never a counterparty.** Player-vs-player only; the company holds stakes in custody and takes a transparent rake. This is expressed structurally by making escrow a **liability account**.

### 9.1 The ledger model

Two new accounts seeded into `public.ledger_accounts` (exactly as `vat_output_payable` was added in `20260607140000_v3_vat_01_settlement_vat.sql`):

- **`match_escrow_liability`** (type `liability`, normal balance `credit`) — staked money the platform *owes back* to players (custody, not revenue). The house is custodian, not bettor.
- **`match_rake_revenue`** (type `revenue`, credit) *or* reuse `platform_revenue` — the **only** account the company's cut ever credits.

### 9.2 The three money edges (all balanced, idempotent, kobo)

Each is one balanced `journal_entries` head + ≥2 one-sided `journal_lines`, posted **only** through the existing sanctioned writer `post_ledger_entry` (never a direct `journal_lines` insert), idempotent on `(source, source_event_id)` via `journal_entries_source_event_unique`. The deferred `assert_entry_balanced()` trigger and append-only `block_ledger_mutation()` cover the new entry types **for free**.

| Edge | New guarded RPC | Ledger posting | Mirrors |
|---|---|---|---|
| **Stake-in** (each player, before `in_progress`) | `post_match_stake` | `DR customer_wallet_liability / CR match_escrow_liability` (per player) | `credit_wallet_topup` (atomic wallet move + txn row + ledger post, one txn) + the refund migration's never-negative `for update` wallet debit |
| **Settle (win)** | `settle_match` | `DR match_escrow_liability (pot) / CR customer_wallet_liability (payout = pot − rake) / CR match_rake_revenue (rake)` | `post_sale_revenue` (one DR, two CRs, omit a zero leg) |
| **Refund (tie / abandon / reversal)** | `refund_match` | reverse the escrow holds back to each player's wallet, **no rake taken** | the V3-19 refund engine (`apps/hub/.../20260611130000_v3_19_refunds.sql`) |

### 9.3 Money-grade discipline (non-negotiable, from the spine)

- **Kobo `bigint` only**; never float, never `×100` except at the documented major→minor seam; validate `Number.isSafeInteger && ≥ 0` and `0 ≤ part < total` (the `~100×` trap is real and documented in `sale-reconcile-port.ts`).
- **Stake-hold is all-or-nothing:** check every player's `customer_wallets.balance_kobo ≥ buy_in` first; if any player can't cover, abort with **zero debits** (reverse any partial holds in the same txn). No match starts until every stake is confirmed held.
- **Exactly-once settlement:** a `processed_match_results` dedup table + the **dedup-insert-FIRST, effect-SECOND, one-transaction** discipline of `apply_payment_webhook` (`processed_webhooks`). A re-delivered or double-clicked settlement no-ops.
- **Payout can never exceed the pot — by construction:** a BEFORE trigger on the escrow row that locks it (heeding the refund migration's documented concurrency lesson — `pg_advisory_xact_lock`, *not* a naive per-snapshot `for update`) and rejects any settlement pushing cumulative payout past cumulative stake. Built in the DB so it holds "even if every app-layer check is bypassed" (the over-refund-impossible template).
- **Server-authoritative result is the only truth:** the match outcome is the analog of the provider webhook; `settle_match` settles only on the server-confirmed outcome, **never** a client claim (`decideSaleReconcile` settles only on `intent.status === 'succeeded'`; mismatches **flag**, never silently settle).
- **Wallet stays a projection:** balance move + `customer_wallet_transactions` row + ledger post in one transaction; `wallet_ledger_reconciliation()` (extended to assert escrow nets to zero and `sum(held escrow) == match_escrow_liability balance`) is the daily go-live gate. Drift surfaces to the finance/trust queue.
- **Schema isolation:** the escrow writers live in a **non-PostgREST schema `games_private`** mirroring `payments_private`/`care_private` (`revoke usage ... from anon, authenticated; grant usage to service_role`), reached via the pooled-pg `callPaymentRpc` pattern or a grant-locked public wrapper. `gaming_match_escrow` writes are revoked from **all** roles including service_role (writes only through the guarded RPC, the SEC-HARDEN-05 `care_payments` discipline).
- **Sensitive-action guard** (`withSensitiveAction`: reauth + rate-limit + audit) on stake-hold and self-exclusion-set; `writeAuditLog` on every stake, settle, refund, reversal, and cheat flag.

**Open architecture choice (flag for the build pass):** whether escrow rides the FL2 `payments_private` **kobo** spine (recommended — wallet-native, the wallet is already kobo) or forks a parallel numeric schema like care did. The care precedent shows the team *will* fork when units/lifecycle differ; for a wallet-funded arena, the kobo spine is the natural fit. (Note: the FL2 money set is *committed-NOT-applied per migration headers*; staking depends on FL2 being live in prod — a real dependency, not just a code dependency.)

---

## 10. Security posture (RLS + CI invariants)

The arena schema must pass the existing CI invariants on a fresh DB (`security-discipline` study). This is a checklist, not a suggestion:

1. **Every table:** `enable row level security`. The escrow/wager tables additionally `force row level security` (financial-PII parity with `kyc_vault_artifacts`).
2. **No `using(true) with check(true)` write policy** for `anon`/`authenticated`/`public` on any gaming table — it trips the **class-drift guard** (`apps/hub/supabase/tests/sec_harden_03_grant_invariant.sql`), and the gaming tables are **not** on the allowlist. The escrow money table, if it ever must defer, needs an explicit allowlist entry + written justification.
3. **No open INSERT/UPDATE policy** on `gaming_matches`/`gaming_match_moves`/`results`/escrow — every transition is a SECURITY DEFINER RPC inserting/updating as owner. `revoke insert,update,delete,truncate ... from anon, authenticated, public` on the tables (and **also from service_role** on escrow).
4. **Every SECURITY DEFINER function/trigger:** `set search_path = public, pg_temp`; `revoke all ... from public, anon, authenticated; grant execute ... to service_role` (and `authenticated` only where a real player/staff caller is proven). Escrow/payout writers are service-role-only in `games_private`.
5. **Recursion-safe reads:** participant/leaderboard reads via SECURITY DEFINER helpers on enable-not-force tables; never name a policy `"Service role full access"`; never rely on a policy for the admin path (service_role bypasses RLS).
6. **New CI invariants to add** (new files in `apps/hub/supabase/tests/`, wired into `.github/workflows/ci.yml`): a **gaming-RPC grant invariant** cloning `payments_grant_invariant.sql` (every gaming/escrow function `anon=false, authenticated=false`, writers `service_role=true`, explicit `all_fns[]`); a **behavioural test** (`set local role authenticated` → INSERT into `results`/another player's `gaming_match_moves` is rejected); confirm the class-drift guard passes without an allowlist add.
7. **Migration discipline:** per-app location, idempotent + existence-guarded, **committed-NOT-applied**, applied owner-gated via `supabase db query --linked` (one atomic txn), **never** `db push`. Heed the `set constraints all immediate` ordering if the escrow migration arms a deferred balance trigger alongside any backfill (enable RLS + revoke **before** the backfill; force-validate after).

---

## 11. Observability and telemetry

Per `docs/v3/monitoring-conventions.md` and the `henry.<domain>.<thing>.<verb>` convention (`emitEvent`, `packages/observability`):

- **Free-play events:** `henry.gaming.session.started`, `henry.gaming.session.completed`, `henry.gaming.match.completed` (carries `outcome`, `game_id`, hashed ids — **no PII**), `henry.gaming.profile.updated`.
- **Money/social events (later):** `henry.gaming.stake.held`, `henry.gaming.stake.paid_out`, `henry.gaming.spectator.joined`, `henry.gaming.replay.viewed`, `henry.gaming.cheating.flagged`.
- **Audit:** `writeAuditLog` on match start/complete/abandon, every entry-gate denial, and (money layer) every stake/settle/refund/flag.
- **Redaction:** `@henryco/observability/redaction` on any logged or replay payload — **hashed user ids only**, never a handle→identity link, never a move payload that could carry PII. Sentry is already wired per app.
- **Realtime health:** reuse the `henry.realtime.connection.*` telemetry the shell provider already emits, so match-channel reliability is observable.

---

## 12. The free-play / money-layer decoupling (the seam)

This is the architectural guarantee that lets the foundation ship now. The two layers are separated at four levels:

1. **Flags (two-predicate, per the moderation/card-rail convention):**
   - `GAMING_ARENA_ENABLED === "true"` → the **free** arena. The only flag Pass 1 needs.
   - `GAMING_REAL_MONEY_ESCROW === "true"` **AND** a `isGamingEscrowReady()` predicate (legal-enablement row present + payment DB configured + FL2 live + age signal built) → the **money** layer. Mirrors `isMarketplaceCardCheckoutReady()` so the money path can never light up without its rail (and its legal clearance) present. Off by default; flipping it without the readiness predicate does nothing.
2. **Schema:** the free tables (§3.1) ship in the Pass-1 migration; the money tables (§3.4) ship in a **separate, later, gated** migration. The free arena runs with the money tables absent.
3. **Gate stacks:** `assertCanPlayFree` (no KYC/age/geo) vs `assertCanStake` (full gate) are distinct helpers; the free path never imports the staking gate.
4. **Code:** the escrow lives behind the package's `./server` entry under a money seam that the free surfaces never import; the stake panel/escrow components are dormant until the flag is on.

The result: **the free-play foundation has no dependency — code, schema, flag, or legal — on the money layer.** It is a complete product that ships while counsel reviews staking, and the money layer drops in later with no rework to the foundation.

---

## 13. What is genuinely new vs. reused (grounding summary)

**Reused (exists today, evidence-grounded):** the double-entry ledger + `post_ledger_entry` + balanced/append-only triggers; the wallet + `credit_wallet_topup` atomic envelope + reconciliation; the `DivisionSaleReconcilePort` reconcile-on-read seam; `apply_payment_webhook`'s dedup-first/effect-second exactly-once discipline; the over-refund-impossible trigger; the two-layer state machine (`payment_intents`) + the txn-marker settle guard (care); the optimistic-mutex one-winner UPDATE; the sensitive-action guard; the KYC L0–L4 levels + shared verification status; the RLS default-deny template + class-drift CI guard + grant-lock pattern + `*_private` schema isolation; Supabase Realtime (`postgres_changes`/`broadcast`/`presence`) with the shell provider's reliability discipline; the moderation deterministic-floor→verdict-lattice→human-gate framework + `trust_flags` model + escalation; the crypto building blocks (HMAC-SHA256, SHA-256, CSPRNG, GCM AAD, canonical-JSON signing); the i18n typed-copy + 12-locale pattern; the feature-flag predicate convention; the `node:test`+tsx + `prove-*.mts` harness.

**Genuinely new (named gaps to build):** the commit–reveal provably-fair *composition* + public verifier; the gaming tables + RLS + match state-machine migration; the server-side move-validation/replay engine; the game-specific anti-cheat detectors (move-timing/entropy, illegal-move, Elo-anomaly, collusion-pair graph, shared-IP/device); the per-match Realtime wiring; the **derived `over18` age signal in the KYC layer**; and the escrow money path (designed, dormant, legally gated).

---

## 14. Self-check

- [x] Game-framework choice justified (lightweight web 2D via the package's React components on Register-L; no game engine needed for turn-based — DOM/Canvas renders board/cards/quiz; §2.3, §5.1).
- [x] Turn-based-first + real-time-later approach, with the **transport correction** over V3-65 (Supabase Realtime, not `@henryco/rooms` WebRTC, for turn-based — §4).
- [x] Server-authoritative game-logic model (pure rules in `.`, authoritative execution in `./server`, two-layer state machine, `submitMove` chokepoint — §5).
- [x] Fairness + anti-cheat engine grounded in existing crypto + moderation/trust framework, with named new detectors (§6, §7).
- [x] Data model (games/matches/moves/profiles/leaderboards + dormant money tables) with the RLS shape (§3).
- [x] Money-spine integration: the future match-escrow as a *clone* of the FL2 ledger primitives, house-never-counterparty via a liability account, designed-not-built (§9).
- [x] KYC vault integration: verdict-only, and the **net-new `over18` dependency** flagged precisely (§8).
- [x] Two-register design (Register-L player surface + Register-D operator queues — §2.3).
- [x] Free-play foundation **fully decoupled** from the legally-gated money layer at flag/schema/gate/code levels (§12).
- [x] D2 decision posture surfaced honestly (recorded answer was "defer/Option B"; this design = refined Option C; owner ratification required — §2.1).
- [x] Does not touch `packages/search-ui` or the frozen money/account flows; composes the spine through its public seams only.
