import "server-only";

/**
 * Matchmaking + invites.
 *
 * Quick-match: find an open match of the requested game NOT created by the
 * viewer; join the first eligible; create one if none. Anti-collusion is built
 * in from day one — list_open_gaming_matches (SQL) down-ranks/excludes a creator
 * the viewer has already faced above a threshold in the rolling window
 * (gaming_head_to_head), the structural hook the fair-play audit over-samples.
 *
 * Invite-by-handle: resolve the opponent's public handle to a user id
 * SERVER-SIDE (never returned to the client), create a match, and record an
 * invitation. The notification itself is sent by the apps/account action via
 * @henryco/notifications (kept out of this package's dep surface).
 */

import { GamingError } from "../errors";
import type { GameId } from "../types";
import { createMatch, joinAndMaybeStart } from "./match-actions";
import { createInvitationRow, listOpenMatches, resolveHandleRow } from "./persistence";
import type { GamingDbClient } from "./supabase";

export type MatchmakeResult =
  | { kind: "created"; matchId: string; commitment: string | null }
  | { kind: "joined"; matchId: string; started: boolean };

export async function findOrCreateMatch(
  client: GamingDbClient,
  input: { gameId: GameId; userId: string; clientSeed?: string },
): Promise<MatchmakeResult> {
  const open = await listOpenMatches(client, {
    gameId: input.gameId,
    excludeUser: input.userId,
    limit: 20,
  });

  for (const candidate of open) {
    const join = await joinAndMaybeStart(client, {
      matchId: candidate.id,
      userId: input.userId,
      clientSeed: input.clientSeed,
    });
    if (join.joined) {
      return { kind: "joined", matchId: candidate.id, started: join.started };
    }
    // not joinable (filled in a race / already in it) — try the next candidate
  }

  const created = await createMatch(client, {
    gameId: input.gameId,
    createdBy: input.userId,
    clientSeed: input.clientSeed,
  });
  return { kind: "created", matchId: created.matchId, commitment: created.commitment };
}

export type InviteResult = { matchId: string; invitedUserId: string };

/**
 * Create a match and invite an opponent by their public handle. Returns the
 * invited user id so the caller (apps/account) can send the notification —
 * the id is resolved server-side and never round-trips through the client.
 */
export async function inviteByHandle(
  client: GamingDbClient,
  input: { gameId: GameId; fromUserId: string; toHandle: string; clientSeed?: string },
): Promise<InviteResult> {
  const toUserId = await resolveHandleRow(client, input.toHandle.trim());
  if (!toUserId) throw new GamingError("match_not_found", "no player with that handle");
  if (toUserId === input.fromUserId) {
    throw new GamingError("match_not_found", "cannot invite yourself");
  }
  const created = await createMatch(client, {
    gameId: input.gameId,
    createdBy: input.fromUserId,
    clientSeed: input.clientSeed,
  });
  await createInvitationRow(client, {
    matchId: created.matchId,
    fromUser: input.fromUserId,
    toUser: toUserId,
    gameId: input.gameId,
  });
  return { matchId: created.matchId, invitedUserId: toUserId };
}
