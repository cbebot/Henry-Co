/**
 * Onyx Cards — on-device practice opponent (PURE, client-safe).
 *
 * Onyx Cards is Goofspiel with three twists (facet bonus, vein carry, shadow
 * bid). The classic strong baseline for Goofspiel is GREEDY VALUE-MATCHING:
 * pair your highest remaining card with the highest remaining prize, your
 * lowest with the lowest, and commit whichever card is paired to THIS round's
 * prize. That is the "even"/"sharp" policy here; "sharp" also chases the facet
 * bonus and saves its shadow bid for the single biggest prize; "gentle" plays a
 * soft, prize-blind middle card so a newcomer can find their footing.
 *
 * All decisions are deterministic and use only public state, so a practice
 * game is replay-identical to a real one.
 */
import type { GameMove, GameState, Seat } from "../types";
import { type CardsBoard } from "../catalog/onyx-cards";

export type CardsDifficulty = "gentle" | "even" | "sharp";
export const CARDS_DIFFICULTIES: readonly CardsDifficulty[] = ["gentle", "even", "sharp"];

/** The card greedy value-matching assigns to the current round's prize. */
function greedyCard(board: CardsBoard, seat: Seat): number {
  const hand = [...board.hands[seat]].sort((a, b) => b - a); // highest first
  const remaining: { idx: number; value: number }[] = [];
  for (let i = board.round; i < board.prizes.length; i += 1) {
    remaining.push({ idx: i, value: board.prizes[i]!.value });
  }
  // highest-value prize first; stable by index so the pairing is deterministic
  remaining.sort((a, b) => b.value - a.value || a.idx - b.idx);
  const rankOfCurrent = remaining.findIndex((p) => p.idx === board.round);
  return hand[rankOfCurrent] ?? hand[hand.length - 1]!;
}

/** Choose the AI's commit for `seat` at the given difficulty. */
export function chooseCardsCommit(state: GameState, seat: Seat, difficulty: CardsDifficulty): GameMove {
  const board = state.board as CardsBoard;
  const hand = board.hands[seat];
  if (!hand || hand.length === 0) return { type: "commit", card: 1 };

  if (difficulty === "gentle") {
    // soft, prize-blind: a middle card — present but beatable
    const sorted = [...hand].sort((a, b) => a - b);
    return { type: "commit", card: sorted[Math.floor((sorted.length - 1) / 2)]! };
  }

  const card = greedyCard(board, seat);
  let shadow = false;
  if (difficulty === "sharp" && !board.shadowUsed[seat]) {
    const currentValue = board.prizes[board.round]!.value + board.carry;
    let maxRemaining = 0;
    for (let i = board.round; i < board.prizes.length; i += 1) {
      maxRemaining = Math.max(maxRemaining, board.prizes[i]!.value);
    }
    // lock the single biggest prize by doubling a non-max card
    if (currentValue >= maxRemaining && card < 10) shadow = true;
  }

  return shadow ? { type: "commit", card, shadow: true } : { type: "commit", card };
}
