# Henry Onyx Live — Phased Build Plan

**Pass:** V3-GAMING-DESIGN-01 (design only)
**Compiled:** 2026-06-21
**Companion docs:** [`ARCHITECTURE.md`](./ARCHITECTURE.md) · [`GAME-CATALOG.md`](./GAME-CATALOG.md) · [`LEGAL-GATE-MAP.md`](./LEGAL-GATE-MAP.md)

This is the sequence of build passes that follow this design. It **refines the existing V3 plan**: the master plan already allocates `V3-65` (gaming-arena-foundation) and `V3-66` (gaming-arena-stakes) under Pillar **P10**, Phase **G**, gated on decision **D2** (`docs/v3/PASS-REGISTER.md`, `docs/v3/prompts/v3-65-*.md`, `v3-66-*.md`). This plan keeps those anchors and refines their scope to the free-play-first posture, then adds the social, real-time, and catalog-expansion passes the original two prompts deferred to "future".

> **The governing change from the original prompts:** V3-65 originally bundled the KYC-L4 / age / geofence / legal-opinion gate *into* the money-free foundation. This plan **pulls that gate out** — Pass 1 (free play) ships with **no money, no KYC, no geofence, no gambling legal gate**; the entire identity/age/legal apparatus moves to Pass 3 (real-money), where it belongs. See `ARCHITECTURE.md §2.1, §8, §12`.

---

## At-a-glance

| Pass | Name | Maps to | Money? | Risk class | Legal gate | Owner gate | Status |
|---|---|---|---|---|---|---|---|
| **0** | Gaming arena architecture (this design) | **V3-GAMING-DESIGN-01** | No | Low | None | D2 ratification | ▶ this pass |
| **1** | Free-play foundation | refines **V3-65** | **No** | **Low** | **None** | D2 → refined Option C | Ready to build on ratification |
| **2** | Fairness depth + catalog + free anti-cheat | **V3-65.B** (new sub-pass) | No | Low–Med | None | — | After Pass 1 |
| **3** | Real-money match-escrow | refines **V3-66** | **Yes** | **M / I / C** | **L7 + L15 + L8 per market** | D2 (stakes) | Dormant until legal |
| **4** | Social: spectator · replay · tournaments | **V3-GAMING-SOCIAL-01** (new) | Mixed | Med (tournaments: M/I/C) | Tournaments-with-prizes gated | — | After Pass 3 (or replay after Pass 2) |
| **5** | Real-time games | **V3-GAMING-RT-01** (new) | Inherits | Med | Inherits | — | Later phase |
| **6** | Catalog expansion (more games) | **V3-GAMING-CAT-0N** (new) | Inherits | Low–Med | Per-game `L7` | — | Ongoing |

Risk-class legend (per `docs/v3/PASS-REGISTER.md`): **M** = money-touching, **I** = identity-touching, **C** = compliance-touching. M/I/C passes get the extra ANTI-CLONE Principle 12 review.

---

## Pass 1 — Free-Play Foundation (refines V3-65)

**The launchable product.** Ships on registration; no money, no legal lead time.

**Scope:**
- New package `@henryco/gaming-arena` (the `. / ./server / ./types` shape; pure rules + `server-only` authoritative half — `ARCHITECTURE.md §5.1`).
- **Game catalog** with the first **two** titles: **Onyx Lines** (zero-chance flagship — needs no RNG, simplest flawless build) and **Onyx Cards** (exercises the provably-fair engine). Onyx Quiz can land in Pass 1 or Pass 2 (it needs the question bank). See `GAME-CATALOG.md`.
- **Server-authoritative match state machine** (two-layer: in-process `LEGAL_TRANSITIONS` + DB `BEFORE UPDATE` trigger), append-only `gaming_match_moves`, deterministic `state_hash`, `submitMove` chokepoint (`ARCHITECTURE.md §5`).
- **Provably-fair commit–reveal engine** + public verifier (`ARCHITECTURE.md §6`) — exercised by Onyx Cards; Onyx Lines proves fairness with no RNG at all.
- **Matchmaking** (skill + queue) with the `gaming_head_to_head` anti-collusion substrate tracked from day one.
- **Per-user `gaming_profiles`** (Elo, record, public handle) + `gaming_profiles_public` view + **leaderboards** (read model).
- **Lobby + invite-by-handle** + presence; invites via `@henryco/notifications`.
- **Transport:** Supabase Realtime per-match channel (`postgres_changes` + `broadcast` + `presence`), with the shell provider's reliability discipline (`ARCHITECTURE.md §4.2`). **No `@henryco/rooms`/WebRTC.**
- **Surface:** `apps/account/app/(account)/play/` (Register-L) + `apps/super-app` (mobile); add `gaming` to `PUBLIC_DIVISION_KEYS` + a "Henry Onyx Live" division entry in `@henryco/config`.
- **Entry gate:** `assertCanPlayFree` only (logged-in + not self-excluded). **No KYC, no age, no geofence.**
- **i18n:** `packages/i18n/src/arena-copy.ts` (typed copy + EN baseline + 11 locale overrides), `surface:gaming`, 12 locales.
- **Telemetry:** the four free `henry.gaming.*` events + audit on start/complete/abandon (`ARCHITECTURE.md §11`).
- **Flag:** `GAMING_ARENA_ENABLED` (the only flag this pass needs).
- **Tests/CI:** `node:test`+tsx for the pure rules + fairness verifier + state reducer; the new gaming-RPC grant invariant + class-drift pass; `prove-*.mts` for commit–reveal end-to-end; migration validated in throwaway PGlite outside the repo.

**Dependencies:** the account super-app + `@henryco/{config,ui,i18n,auth,observability,notifications,trust}` (all exist on `origin/main`). **No dependency on the money spine or KYC.**
**Risk class:** Low (no money; no PII beyond a chosen public handle).
**Legal gate:** **None** — free, no-prize skill play is not gambling (`LEGAL-GATE-MAP.md`). Standard ToS / acceptable-use + an age-appropriate content note suffice; counsel should still glance at the ToS, but nothing blocks the build.
**Owner gate:** D2 ratified to refined Option C (`ARCHITECTURE.md §2.1`).
**Migration:** committed-NOT-applied; apply owner-gated via `supabase db query --linked`.

---

## Pass 2 — Fairness depth + catalog + free-tier anti-cheat (V3-65.B)

Hardens the free product before money is ever considered.

**Scope:** Onyx Quiz + its Henry-Onyx-owned question bank (if not in Pass 1); the **server-side replay engine** (deterministic re-execution of the move log) + a `ReplayView` for finished free matches; the **statistical anti-cheat detectors** (move-timing/entropy, illegal-state, Elo-anomaly, collusion-pair graph) hosted in the moderation deterministic-floor→verdict-lattice→human-gate framework (`ARCHITECTURE.md §7`); the trust-staff cheat-review queue (Register-D); profile/achievement depth; ranked seasons.
**Dependencies:** Pass 1.
**Risk class:** Low–Medium (no money; introduces trust-staff tooling).
**Legal gate:** None.

---

## Pass 3 — Real-Money Match-Escrow (refines V3-66) — DORMANT until legal

**Money on the board.** Built to money-grade discipline; **activated per market only on legal sign-off.** This is the refined V3-66.

**Hard prerequisites (all must be true before activation):**
- **D2 authorizes stakes** (refined Option C explicitly allows the money layer per market).
- **`L7` stakes-specific legal opinion** countersigned **per market** (stronger than a catalog opinion — it must classify *cash-staked* PvP as a game of skill in that market).
- **`L15` AML review** on file per market; **`L8` gaming insurance** confirmed per market.
- **The net-new `over18` age signal** is built into the KYC layer (`ARCHITECTURE.md §8.2`) — without it there is no age gate, and there is no DOB/age in the vault today.
- **FL2 money spine live in prod** (per migration headers it is committed-NOT-applied today — a real dependency, not just a code one).

**Scope:**
- The **match-escrow** on the FL2 ledger: `match_escrow_liability` account, `post_match_stake` / `settle_match` / `refund_match` guarded RPCs in `games_private`, all balanced double-entry, idempotent, kobo, with the over-payout-impossible trigger and `processed_match_results` dedup (`ARCHITECTURE.md §9`). **House is never a counterparty** (escrow = liability; rake = the only company credit).
- **`gaming_stake_config`** per (game, market) with `margin_bps` (D9) and `enabled=false`.
- **Staking entry gate** `assertCanStake`: KYC ≥ L3 + `over18` + geofence + responsible-play limits (daily cap, consecutive-loss cool-down) + wallet balance, fail-closed.
- **Responsible gaming:** irreversible-until-window self-exclusion (enforced server-side), daily limits, cool-downs — per-market config, not hardcoded.
- **AML instrumentation** of stake/payout flows per the `L15` review; **reconciliation** extended to assert escrow nets to zero.
- **Anti-cheat holds settlement:** an open flag keeps escrow `held` until trust resolution.
- **Sensitive-action guard** on stake-hold + self-exclusion; audit on every money event.
- **Flag:** `GAMING_REAL_MONEY_ESCROW` + the `isGamingEscrowReady()` readiness predicate (legal-enablement row + payment DB + FL2 live + age signal).
- **Soak:** 60-day soak in a single authorized market at a **capped buy-in** before any wider enablement; full refund/reversal paths exercised.

**Dependencies:** Pass 1, Pass 2 (anti-cheat), V3-13 (payment-router), V3-17 (ledger, live), V3-19 (refund engine), V3-24/`@henryco/kyc` + the `over18` build, D9 (margin).
**Risk class:** **M / I / C** (the highest-stakes surface in the gaming chain).
**Legal gate:** **L7 (stakes) + L15 + L8 per market** — no market enabled without all three (`LEGAL-GATE-MAP.md`).

---

## Pass 4 — Social: spectator · replay · tournaments (V3-GAMING-SOCIAL-01)

**Scope:** spectator mode (public state only — never a player's hidden hand; **no path from spectating to placing a stake**); replay sharing; **tournaments / brackets**. Replay of *free* matches can land as early as Pass 2; spectating of free matches is free; **tournaments that award money prizes inherit the full money/legal gate** (they are a money surface).
**Dependencies:** Pass 1/2 (replay, free spectating); Pass 3 (money tournaments).
**Risk class:** Medium; money tournaments are M/I/C.
**Legal gate:** none for free spectating/replay; prize tournaments inherit Pass 3's gate.

---

## Pass 5 — Real-time games (V3-GAMING-RT-01)

**Scope:** real-time / reflex games. **This is the one place `@henryco/rooms` (WebRTC) + the `gaming_match` `RoomKind` extension are warranted** — for low-latency transport and optional voice/video (`ARCHITECTURE.md §4.3`). Real-time staking (if any) inherits Pass 3's money/legal apparatus and adds latency-fairness + anti-cheat depth specific to reflex play.
**Dependencies:** Pass 1–3.
**Risk class:** Medium (Money/Identity/Compliance if staked).
**Legal gate:** inherits.

---

## Pass 6 — Catalog expansion (V3-GAMING-CAT-0N)

**Scope:** additional original skill games on the proven foundation. Each new title: original design + counsel-reviewed rules doc; free immediately; **a per-game `L7` skill classification** before that game is staked in a market.
**Risk class:** Low–Medium.
**Legal gate:** per-game `L7` for staking only.

---

## Sequencing & critical path

```
V3-GAMING-DESIGN-01 (this) ──▶ Pass 1 (free foundation) ──▶ Pass 2 (depth/anti-cheat)
                                      │                              │
                                      └──────────────┬───────────────┘
                                                     ▼
   (legal: L7 stakes + L15 + L8 per market; build: over18 signal; ops: FL2 live)
                                                     ▼
                                              Pass 3 (real-money escrow) ──▶ Pass 4 money tournaments
                                                     │
   Pass 4 (free replay/spectator) can precede Pass 3 │
                                                     ▼
                                              Pass 5 (real-time) ──▶ Pass 6 (more games, ongoing)
```

- **Pass 1 + 2 are free and unblocked** the moment D2 is ratified to refined Option C. They are the immediate build.
- **Pass 3 is the legal cliff.** Everything money-related waits behind it. Its own prerequisites (the `over18` KYC build, FL2-live, the per-market legal trio) can be worked **in parallel** with Pass 1/2 so the money layer is ready to drop in the day legal clears.
- Each pass follows the canonical "new vertical" recipe (`ARCHITECTURE.md §5`, division-precedent): package vs app split, idempotent migration, default-deny RLS, flag-gated, i18n'd, tested, committed-NOT-applied, gated apply.

---

## Self-check

- [x] Pass 1 = free-play foundation, launchable on registration, **no money, no legal gate**, decoupled from the money layer.
- [x] Later passes = real-money escrow (legally gated), social/spectating/tournaments, real-time, more games.
- [x] Each pass carries deps, risk class, legal gate, and owner gate.
- [x] Mapped onto the existing V3 plan (refines V3-65/V3-66; new sub-passes named consistently with the `V3-NN`/`V3-NN.A` convention).
- [x] The legal cliff (Pass 3) and its parallel-workable prerequisites are explicit.
