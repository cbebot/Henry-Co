# Onyx Lines — Rules (counsel-reviewable)

**Game:** Onyx Lines · **Division:** Henry Onyx Live · **Legal entity:** Henry Onyx Limited
**Pass:** V3-GAMING-01 (free-play foundation). This is the `L7` input artifact for any future per-market skill classification of *staked* play; in the free tier there is no stake and no prize.

## Summary
A two-player, perfect-information connection game on a rhombic hex board. **No randomness, no hidden information, no dice or cards.** Skill alone decides the winner — the strongest skill claim in the catalog.

## Board
- A rhombus of hexagonal cells (11×11 for ranked play; size is a tuning parameter).
- Seat 0 ("Onyx") owns the top and bottom edges; seat 1 ("Alabaster") owns the left and right edges.
- A short, fixed off-centre run of pre-blocked "vein" cells crosses the board. The vein is identical every match (part of the board, not random).

## Turn structure
1. Players alternate. On your turn you place **one stone of your colour on any empty cell**.
2. **Swap rule (first-move balance):** after seat 0's opening stone, seat 1 may either play normally or **swap** — claim the opening stone as their own and pass the turn back. This removes the first-mover advantage and makes the opening a skill decision.
3. **Fracture (once per player, optional variant):** instead of placing, convert a single opponent stone that is adjacent to two or more of your own stones into a neutral blocker. Fully visible; no randomness. Omitted in the "pure" Hex-clean variant.

## Winning
- The first player to complete an unbroken, edge-to-edge chain of their own stones connecting their two edges wins immediately (computed server-side via a union-find/BFS over the move log).
- In the pure variant connection is mutually exclusive — exactly one player can connect. With the vein/fracture variant a rare mutual block resolves deterministically by **longest single connected chain**, never by chance.

## Why skill predominates (no chance)
There is **no chance input of any kind**. Both players see the entire board, move under identical rules, and the swap rule removes the structural first-move edge. The winner is the player who reads threats, builds uncuttable double-connections, and forces a losing tempo. A loss cannot be attributed to luck because there is none.

## Integrity
- Server-authoritative: every move is validated server-side; the winner is computed server-side from the append-only move log. A tampered client cannot forge a move or an outcome.
- Self-evident fairness: with no randomness, the entire match is replayable and verifiable from its move log alone — no commit–reveal needed.
