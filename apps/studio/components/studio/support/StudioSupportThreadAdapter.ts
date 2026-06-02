"use client";

import type {
  MessageThreadAdapter,
  ThreadAttachment,
  ThreadMessage,
} from "@henryco/messaging-thread";

/**
 * Studio-side adapter that wires the support thread engine to the
 * `support_messages` table + the studio /api/support/* fetch endpoints.
 *
 * The studio viewer is always a Henry Onyx staff member (studio_owner or
 * client_success). Customer messages render left-aligned (`team`),
 * messages from the current viewer render right-aligned (`viewer`), and
 * messages from any other staff member also render left-aligned (`team`)
 * so the conversation reads correctly when multiple staff are involved.
 *
 * Engine owns: render, optimistic state, scroll, draft persistence,
 * live subscription, mark-read, polite SR announcer.
 *
 * This adapter owns: column → ThreadMessage mapping, and the three
 * fetch wrappers (send / mark-read / upload) that the engine calls.
 */
export function studioSupportThreadAdapter(): MessageThreadAdapter {
  return {
    channelName: (threadId) => `studio-support-thread-${threadId}`,
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
          // Treat malformed payload as no attachments — engine still
          // sends body when present.
        }
      }

      const response = await fetch("/api/support/reply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          thread_id: threadId,
          body,
          attachments,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        message_id?: string;
        error?: string;
      };
      if (!response.ok || !data.message_id) {
        return {
          ok: false,
          reason: data.error || "We couldn't send your reply.",
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
          // Fire-and-forget — engine never awaits this in a UI-blocking
          // path.
          keepalive: true,
        });
      } catch {
        // Best-effort. Mark-read is recovered on the next page mount.
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
        url?: string;
        name?: string;
        type?: string;
        size?: number;
        reason?: string;
      };
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
 * schema's optional columns and to sparser realtime payloads.
 *
 * For the studio viewer (a staff member), bubbles align like this:
 *   - sender_id === viewerId  → "viewer" (right-aligned, own reply)
 *   - sender_type === "system" → "system" (centered system message)
 *   - everyone else            → "team"   (left-aligned: customer or
 *                                          another staff member)
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
  const senderRole: ThreadMessage["senderRole"] =
    senderType === "system" ? "system" : isOwn ? "viewer" : "team";

  const senderName =
    (row.sender_name as string | null) ||
    (isOwn
      ? "You"
      : senderType === "customer"
        ? (row.customer_name as string | null) || "Customer"
        : senderType === "system"
          ? "Henry Onyx"
          : "Henry Onyx Studio");

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
    senderRole,
    body: String(row.body || ""),
    attachments,
    createdAt: String(row.created_at || new Date().toISOString()),
    editedAt: (row.edited_at as string | null) || null,
    readAt: (row.read_at as string | null) || null,
    isOwnMessage: isOwn,
  };
}
