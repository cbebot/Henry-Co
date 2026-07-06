# Henry Onyx Live — Gaming Arena (Design Index)

> **LICENCE STATUS UPDATE (2026-07-06, per the owner).** The gaming/betting **licence has been
> obtained**. These docs were written earlier (2026-06-21), when the licence was still a
> prerequisite, so every "requires a gaming licence" / "dormant until legal sign-off" /
> "licensing not yet held" statement below is **superseded on the licence itself** — that gate is
> now satisfied. The remaining gates for real-money play are unchanged and still apply: the money
> layer must be **built** (it is still designed-only in these docs), and each market is enabled
> only after its **per-market** legal confirmation (age-verification, AML, geofence) — the licence
> is company-held, but market-by-market rollout and the responsible-gaming controls remain. Update
> the specific lines below in a later editorial pass; this note is the authoritative correction.

**Pass:** V3-GAMING-DESIGN-01 — gaming arena architecture + phased build plan (**design only**: no feature code, no migration in this pass).
**Compiled:** 2026-06-21 · Opus 4.8 (1M context), max effort.
**Status:** Draft for owner + counsel review. **Owner must ratify the refined D2 decision before any build pass starts** (see `ARCHITECTURE.md §2.1`).

This directory is the blueprint the gaming build passes follow. It designs a **provably-fair, skill-based, server-authoritative PvP arena with original games**, built on Henry Onyx's existing money + KYC + security spine. The differentiator is **trust/fairness**, not graphics.

The design separates two layers cleanly:
- **Free-play foundation** — original skill games, server-authoritative, provably fair, **no money, no legal gate** — ships on registration while counsel reviews the rest.
- **Real-money layer** — wallet-funded match-escrow, 18+/KYC-gated, responsible-gaming controlled — **designed in full but dormant**, activated per market only on legal sign-off.

---

## Read order

1. **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** — the full architecture: surface placement & two-register design, data model, transport (turn-based-first via Supabase Realtime), the server-authoritative game-logic model, the provably-fair commit–reveal engine, the anti-cheat/anti-collusion engine, KYC/age gating, the future match-escrow on the money spine, security posture (RLS + CI invariants), and the free/money decoupling. Grounded in the live `origin/main` tree with file/symbol/RPC citations.
2. **[`GAME-CATALOG.md`](./GAME-CATALOG.md)** — the first three original turn-based skill games (**Onyx Lines**, **Onyx Cards**, **Onyx Quiz**): concept, full rules, and exactly how **skill** determines the winner (the legal-classification requirement).
3. **[`PHASED-PLAN.md`](./PHASED-PLAN.md)** — the build passes: Pass 1 = free-play foundation (refines V3-65), later passes = real-money escrow (refines V3-66, legally gated), social/spectator/tournaments, real-time, more games. Each with deps, risk class, and legal/owner gates.
4. **[`LEGAL-GATE-MAP.md`](./LEGAL-GATE-MAP.md)** — exactly what ships free now vs. what stays dormant until counsel clears it, and how the gate is structurally enforced.

---

## How this fits the existing V3 plan

- Pillar **P10** (Studio Live / Gaming Arena), Phase **G** (Product Expansion). The master plan already has `V3-65` (foundation) and `V3-66` (stakes) gated on decision **D2** (`../PASS-REGISTER.md`, `../prompts/v3-65-*.md`, `../prompts/v3-66-*.md`).
- This pass **refines** those: it decouples the free foundation from the gambling legal gate (V3-65 originally bundled them), corrects the turn-based transport (Supabase Realtime, not `@henryco/rooms` WebRTC), specifies the provably-fair engine, grounds the match-escrow in the actual FL2 ledger primitives, and adds the social/real-time/catalog passes the originals deferred.
- It proposes updating **D2** from "Option B (defer entirely)" to a **refined Option C** (free now, money gated). See `LEGAL-GATE-MAP.md`.

## Key design decisions (one line each)

- **Surface:** a new `@henryco/gaming-arena` package + a `(account)/play` surface in `apps/account` (+ `apps/super-app` mobile), Register-L. Not a standalone app.
- **Transport:** Supabase Realtime (`postgres_changes` + `broadcast` + `presence`) on the move log for turn-based; `@henryco/rooms`/WebRTC reserved for the later real-time phase.
- **Fairness:** commit–reveal RNG + public verifier; the flagship (Onyx Lines) uses zero randomness; all randomness is symmetric.
- **Money (future):** match-escrow as a *clone* of the FL2 ledger — `match_escrow_liability` as a liability account so **the house is never a counterparty**; balanced, idempotent, kobo, reconciled.
- **Identity:** verdict-only consumption of `@henryco/kyc`; a derived `over18` signal is **net-new** and gates staking only; free play needs no KYC.
- **Security:** default-deny RLS, no `using(true)` policy (class-drift CI guard), service-role-only RPCs in a `games_private` schema for escrow.
