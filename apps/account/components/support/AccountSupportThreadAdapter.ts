"use client";

import type {
  MessageThreadAdapter,
  ThreadAttachment,
  ThreadMessage,
} from "@henryco/messaging-thread";

/**
 * Adapter mapping `support_messages` rows + the /api/support/* fetch
 * endpoints onto the audience-agnostic MessageThread engine contract.
 *
 * Engine owns: render, optimistic state, scroll, draft persistence,
 * live subscription, mark-read, polite SR announcer.
 *
 * This adapter owns: column → ThreadMessage mapping, and the three
 * fetch wrappers (send / mark-read / upload) that the engine calls.
 *
 * The send path is the JSON pre-uploaded-attachments path: the engine's
 * AttachmentUploader hits /api/support/upload first, then sendAction
 * passes the resulting URLs to /api/support/reply as JSON. This avoids
 * a second per-file Cloudinary round-trip on send and lets the
 * composer surface real per-file progress.
 */
export function accountSupportThreadAdapter(): MessageThreadAdapter {
  return {
    channelName: (threadId) => `support-thread-${threadId}`,
    subscriptionFilter: (threadId) => `thread_id=eq.${threadId}`,
    table: "support_messages",
    schema: "public",
    rowToMessage: (row, viewerId) => mapRowToMessage(row, viewerId),
    sendAction: async (formData) => {
      const threadId = String(formData.get("threadId") || "");
      const body = String(formData.get("body") || "");
      const raw = formData.get("attachments");
      let attachments: ThreadAttachment[] = [];
      if (typeof raw === "string" && raw.length > 0) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            attachments = parsed
              .filter(
                (a: unknown): a is { url?: unknown } =>
                  typeof a === "object" &&
                  a !== null &&
                  typeof (a as { url?: unknown }).url === "string",
              )
              .map((a) => ({
                url: String((a as { url?: unknown }).url),
                name: String((a as { name?: unknown }).name || "attachment"),
                type: String((a as { type?: unknown }).type || ""),
                size:
                  typeof (a as { size?: unknown }).size === "number"
                    ? ((a as { size: number }).size as number)
                    : null,
              }));
          }
        } catch {
          // Treat malformed payload as no attachments — engine still sends body.
        }
      }

      // Per-dispatch idempotency key: a retry of the SAME message reuses the
      // key, so a send that persisted server-side but failed on the network
      // replays the stored response instead of double-posting (the reply
      // route keys idempotency on this header).
      const idempotencyKey = String(formData.get("idempotencyKey") || "");
      const response = await fetch("/api/support/reply", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
        },
        body: JSON.stringify({
          thread_id: threadId,
          body,
          attachments,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        message_id?: string;
        error?: string;
        reason?: string;
      };
      if (!response.ok || !data.message_id) {
        // The reply route reports contact-safety blocks as `reason`
        // ("contact_blocked", 422) and other failures as `error` — read
        // both so blocked sends surface their real cause instead of the
        // generic copy.
        return {
          ok: false,
          reason: data.error || data.reason || "We couldn't send your reply.",
        };
      }
      return { ok: true, messageId: data.message_id };
    },
    markReadAction: async (formData) => {
      const threadId = String(formData.get("threadId") || "");
      if (!threadId) return;
      try {
        await fetch("/api/support/mark-read", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ threadId }),
          // Fire-and-forget — engine never awaits this in a UI-blocking path.
          keepalive: true,
        });
      } catch {
        // Best-effort. Mark-read is recovered on next mount.
      }
    },
    attachAction: async (formData) => {
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return { ok: false, reason: "Choose a file to upload." };
      }
      const upload = new FormData();
      upload.set("file", file, file.name);
      const response = await fetch("/api/support/upload", {
        method: "POST",
        body: upload,
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        ref?: string;
        url?: string;
        name?: string;
        type?: string;
        size?: number;
        reason?: string;
      };
      // /api/support/upload writes to the RLS-PRIVATE document bucket and
      // returns BOTH the durable `media://private/...` ref AND a short-lived
      // SIGNED previewUrl. The thread engine carries a single `url` through to
      // both the in-composer preview render AND the submitted reply payload, so
      // we hand it the SIGNED previewUrl (a private ref can't render in the
      // browser). The reply route then canonicalises that signed URL back to
      // the ref before persisting, so the column never stores a transient URL.
      // (V3-MEDIA-SWEEP-01)
      if (!response.ok || !data.ok || !data.url) {
        return { ok: false, reason: data.reason || "Upload failed." };
      }
      return {
        ok: true,
        url: data.url,
        name: data.name || file.name,
        type: data.type || file.type || "application/octet-stream",
        size: typeof data.size === "number" ? data.size : (file.size ?? null),
      };
    },
  };
}

/**
 * Map a raw `support_messages` row → ThreadMessage. Resilient to the
 * schema's optional columns (sender_name, read_at) and to the engine
 * receiving rows from the realtime channel where the columns may be
 * sparser than the SELECT * read.
 */
export function mapRowToMessage(
  row: Record<string, unknown>,
  viewerId: string,
): ThreadMessage | null {
  const id = String(row.id || "");
  if (!id) return null;
  const senderId = (row.sender_id as string | null) || null;
  const senderType = String(row.sender_type || "customer");
  const isOwn = senderId !== null && senderId === viewerId;
  const role: ThreadMessage["senderRole"] =
    senderType === "system"
      ? "system"
      : isOwn || senderType === "customer"
        ? // The viewer is always a customer in /support/[threadId];
          // mapping team-side rows (agent / staff) to "team" gives left-
          // aligned bubbles, viewer-side rows (own customer) to "viewer".
          isOwn
          ? "viewer"
          : "team"
        : "team";

  const senderName =
    (row.sender_name as string | null) ||
    (isOwn
      ? "You"
      : senderType === "agent"
        ? "HenryCo Support"
        : senderType === "system"
          ? "HenryCo"
          : "Customer");

  const attachments = Array.isArray(row.attachments)
    ? (row.attachments as Array<Record<string, unknown>>).map(
        (a): ThreadAttachment => ({
          url: String(a.url || ""),
          name: String(a.name || a.url || "attachment"),
          type: String(a.mime_type || a.type || ""),
          size:
            typeof a.size === "number"
              ? a.size
              : typeof a.file_size === "number"
                ? (a.file_size as number)
                : null,
        }),
      )
    : [];

  return {
    id,
    threadId: String(row.thread_id || ""),
    senderId,
    senderName,
    senderRole: role,
    body: String(row.body || ""),
    attachments,
    createdAt: String(row.created_at || new Date().toISOString()),
    editedAt: (row.edited_at as string | null) || null,
    readAt: (row.read_at as string | null) || null,
    isOwnMessage: isOwn,
  };
}
