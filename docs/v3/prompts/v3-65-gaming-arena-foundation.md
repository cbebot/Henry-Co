# V3-65 — Studio Live / Gaming Arena: Foundation

**Pass ID:** V3-65 | **Phase:** G | **Pillar:** P10
**Deps:** V3-13, V3-17, V3-24 | **Effort:** XL | **Parallel:** NO (V3-65 → V3-66) | **Owner gate:** D2 | **Risk:** Money, Identity, Compliance

## Role
V3 Gaming Arena engineer (foundation). Execute, then stop.

## Project
Standard.

## Audit summary
@henryco/rooms package skeleton exists. V3 vision P10 specifies original PvP game catalog (no copyrighted IP), wallet-funded stakes with company margin, moderation, anti-cheat foundation.

## **GATED on D2 owner sign-off + L7 legal opinion letters per market**.

## Mandatory scope

1. **Original game catalog** (no copyrighted IP — design from scratch):
   - 3 launch games: card-game (Whot variant with original mechanics), trivia, board-game (Ludo variant with original board).
   - Each game has rules doc reviewed by legal counsel.

2. **PvP mechanic foundation**:
   - Matchmaking by skill rating + buy-in level.
   - Game session state machine (lobby → in-progress → completed/abandoned).
   - Anti-collusion: track repeated head-to-head between same users.

3. **Profile**: per-user gaming profile (wins, losses, rating, achievements).

4. **No stakes yet** in this pass — V3-66 adds stakes.

5. **Lobby + invitations**: see other players online; invite by handle.

6. **Telemetry** — `henry.gaming.session.started`, `henry.gaming.session.completed`, `henry.gaming.match.completed`, `henry.gaming.profile.updated`.

## Out of scope
- Stakes + payouts (V3-66).
- Spectator + replay (V3-66).
- Anti-cheat depth (V3-66 + future).

## Dependencies
V3-13, V3-17, V3-24. Blocks V3-66.

## Inheritance
@henryco/rooms; @henryco/payment-router (for V3-66); @henryco/ai-router (for moderation).

## Trust / safety / compliance
- L7 legal opinion per market.
- L8 insurance (gaming-specific).
- KYC L4 verification required per V3-24.
- Age verification (18+ minimum).
- Geofencing — only accessible in markets where legal.
- ANTI-CLONE Principles 1, 7, 10, 12.

## Mobile + desktop parity
Mobile-first for gaming.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **D2 + L7 verified per launch market**.
3. **Game rule audit** — each game rule doc reviewed by counsel.
4. **Matchmaking smoke**.
5. **Geofencing** enforced.

## Deployment gate
- D2 + L7 signed.
- 30-day soak in single test market.

## Final report contract
Standard.

## Self-verification
- [ ] 3 original games designed + rule-doc reviewed.
- [ ] Matchmaking + state machine.
- [ ] Profile + lobby + invitations.
- [ ] L7 + L8 verified.
- [ ] Age + geo gates.
- [ ] 4 new telemetry events.
- [ ] Report written.
