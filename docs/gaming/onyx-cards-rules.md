# Onyx Cards — Rules (counsel-reviewable)

**Game:** Onyx Cards · **Division:** Henry Onyx Live · **Legal entity:** Henry Onyx Limited
**Pass:** V3-GAMING-01 (free-play foundation). This is the `L7` input artifact for any future per-market skill classification of *staked* play; in the free tier there is no stake and no prize.

## Summary
A two-player simultaneous-selection duel. **Both players hold the identical hand** and compete over a public prize track. The hands are mirror-dealt and the prize sequence is the same for both, so the only variable is decision quality — "the same problem, solved by two minds." The single chance element (prize *order*) is **symmetric** and **provably fair**.

## Components
- Each player holds an identical hand of value cards **1–10** in their own colour (mirror-dealt — no luck of the draw).
- A prize track of 10 prize cards, each with a published point value, in an order fixed at match start. Each prize also carries one of three **facets**.

## The one random element, made fair
The prize order is produced by a **commit–reveal** engine:
1. Before the match the server publishes `commitment = SHA-256(serverSeed)`.
2. Each player contributes a `clientSeed`.
3. The order is derived deterministically as `HMAC-SHA256(serverSeed, clientSeedA ‖ clientSeedB)`.
4. At match end the server reveals `serverSeed`; anyone can confirm `SHA-256(revealed) == commitment` and reproduce the exact order.

Both players face the **same** order, so the randomness confers no edge — it is shared, transparent terrain that skill is exercised over. (Edge-safe Web Crypto; the verifier runs in the player's own browser.)

## Turn structure
1. Ten rounds. Each round both players **secretly commit** one card (the server hides each commit from the opponent until both are in).
2. **Reveal:** the higher value wins the round's prize points; both committed cards are spent.
3. **Facet bonus:** if the winning card's facet matches the prize's facet, the winner scores a bonus.
4. **Vein carry:** equal commits award nothing — the prize carries onto the next round, raising its stakes.
5. **Shadow bid (once per match):** secretly double a committed card; if you *lose* the round anyway, the doubled card is revealed, leaking information. A bounded, high-skill bluff.

## Winning
Highest total prize points after 10 rounds. Ties break deterministically: the higher individual prize won, then the fewest card-value spent on lost rounds. Never random.

## Why skill predominates
Both players begin with **identical hands** and **identical, public information** about the prize sequence. No card is drawn during play; the only hidden element is the current round's simultaneous commit, which both face symmetrically. The outcome is a function of sequencing, tempo, prediction, and bluff management. The lone stochastic element (prize order) is symmetric and provably fair, so it cannot be the cause of one player winning over the other; over a best-of-N the residual variance shrinks further.

## Integrity
- Server-authoritative scoring; the client never receives the opponent's pending commit (server-side redaction) and never decides the result.
- Provably fair: the commitment is published before any move and the seed revealed after, so neither the house nor a player can rig or change the deal.
