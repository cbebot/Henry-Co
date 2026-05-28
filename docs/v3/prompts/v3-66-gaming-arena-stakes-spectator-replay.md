# V3-66 — Gaming Arena: Stakes + Spectator + Replay

**Pass ID:** V3-66 | **Phase:** G | **Pillar:** P10
**Deps:** V3-65 | **Effort:** XL | **Parallel:** NO | **Owner gate:** D2 | **Risk:** Money, Identity, Compliance

## Role
V3 Gaming Arena engineer (stakes phase). Execute, then stop.

## Project
Standard.

## Audit summary
Extends V3-65 with wallet-funded stakes, spectator mode, replay, anti-cheat foundation, fair-play audit.

## **GATED on D2 + L7**.

## Mandatory scope

1. **Wallet-funded stakes**:
   - Per-match buy-in (min/max per game).
   - Buy-in held in escrow_pool ledger entry (per V3-17).
   - Company margin deducted from each match (per D9).
   - Winner receives net buy-in.
   - Tie/abandoned: refund.

2. **Match limits**:
   - Daily play limit per user (responsible play).
   - Wallet-balance check before match start.
   - Cool-down after consecutive losses.

3. **Spectator mode**: users can watch ongoing matches (no betting on outcomes).

4. **Replay**: every match saved (server-side state replay; not video).

5. **Anti-cheat foundation**:
   - Server-authoritative game state (client cannot manipulate).
   - Anomaly detection on match patterns (e.g., impossibly fast moves).
   - Manual review queue for flagged matches.

6. **Fair-play audit**: random match audits by trust staff.

7. **Telemetry** — `henry.gaming.stake.held`, `henry.gaming.stake.paid_out`, `henry.gaming.spectator.joined`, `henry.gaming.replay.viewed`, `henry.gaming.cheating.flagged`.

## Out of scope
- Tournament format (future).
- Real-money cashout beyond wallet (uses V3-69 payouts).

## Dependencies
V3-65.

## Inheritance
V3-65 game catalog; V3-17 ledger; V3-19 refunds.

## Trust / safety / compliance
- L7 legal opinion explicitly covers cash stakes per market.
- L15 AML — gaming-specific monitoring.
- Responsible-play rules enforced (daily limits, cool-downs).
- Self-exclusion mechanism (per market).
- ANTI-CLONE Principles 1, 7, 10, 12.

## Mobile + desktop parity
Mobile-first.

## i18n
Per locale + per-market legal disclaimers.

## Validation gates
1. Standard CI.
2. **D2 explicitly authorizes stakes per market**.
3. **Stake escrow + payout** ledger correctness.
4. **Anti-cheat triggers** on synthetic anomaly.
5. **Responsible-play limits** enforced.
6. **Self-exclusion** flow.

## Deployment gate
- L7 stakes-specific signed per market.
- L15 AML reviewed.
- 60-day soak in test market with capped buy-in.

## Final report contract
Standard.

## Self-verification
- [ ] Stakes + escrow + payout.
- [ ] Spectator + replay.
- [ ] Anti-cheat triggers.
- [ ] Fair-play audit queue.
- [ ] Responsible-play limits + self-exclusion.
- [ ] 5 new telemetry events.
- [ ] L7 stakes-specific signed.
- [ ] Report written.
