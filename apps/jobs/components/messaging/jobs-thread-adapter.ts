import { maskContactsForDisplay } from "@henryco/trust/detect";
import type {
  MessageThreadAdapter,
  ThreadMessage,
} from "@henryco/messaging-thread";

/**
 * Adapter mapping `jobs_messages` rows + the `/api/hiring/messages` send
 * endpoint onto the audience-agnostic MessageThread engine contract (The
 * Onyx Line, WS-5).
 *
 * Engine owns: render, optimistic state, scroll, draft persistence, live
 * subscription, polite SR announcer.
 *
 * This adapter owns: column -> ThreadMessage mapping and the send wrapper.
 *
 * Client-safe by construction: it imports ONLY types from
 * `@henryco/messaging-thread` plus the pure `maskContactsForDisplay`
 * detector — never `server-only` or any `@/lib` server module — so it can be
 * bundled into the `"use client"` thread surface.
 *
 * KEY DIFFERENCE FROM MARKETPLACE (WS-4): jobs is NOT identity-minimized. In
 * a hiring conversation the candidate and employer legitimately see each
 * other's real names, so the counterpart's real `senderId` is preserved (the
 * cross-thread-UUID correlation concern that drives marketplace's null-out
 * does not apply here) and the counterpart is labelled with its real display
 * name. The invariant that DOES apply is no contact-detail leak: every body
 * is display-masked (`maskContactsForDisplay`) as defense-in-depth for any
 * legacy/unscreened row.
 *
 * The engine generates a tone-prefixed `threadId` (`jobs-<id>`) so the
 * composer tints with the jobs tone; the adapter deliberately IGNORES the
 * passed `threadId` and keys every channel/filter/intent on the closed-over
 * `opts.conversationId` (the real DB id) instead.
 */
export function createJobsThreadAdapter(opts: {
  conversationId: string;
  /** Real display name for the candidate party (jobs is not minimized). */
  candidateLabel: string;
  /** Real display name for the employer party (jobs is not minimized). */
  employerLabel: string;
}): MessageThreadAdapter {
  return {
    channelName: () => `jobs-thread-${opts.conversationId}`,
    subscriptionFilter: () => `conversation_id=eq.${opts.conversationId}`,
    table: "jobs_messages",
    schema: "public",
    rowToMessage: (row, viewerId) => mapJobsRow(row, viewerId, opts),
    sendAction: async (formData) => {
      const body = String(formData.get("body") || "");

      let response: Response;
      try {
        response = await fetch("/api/hiring/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          // The route derives the sender (id + type) server-side from the
          // cookie session; it IGNORES any client-supplied senderId/senderType.
          // We only send what it reads: the conversation id + the body.
          body: JSON.stringify({
            conversationId: opts.conversationId,
            body,
          }),
        });
      } catch {
        // Network failure (offline / flaky connection) — the engine keeps the
        // draft + offers retry, so surface a soft reason rather than throwing.
        return { ok: false, reason: "network_error" };
      }

      const data = (await response.json().catch(() => ({}))) as {
        messageId?: string;
        error?: string;
      };
      // The route returns the persisted message id as `messageId` on success
      // (200). Blocked sends come back 422 with `{ error: "blocked" }`; the
      // engine surfaces the reason and keeps the draft for editing.
      if (!response.ok || !data.messageId) {
        return { ok: false, reason: data.error };
      }
      return { ok: true, messageId: data.messageId };
    },
    // Best-effort no-op: the candidate/employer thread pages are
    // `force-dynamic` and call `markMessagesRead(...)` server-side on every
    // load, and there is no client-callable mark-read endpoint today (the send
    // route is send-only). We intentionally do NOT add one here — WS-5 limits
    // the route change to its response shape. Realtime-arrived messages are
    // marked read on the next page load. A future mark-read intent can drop in
    // here without touching the engine contract.
    markReadAction: async () => {
      // no-op (see comment above)
    },
    // No attachAction for v1 — attachments are out of scope.
  };
}

/**
 * Map a raw `jobs_messages` row -> ThreadMessage. Exported standalone so
 * server pages can build `initialMessages` before mounting the client thread.
 *
 *  - The body is ALWAYS display-masked (`maskContactsForDisplay`) as
 *    defense-in-depth for any legacy/unscreened row.
 *  - A row authored by the viewer renders as the viewer (right-aligned). The
 *    engine forces the literal "You" for own bubbles, so the senderName here
 *    is not user-visible.
 *  - A `system` row renders centered/muted under the brand name "Henry & Co."
 *    (brand, never translated).
 *  - A `candidate`/`employer` row from the OTHER party renders with its REAL
 *    display name (jobs is not identity-minimized) — `opts.candidateLabel` or
 *    `opts.employerLabel`, resolved by the caller.
 *
 * Returns null only for unknown row shapes (missing id, or a sender_type
 * outside the known set).
 */
export function mapJobsRow(
  row: Record<string, unknown>,
  viewerId: string,
  opts: { candidateLabel: string; employerLabel: string },
): ThreadMessage | null {
  const id = String(row.id || "");
  if (!id) return null;

  const senderType = String(row.sender_type || "");
  if (
    senderType !== "candidate" &&
    senderType !== "employer" &&
    senderType !== "system"
  ) {
    return null;
  }

  // Jobs is NOT minimized — keep the real sender id for own-echo dropping +
  // message grouping. (Unlike marketplace, exposing the counterpart's real id
  // is not a privacy concern here; the parties already see each other.)
  const senderUserId = row.sender_id ? String(row.sender_id) : null;
  const isOwn = senderUserId !== null && senderUserId === viewerId;

  let senderRole: ThreadMessage["senderRole"];
  let senderName: string;
  if (isOwn) {
    senderRole = "viewer";
    // Engine renders the literal "You" for own bubbles regardless of this.
    senderName = "You";
  } else if (senderType === "system") {
    senderRole = "system";
    // Brand name — never translated.
    senderName = "Henry & Co.";
  } else {
    senderRole = "team";
    senderName =
      senderType === "candidate" ? opts.candidateLabel : opts.employerLabel;
  }

  return {
    id,
    threadId: `jobs-${String(row.conversation_id || "")}`,
    senderId: senderUserId,
    senderName,
    senderRole,
    body: maskContactsForDisplay(String(row.body ?? "")),
    createdAt: String(row.created_at || new Date().toISOString()),
    isOwnMessage: isOwn,
  };
}
