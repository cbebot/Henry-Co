/**
 * The game catalog — the typed registry the server and surfaces resolve against.
 * Onyx Quiz (the third design title) lands in Pass 2 with its question bank.
 */

import type { GameDefinition, GameId } from "../types";
import { onyxCards } from "./onyx-cards";
import { onyxLines } from "./onyx-lines";

export const GAME_IDS: readonly GameId[] = ["onyx-lines", "onyx-cards"] as const;

export const CATALOG: Record<GameId, GameDefinition> = {
  "onyx-lines": onyxLines,
  "onyx-cards": onyxCards,
};

export function getGame(id: GameId): GameDefinition {
  return CATALOG[id];
}

/** Narrow an arbitrary string to a known GameId (used at the server boundary). */
export function isGameId(value: string): value is GameId {
  return (GAME_IDS as readonly string[]).includes(value);
}
