# V3-66 — Product Expansion: Gaming Arena Stakes, Spectator & Replay

**Pass ID:** V3-66  ·  **Phase:** G (Product Expansion)  ·  **Pillar:** P10 (Gaming Arena)
**Dependencies:** V3-65 (and transitively V3-13, V3-17, V3-19, V3-24)  ·  **Effort:** XL  ·  **Parallel-safe:** N
**Owner gate:** D2  ·  **Risk class:** Money / Identity / Compliance

---

> **OWNER-GATED — DO NOT START until you have read the current answer to D2 in `docs/v3/DECISIONS-REQUIRED.md`.** D2 ("Gaming-arena legal posture per market") governs this pass. This pass introduces **real money movement** — wallet-funded match stakes held in escrow, a company margin per match, and winner payouts — so it requires a **stakes-specific** legal opinion (the `L7` artifact must explicitly cover *cash-staked* PvP per market, which is a stronger bar than V3-65's catalog opinion). If D2 resolves to Option B (defer gaming to V4), this pass does not execute — stop and report. If D2 resolves to Option C (skill-only / no-cash first), this pass stays parked until per-market stakes sign-off lands; V3-65's money-free surface stands alone. If D2 resolves to Option A, stakes ship **only** in markets carrying a countersigned stakes-specific `L7` AND an `L15` AML review. The decision is the owner's; confirm it, do not re-litigate it.

## Role
You are the V3 Gaming Arena stakes engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass puts money on the board V3-65 built: **wallet-funded match stakes held in escrow against the V3-17 double-entry ledger, a company margin per match, winner payout, and refund-on-tie/abandon**, plus the spectator surface, server-state replay, anti-cheat foundation (anomaly detection + manual review queue), responsible-play limits, self-exclusion enforcement, and a fair-play audit queue for trust staff. The lines you must not cross: **money is provider-confirmed truth, never optimistic UX; every stake movement is double-entry, idempotent, and reconciled; no match starts unless both players' wallets are debited into escrow first.** Tournaments and external cashout are out of scope.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/66-gaming-arena-stakes-spectator-replay` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

**V3-65 (its direct dependency) shipped the money-free foundation:** the `@henryco/gaming-arena` package, the original catalog (`onyx-cards`, `onyx-quiz`, `onyx-track`), the server-authoritative match state machine (`gaming_matches`, `gaming_match_players`), the **append-only move log `gaming_match_moves`** (the replay substrate — `seq`, `move`, `state_hash`), per-user `gaming_profiles` + public view, matchmaking with anti-collusion head-to-head tracking, the lobby, and the fail-closed entry-gate stack (`assertGamingEligible`: KYC-L4 + age-18 + geofence + a `gaming_self_exclusions` placeholder). Real-time transport is `@henryco/rooms` via the `gaming_match` `RoomKind`.

**The money spine is in place.** **V3-17** is the double-entry ledger — every money movement must net to zero across paired entries. The wallet today is `customer_wallets.balance_kobo` (BIGINT minor units / kobo) + `customer_wallet_transactions` (`amount_kobo`, `type`, `status`, `reference_type`, `division`), surfaced through `@henryco/dashboard-modules-wallet`. **V3-13** shipped `@henryco/payment-router`; **V3-19** is the provider-agnostic refund/reconciliation engine this pass reuses for tie/abandon refunds. Company margin per division is governed by **D9** (monetization rates).

**The gap this pass closes:** V3-65's arena has no money, no audience, no memory, no cheat defense beyond server-authoritative state, and no responsible-play teeth. This pass makes the arena a real, money-handling, auditable, fair, spectatable, replayable product — **and only if D2 + stakes-specific `L7` + `L15` AML authorize it per market.**

## Mandatory scope

### S1 — Wallet-funded stakes + escrow (the money spine)

Money is absolute here. Integer minor units (kobo) only; double-entry; idempotent; provider/ledger-confirmed; no optimistic balance.

- New migration `apps/hub/supabase/migrations/<TS>_gaming_arena_stakes.sql`:

```sql
-- Per-game buy-in bounds; configured per market, ratified against D9 margin.
create table if not exists public.gaming_stake_config (
  game_id text not null,
  market text not null,
  min_buy_in_kobo bigint not null check (min_buy_in_kobo > 0),
  max_buy_in_kobo bigint not null check (max_buy_in_kobo >= min_buy_in_kobo),
  margin_bps int not null check (margin_bps >= 0 and margin_bps <= 10000), -- company margin, basis points (D9)
  enabled boolean not null default false,
  primary key (game_id, market)
);

-- One escrow record per staked match; the single money-truth row for the match.
create table if not exists public.gaming_match_escrow (
  match_id uuid primary key references public.gaming_matches(id) on delete restrict,
  buy_in_kobo bigint not null check (buy_in_kobo > 0),    -- per player
  pot_kobo bigint not null check (pot_kobo > 0),          -- sum of all buy-ins
  margin_kobo bigint not null check (margin_kobo >= 0),   -- company cut
  payout_kobo bigint not null check (payout_kobo >= 0),   -- pot - margin (to winner)
  status text not null default 'held'                      -- held | paid_out | refunded
    check (status in ('held','paid_out','refunded')),
  idempotency_key text unique not null,                    -- stake-hold idempotency
  held_at timestamptz not null default timezone('utc', now()),
  settled_at timestamptz
);
```

- **Stake-hold flow** (`packages/gaming-arena/src/server/stakes.ts`, `holdStakes(matchId)`), executed atomically before a match transitions `matchmaking → in_progress`:
  1. Re-resolve buy-in + margin from `gaming_stake_config` (server-side; never trust client).
  2. **Wallet-balance check** for every player (`customer_wallets.balance_kobo >= buy_in_kobo`); any insufficient → abort the match, no debits.
  3. For each player: debit `buy_in_kobo` from `customer_wallets` and write a **double-entry pair** through the V3-17 ledger — debit player wallet, credit a `gaming_escrow_pool` ledger account — with a per-match **idempotency key** (`gaming_match_escrow.idempotency_key`). A `customer_wallet_transactions` row is written with `type` = stake-hold, `reference_type` = `gaming_match`, `division` = the gaming division.
  4. Compute `margin_kobo = floor(pot_kobo * margin_bps / 10000)`, `payout_kobo = pot_kobo - margin_kobo`. Persist the escrow row `status='held'`.
  5. Only on a fully-confirmed hold does the match start. If any debit fails, **reverse all prior debits in the same transaction** (no partial holds).
- **Settlement** (`settleMatch(matchId, outcome)`), called by V3-65's `completeMatch`:
  - **`win`:** credit `payout_kobo` to the winner's wallet (ledger: debit escrow pool, credit winner; debit escrow pool, credit company-margin account for `margin_kobo`). Escrow `status='paid_out'`.
  - **`tie` / `abandoned`:** **full refund** of each `buy_in_kobo` to each player, **no margin taken**, via the **V3-19 refund engine** (ledger reverses the escrow holds). Escrow `status='refunded'`.
  - Settlement is idempotent (keyed on `match_id`); replaying it is a no-op. Status is provider/ledger-confirmed money-truth — the UI shows "paid" only after the ledger confirms, never optimistically.
- **Reconciliation:** a daily job asserts `sum(held escrow) == ledger escrow-pool balance` and that every `paid_out`/`refunded` escrow nets to zero in the ledger. Surface drift to the finance/trust queue.

### S2 — Responsible-play limits + self-exclusion enforcement

- Extend the V3-65 entry gate so a staked match additionally enforces (all server-side, fail-closed, in `assertStakedPlayEligible`):
  - **Daily play limit** per user (count of staked matches in a rolling 24h, per market config); over → `daily_limit_reached`.
  - **Wallet-balance check** before match start (already in S1 hold, but surfaced as a pre-lobby gate too).
  - **Cool-down after consecutive losses** (N consecutive staked losses → mandatory cool-down window before next staked match); over → `cooldown_active`.
  - **Self-exclusion enforcement:** V3-65 created `gaming_self_exclusions`; this pass implements the **set-self-exclusion** server action (a user excludes themselves for a chosen window, per-market; the action is **irreversible until the window elapses** — a hard responsible-play guarantee) and enforces it at the gate (`self_excluded`).
- Limits/cool-downs/exclusion windows are config rows per market (responsible-play is a compliance surface), never hardcoded.

### S3 — Spectator mode

- `packages/gaming-arena/src/components/SpectatorView.tsx` — users watch an in-progress match live via `@henryco/rooms` presence + a **spectator-scoped realtime channel** that streams server state (NOT raw player-private state — a spectator never sees a player's hidden hand). **No betting on outcomes** — spectators cannot place any stake on a match they watch; enforce that there is no code path from spectator view to a stake.
- A `gaming_match_spectators` row tracks join/leave for fair-play audit + telemetry; RLS lets a spectator read only the public match state.
- Emit `henry.gaming.spectator.joined`.

### S4 — Replay (server-state, not video)

- `replayMatch(matchId)` reconstructs the match deterministically from `gaming_match_moves` (`seq`-ordered, validated against `state_hash` per move) + the seed — **server-state replay, no video capture.** `<MatchReplayView>` renders the reconstructed states step-by-step.
- RLS: a replay is visible to the two participants and to trust/fair-play staff; not public by default.
- Emit `henry.gaming.replay.viewed`.

### S5 — Anti-cheat foundation

- **Server-authoritative state is inherited from V3-65** (client cannot manipulate; `submitMove` is the chokepoint). This pass adds **anomaly detection** in `packages/gaming-arena/src/server/anti-cheat.ts`: per-move timing + pattern heuristics (e.g., impossibly fast moves, statistically improbable win streaks, move sequences inconsistent with the visible state). Heuristics are deterministic + tunable per game; they run on `submitMove` and on `completeMatch`.
- A flagged match writes a `gaming_cheat_flags` row (`match_id`, `user_id`, `reason`, `signal_payload jsonb`, `status: open|cleared|upheld`) and emits `henry.gaming.cheating.flagged`. **A flag holds settlement** — payout does not release on a flagged match until trust staff resolve the flag (escrow stays `held`; if upheld, the cheating player forfeits and the honest player is paid / refunded per policy).
- **Manual review queue** for flagged matches, surfaced to trust staff (reuse the `@henryco/trust` queue pattern / staff-role predicate).

### S6 — Fair-play audit

- Random sampling of completed staked matches into a `gaming_fair_play_audits` queue for trust-staff review (replay-assisted via S4). Audit outcome (`clean | flagged | reversed`) is recorded; a reversal triggers the V3-19 refund/correction path through the ledger.
- The V3-65 anti-collusion head-to-head signal feeds the audit sampler (collusion-suspect pairs are over-sampled).

### S7 — Invitations + notifications

- Staked-match invitations carry the buy-in + game; acceptance requires passing `assertStakedPlayEligible`. Route through `@henryco/notifications` / `@henryco/notifications-ui` — never a raw client.

### S8 — Telemetry

Emit via `emitEvent(...)` from `@henryco/observability`, names exactly:

- `henry.gaming.stake.held` — escrow hold confirmed (carries `pot_kobo`, `margin_kobo`, `game_id`, `market`; no PII).
- `henry.gaming.stake.paid_out` — winner payout settled.
- `henry.gaming.spectator.joined`.
- `henry.gaming.replay.viewed`.
- `henry.gaming.cheating.flagged`.

Plus refund/reconciliation-drift logging through the structured logger for finance/trust visibility.

## Out of scope

- **Tournament / bracket formats** → future pass.
- **Real-money cashout beyond the wallet** → V3-69 (payouts); this pass moves money only within `customer_wallets` + escrow.
- **The game catalog, match state machine, move log, matchmaking, profile, lobby, entry-gate base** → owned by V3-65; this pass extends, never re-implements them.
- **KYC vendor integration** → V3-24; consumed only.
- **Tax on winnings** → V3-21 (tax engine); flag the hook, do not implement tax here.

## Dependencies

**Depends on:** V3-65 (catalog, match machine, move log, profile, lobby, gate stack — hard prerequisite), V3-17 (double-entry ledger), V3-19 (refund/reconciliation engine for tie/abandon/reversal), V3-13 (payment-router substrate), V3-24 (KYC levels), D9 (per-division margin). **Blocks:** nothing downstream directly; staked-gaming revenue flows into V3-22 (finance dashboard) and V3-69 (payouts when external cashout is added). This is a leaf of the gaming chain (`V3-12 → V3-65 → V3-66 → V3-94`).

## Inheritance

- **`@henryco/gaming-arena` (V3-65)** — catalog, `gaming_matches`/`gaming_match_players`/`gaming_match_moves`, `gaming_profiles`, matchmaking, lobby, `assertGamingEligible`.
- **V3-17 ledger** — double-entry escrow + payout + margin (escrow-pool + company-margin accounts).
- **V3-19 refund engine** — tie/abandon refunds + fair-play reversals.
- **`@henryco/rooms`** — `gaming_match` transport + spectator realtime channel.
- **`@henryco/trust`** — manual-review + fair-play-audit staff queues.
- **`@henryco/observability`** (`emitEvent`, `writeAuditLog`, `redaction`, structured `logger`), **`@henryco/auth`** (`requireUnifiedViewer`, V3-02 `requireSensitiveAction`), **`@henryco/i18n`**, **`@henryco/config`**, **`@henryco/ui`**, **`@henryco/notifications`**.

## Implementation requirements

### Files
- `packages/gaming-arena/src/server/stakes.ts` (hold/settle), `anti-cheat.ts`, `responsible-play.ts`, `fair-play.ts`, `replay.ts`, `spectator.ts`.
- `packages/gaming-arena/src/components/` — `SpectatorView.tsx`, `MatchReplayView.tsx`, `StakeBuyInPanel.tsx`, `SelfExclusionPanel.tsx`, `ResponsiblePlayNotice.tsx` (+ `index.ts` export).
- `apps/hub/supabase/migrations/<TS>_gaming_arena_stakes.sql` — `gaming_stake_config`, `gaming_match_escrow`, `gaming_match_spectators`, `gaming_cheat_flags`, `gaming_fair_play_audits`, responsible-play config tables; all RLS-enabled; ledger accounts (`gaming_escrow_pool`, `gaming_company_margin`) registered per the V3-17 chart-of-accounts convention.
- `apps/hub/.../app/(account)/play/` — extend the V3-65 surface with the buy-in panel, spectator view, replay view, self-exclusion + responsible-play surfaces.
- Trust-staff routes for the cheat-review + fair-play-audit queues (reuse `@henryco/trust` queue shell).
- `docs/gaming/legal/<market>-stakes-opinion.md` — stakes-specific `L7` per market; `docs/gaming/aml/<market>-aml-review.md` — `L15` AML review per market.

### Trust / safety / compliance
- **D2 binding** + **stakes-specific `L7`** (cash stakes per market, stronger than V3-65's catalog opinion) + **`L15` AML** (gaming-specific monitoring) per market — no stakes enabled in `gaming_stake_config` without all three confirmed.
- **Money invariants (absolute):** integer kobo only; double-entry netting to zero; idempotency key on every stake hold + settlement; status = ledger/provider-confirmed money-truth (never optimistic); no partial holds (all-or-nothing); reconciliation daily; full refund on tie/abandon with **no margin taken**.
- **Responsible play:** daily limits, consecutive-loss cool-downs, irreversible-until-window self-exclusion — all enforced server-side, fail-closed, per-market config.
- **AML monitoring** (`L15`): instrument stake/payout flows for the AML signals the legal review specifies; surface to a monitoring queue. Hashed ids; PII-redacted.
- **Anti-cheat holds settlement** — a flagged match does not release payout until trust resolution.
- **Sensitive-action guard** (`requireSensitiveAction` / `fetchWithSensitiveAction`, V3-02) on stake-hold (money + identity-bound) and on self-exclusion-set.
- **Audit log** (`writeAuditLog`) on every stake hold, settlement, refund, reversal, cheat flag, and self-exclusion.
- **Anti-clone:** ANTI-CLONE Principles 1, 7, 10, 12 — all stake math, margin, anti-cheat heuristics, and rating live server-side behind authenticated APIs.

### Mobile + desktop parity
**Mobile-first.** Buy-in panel, spectator view, replay, self-exclusion, and responsible-play notices must be fully usable on web mobile (safe-area, no keyboard-trap, touch-first) and in the Expo super-app. The money surfaces reuse `@henryco/payment-surface` primitives **for style only** — no payment-behavior change from this pass; the stake mechanics live in `@henryco/gaming-arena`, not in the payment surface.

### i18n
All copy via **`@henryco/i18n`**, namespace **`surface:gaming`** — buy-in labels, escrow/payout/refund status, spectator + replay labels, anti-cheat/fair-play notices, responsible-play + self-exclusion copy, every error message. **Per-market legal + responsible-play + AML disclaimers** are keyed (Pattern A) and must be present per enabled market — a market cannot enable stakes without its disclaimer keys populated. Twelve locales; money amounts formatted via the locale/currency formatter (kobo → display), never string-concatenated.

### Brand & design system
- Brand via **`@henryco/config`** — **"Henry Onyx Live"** surface; receipts/payout records and any compliance copy use legal entity **"Henry Onyx Limited"** (CAC-matched, AML/receipt compliance). Never "Henry & Co.".
- **Fraunces** display + system-sans body; locked design-system tokens only (`--site-*` / `--accent` per the gaming accent in `company.ts`); no ad-hoc hex. Light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed.
- **Zero hardcoded domains** — every link via `henryDomain()` / `henryWebRoot()` / `getAccountUrl()`.

## Validation gates

1. **Standard CI** green: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
2. **D2 explicitly authorizes stakes per market** + stakes-specific `L7` + `L15` AML confirmed for every market in `gaming_stake_config`.
3. **Stake escrow + payout ledger correctness** (~16–20 cases): hold debits both wallets atomically into escrow; insufficient balance aborts with zero debits; no partial holds; win pays `pot - margin` to winner + `margin` to company; tie/abandon refunds in full with **no margin**; every flow nets to zero in the double-entry ledger; settlement is idempotent; reconciliation asserts escrow-pool balance == sum of held escrows.
4. **Idempotency** — replaying a stake hold or settlement is a no-op (keyed on `match_id`).
5. **Anti-cheat triggers on synthetic anomaly** — a planted impossibly-fast/inconsistent move sequence flags the match, writes `gaming_cheat_flags`, and **holds settlement** until trust resolution.
6. **Responsible-play limits enforced** — daily limit blocks the Nth match; consecutive-loss cool-down blocks; balance check blocks.
7. **Self-exclusion flow** — set is irreversible until window elapses; the gate blocks staked play during exclusion.
8. **Spectator** — sees public state only (never a player's hidden hand); has no path to place a stake.
9. **Replay** — deterministically reconstructs from the move log + seed; `state_hash` validates each step; visible only to participants + staff.
10. **Fair-play audit** — random sampler enqueues completed staked matches; collusion-suspect pairs over-sampled; a reversal routes through V3-19.
11. **RLS verification** — escrow/spectator/cheat-flag/audit rows visible only to the right principals; no client write to escrow or move log.
12. **Real-browser UI pass** — buy-in, spectator, replay, self-exclusion in light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed.
13. **Telemetry baseline** — the five `henry.gaming.*` events fire with correct shape and no PII.

## Deployment gate
- D2 resolved to authorize stakes; stakes-specific `L7` signed **per market**; `L15` AML reviewed **per market**; no market in `gaming_stake_config` lacking both.
- All validation gates green; owner review (P10 Money/Identity/Compliance — the highest-stakes surface in Phase G).
- Reconciliation job live and green.
- **60-day soak in a single authorized test market with a capped buy-in** (low `max_buy_in_kobo`) before any wider enablement or cap increase. Full refund/reversal paths exercised during soak.

## Final report contract
`.codex-temp/v3-66-gaming-arena-stakes-spectator-replay/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion. The validation-evidence section must include the ledger double-entry proof (every flow nets to zero) and the reconciliation result; deferred items must note tournaments, external cashout (V3-69), and tax-on-winnings (V3-21).

## Self-verification
- [ ] D2 read in `docs/v3/DECISIONS-REQUIRED.md`; stakes ship only where stakes-specific `L7` + `L15` AML are confirmed; if D2 = defer, this pass does not ship.
- [ ] Wallet-funded stakes held in escrow against the V3-17 double-entry ledger; integer kobo; idempotent; no partial holds; balance-checked.
- [ ] Win pays `pot - margin` to winner + margin to company; tie/abandon refunds in full with no margin via V3-19; settlement idempotent; daily reconciliation green.
- [ ] Money is ledger-confirmed truth, never optimistic; `@henryco/payment-surface` used style-only (no behavior change).
- [ ] Responsible-play: daily limit + consecutive-loss cool-down + irreversible self-exclusion, all server-side fail-closed.
- [ ] Spectator sees public state only with no stake path; replay reconstructs deterministically from the move log + seed.
- [ ] Anti-cheat anomaly detection flags synthetic anomalies and holds settlement; manual review + fair-play audit queues for trust staff.
- [ ] Sensitive-action guard on stake-hold + self-exclusion; audit log on every money + exclusion + flag event.
- [ ] All copy via `@henryco/i18n` `surface:gaming` (incl. per-market legal/AML/responsible-play disclaimers); brand via `@henryco/config` (Henry Onyx Live / Henry Onyx Limited); zero hardcoded strings/domains; Fraunces + locked tokens; light+dark, mobile+desktop, CLS≈0, contrast not regressed.
- [ ] Five telemetry events (`henry.gaming.stake.held/.paid_out`, `.spectator.joined`, `.replay.viewed`, `.cheating.flagged`) fire with no PII.
- [ ] Report written with ledger double-entry + reconciliation proof and deferred-items handoff (tournaments, V3-69 cashout, V3-21 tax).
