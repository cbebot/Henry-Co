import { maskContactsForDisplay } from "@henryco/trust/detect";
import type {
  MessageThreadAdapter,
  ThreadMessage,
} from "@henryco/messaging-thread";

/**
 * Adapter mapping `marketplace_conversation_messages` rows + the
 * `/api/marketplace` intent router onto the audience-agnostic
 * MessageThread engine contract (The Onyx Line, WS-4).
 *
 * Engine owns: render, optimistic state, scroll, draft persistence, live
 * subscription, mark-read, polite SR announcer.
 *
 * This adapter owns: column -> ThreadMessage mapping (identity-minimized)
 * and the two fetch wrappers (reply / mark-read) the engine calls.
 *
 * Client-safe by construction: it imports ONLY types from
 * `@henryco/messaging-thread` plus the pure `maskContactsForDisplay`
 * detector — never `server-only` or any `@/lib` server module — so it can
 * be bundled into the `"use client"` thread surface.
 *
 * The engine generates a tone-prefixed `threadId` (`marketplace-<id>`) so
 * the composer tints brass; the adapter deliberately IGNORES the passed
 * `threadId` and keys every channel/filter/intent on the closed-over
 * `opts.conversationId` (the real DB id) instead.
 */
export function createMarketplaceThreadAdapter(opts: {
  conversationId: string;
  viewerParty: "buyer" | "vendor";
  /** Public store name — the only counterpart label a buyer is allowed to
   * see. The buyer's identity is NEVER surfaced to the vendor. */
  vendorDisplayName: string;
  /** Localized generic label shown to the vendor for the buyer party (never the
   * buyer's real name). Resolved by the caller via the surface translator. */
  buyerLabel: string;
}): MessageThreadAdapter {
  return {
    channelName: () => `marketplace-thread-${opts.conversationId}`,
    subscriptionFilter: () => `conversation_id=eq.${opts.conversationId}`,
    table: "marketplace_conversation_messages",
    schema: "public",
    rowToMessage: (row, viewerId) => mapMarketplaceRow(row, viewerId, opts),
    sendAction: async (formData) => {
      const body = String(formData.get("body") || "");
      const payload = new FormData();
      payload.set("intent", "mkt_conversation_reply");
      payload.set("conversation_id", opts.conversationId);
      payload.set("body", body);
      payload.set("response_mode", "json");

      let response: Response;
      try {
        response = await fetch("/api/marketplace", {
          method: "POST",
          headers: { accept: "application/json" },
          body: payload,
        });
      } catch {
        // Network failure (offline / flaky connection) — the engine keeps the
        // draft + offers retry, so surface a soft reason rather than throwing.
        return { ok: false, reason: "network_error" };
      }

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        messageId?: string;
        reason?: string;
      };
      if (!response.ok || !data.ok || !data.messageId) {
        return { ok: false, reason: data.reason };
      }
      return { ok: true, messageId: data.messageId };
    },
    markReadAction: async () => {
      try {
        const payload = new FormData();
        payload.set("intent", "mkt_conversation_mark_read");
        payload.set("conversation_id", opts.conversationId);
        payload.set("response_mode", "json");
        await fetch("/api/marketplace", {
          method: "POST",
          headers: { accept: "application/json" },
          body: payload,
          // Fire-and-forget — never blocks the UI; recovered on next mount.
          keepalive: true,
        });
      } catch {
        // Best-effort. Mark-read is recovered on next mount.
      }
    },
    // No attachAction for v1 — attachments are out of scope.
  };
}

/**
 * Map a raw `marketplace_conversation_messages` row -> ThreadMessage with
 * strict identity minimization:
 *
 *  - The body is ALWAYS display-masked (`maskContactsForDisplay`) as
 *    defense-in-depth for any legacy/unscreened row.
 *  - A row authored by the viewer renders as the viewer (right-aligned).
 *  - A `system` row renders centered/muted under the brand name.
 *  - A `buyer`-authored row from the OTHER party renders as the generic,
 *    localized `opts.buyerLabel` — the vendor must NEVER learn the buyer's
 *    real name or contact details from the thread.
 *  - A `vendor`-authored row from the OTHER party renders as the public
 *    store name (`opts.vendorDisplayName`), which buyers are allowed to see.
 *
 * Returns null only for unknown row shapes (missing id, or a sender_kind
 * outside the known set).
 */
export function mapMarketplaceRow(
  row: Record<string, unknown>,
  viewerId: string,
  opts: { vendorDisplayName: string; buyerLabel: string },
): ThreadMessage | null {
  const id = String(row.id || "");
  if (!id) return null;

  const senderKind = String(row.sender_kind || "");
  if (senderKind !== "buyer" && senderKind !== "vendor" && senderKind !== "system") {
    return null;
  }

  const senderUserId = row.sender_user_id ? String(row.sender_user_id) : null;
  const isOwn = senderUserId !== null && senderUserId === viewerId;

  let senderRole: ThreadMessage["senderRole"];
  let senderName: string;
  if (isOwn) {
    senderRole = "viewer";
    senderName = "You";
  } else if (senderKind === "system") {
    senderRole = "system";
    // Brand name — never translated.
    senderName = "Henry Onyx";
  } else {
    senderRole = "team";
    // Identity-minimized: a buyer is always shown as the generic, localized
    // buyer label, a vendor always as its public store name. Neither path can
    // leak the buyer's real name / email / phone.
    senderName = senderKind === "vendor" ? opts.vendorDisplayName : opts.buyerLabel;
  }

  return {
    id,
    threadId: `marketplace-${String(row.conversation_id || "")}`,
    // Identity-minimization: only the viewer's OWN messages carry a real
    // senderId (the engine needs it to drop the realtime echo of one's own
    // send). For the counterpart, expose null — a raw auth UUID is a stable
    // cross-thread correlation handle and must not reach the other party's
    // DOM. isOwnMessage is passed explicitly, so own-detection is unaffected,
    // and null !== viewerId keeps the counterpart's echo from being dropped.
    senderId: isOwn ? senderUserId : null,
    senderName,
    senderRole,
    body: maskContactsForDisplay(String(row.body ?? "")),
    createdAt: String(row.created_at || new Date().toISOString()),
    isOwnMessage: isOwn,
  };
}
