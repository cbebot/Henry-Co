# Henry Onyx Live — Legal-Gate Map

**Pass:** V3-GAMING-DESIGN-01 (design only)
**Compiled:** 2026-06-21
**Companion docs:** [`ARCHITECTURE.md`](./ARCHITECTURE.md) · [`PHASED-PLAN.md`](./PHASED-PLAN.md) · cross-references `docs/v3/LEGAL-AND-BUSINESS.md` and `docs/v3/DECISIONS-REQUIRED.md`.

> **Not legal advice.** This is an engineering map of *which capabilities are coupled to which legal prerequisites*, so the build ships the un-gated half now and keeps the gated half dormant until counsel clears it. Every legal classification below (especially "free play is not gambling" and "game of skill") is a **design assumption to be confirmed by counsel per market** — the architecture is built so that confirmation, not code, is the thing on the critical path.

---

## The dividing line, in one sentence

Gambling = **consideration** (money in) + **chance** + **prize** (money out). The free-play foundation removes consideration *and* prize, so it is **not gambling** and ships now; the real-money layer adds both back, so it is **gated** behind per-market legal sign-off.

---

## What ships **now** (no legal gate)

These are the **Pass 1 + Pass 2** capabilities. They involve no stake and no prize, so the gambling-licensing apparatus (`L7`, `L15`, `L8`) does **not** apply.

| Capability | Why it needs no gambling gate | Still-required (light) prerequisites |
|---|---|---|
| Free practice play (vs. opponent or matchmaking) | No consideration, no prize | Standard ToS + acceptable-use; age-appropriate content note |
| Ranked-for-pride PvP + Elo + leaderboards | Reputation is not a "prize of value" | — |
| Provably-fair commit–reveal + public verifier | A fairness *proof*, not a money mechanic | — |
| Server-authoritative match engine + replay (free matches) | Pure game integrity | — |
| Anti-cheat / anti-collusion (free tier) | Trust & safety, not compliance-gated | NDPR-aware handling of any flag metadata (hashed ids, `redaction`) |
| Lobby, invites, profiles, presence | Social, no money | — |

**The only non-engineering prerequisite for the free launch** is a counsel glance at the **ToS / acceptable-use** copy (a `L6`-family item — terms, which the platform needs anyway) and confirmation that free, no-prize skill play is outside the gambling regime in the launch market. Neither blocks the build; both can run in parallel with Pass 1.

> **Guardrail:** "free" must stay genuinely free — **no loot-box-style paid randomness, no entry fee, no convertible-to-cash reward, no "buy more lives".** Any of those reintroduces consideration and/or prize and would drag the foundation across the line. The architecture enforces this by keeping the free path entirely off the money seam (`ARCHITECTURE.md §12`).

---

## What stays **dormant** until counsel clears it (the real-money layer)

These are the **Pass 3+** capabilities. Each is built (designed, code-ready, flag-off, migration committed-NOT-applied) but **must not be activated** in a market until its legal prerequisites are countersigned for that market.

| Gated capability | Legal prerequisite (per market) | Source |
|---|---|---|
| Wallet-funded match stakes + escrow + rake | **`L7` stakes-specific legal opinion** — must classify *cash-staked* PvP as a permitted game of skill in that market (a stronger bar than a catalog opinion) | `LEGAL-AND-BUSINESS.md` L7; `DECISIONS-REQUIRED.md` D2 |
| Holding player stakes in custody | **`L3` money-handling posture** (provider-escrow model, per the platform's existing stance) + **`L15` AML program** (gaming-specific monitoring) | `LEGAL-AND-BUSINESS.md` L3, L15 |
| Age-gated entry to staked play | **18+ verification capability** — *and a net-new build:* the KYC vault has **no age/DOB signal today** (DOB is denylisted); a derived `over18` boolean must be added (`ARCHITECTURE.md §8.2`) | `kyc-vault` findings; `LEGAL-AND-BUSINESS.md` L5 |
| Operating a money-gaming surface | **`L8` gaming-specific insurance** confirmed per launch market | `LEGAL-AND-BUSINESS.md` L8 |
| Per-market enablement of any staked game | A counsel-signed **per-game `L7`** skill classification + an enablement row asserting `L7`+`L15`+`L8` present | `v3-65`/`v3-66` prompts; `PHASED-PLAN.md` Pass 3/6 |
| Money tournaments with prizes | Inherit the full stakes gate above | `PHASED-PLAN.md` Pass 4 |
| Winnings tax | **Hook only** — `V3-21` tax engine owns it; flag, don't implement in gaming | `v3-66` prompt out-of-scope |
| External cashout (beyond the wallet) | **`V3-69` payouts** + its own banking/licensing (`L12`, and `L19` if cross-border) | `LEGAL-AND-BUSINESS.md` L12/L19 |

---

## The D2 decision and what this map changes

`D2` ("Gaming-arena legal posture per market", `docs/v3/DECISIONS-REQUIRED.md`) was **answered 2026-05-28 as Option B — defer gaming entirely from V3**. The owner's reasoning was *specifically about the money layer* (staking, margin, licensing, AML, exclusion). This design proposes the owner move to a **refined Option C**:

- **Build & launch the free foundation now** (the deferral reasoning does not apply to no-prize skill play).
- **Keep the money layer dormant**, activated per market only on the legal trio above.

**Action required:** the owner ratifies the refined D2 (update both `DECISIONS-REQUIRED.md` and the stale "PENDING" note in `orientation/architect-briefing.md`). Until ratified, **no build pass starts** — this design pass changes a recorded owner decision and must be owner-approved first (`ARCHITECTURE.md §2.1`).

---

## How the gate is enforced in code (so "dormant" is real, not a promise)

The legal gate is not a comment — it is structural (`ARCHITECTURE.md §12`):

1. **Two flags:** `GAMING_ARENA_ENABLED` (free) is independent of `GAMING_REAL_MONEY_ESCROW` (money). The money flag is paired with an `isGamingEscrowReady()` predicate (legal-enablement row present + payment DB configured + FL2 live + age signal built) — flipping the flag without readiness does nothing.
2. **Per-market enablement rows:** `gaming_stake_config.enabled` defaults `false`; a market is staked only when a row asserts `L7`+`L15`+`L8` are on file. Geofence resolves server-side from the KYC-verified country (never client-supplied).
3. **Fail-closed entry gate:** `assertCanStake` blocks on missing KYC level, missing `over18`, off-geofence, or responsible-play limits — every denial typed, branded, PII-free.
4. **Separate, later migration:** the money tables (`ARCHITECTURE.md §3.4`) ship in a distinct gated migration; the free arena runs with them absent.

The effect: counsel reviews the money layer at their pace; the free arena is already live; the day a market clears, the owner sets the enablement row + flag and the (already-built, already-soaked) money layer turns on — with no rework to the foundation.

---

## Self-check

- [x] Clear split: free-now capabilities vs. legally-gated capabilities.
- [x] Each gated capability names its per-market legal prerequisite, cross-referenced to `LEGAL-AND-BUSINESS.md` (L3/L5/L7/L8/L15) and D2.
- [x] The net-new `over18` KYC build is flagged as a hard money-layer dependency (no age signal exists today).
- [x] The D2 change (Option B → refined Option C) and the owner-ratification requirement are explicit.
- [x] "Dormant" is shown to be structurally enforced (flags + enablement rows + fail-closed gate + separate migration), not merely asserted.
- [x] Free-play guardrail (no paid randomness / entry fee / convertible reward) stated so the foundation can't drift across the gambling line.
