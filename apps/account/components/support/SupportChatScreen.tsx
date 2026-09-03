"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildChatThreadLabels,
  buildMessagingChromeLabels,
  translateSurfaceLabel,
  useHenryCoLocale,
} from "@henryco/i18n";
import {
  ChatThread,
  fromThreadMessage,
  useThreadRealtime,
  type ChatSendPayload,
  type ChatSendResult,
  type ChatThreadMessage,
} from "@henryco/chat-thread";
import {
  renderMessageMarkdown,
  type ThreadSupabaseLike,
} from "@henryco/messaging-thread";
import type { AttachmentUploader } from "@henryco/chat-composer/types";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { ContactSafetyHint } from "@/components/messages/ContactSafetyHint";
import {
  accountSupportThreadAdapter,
  mapRowToMessage,
} from "./AccountSupportThreadAdapter";
import { ThreadActionMenu } from "./SupportThreadHeader";

type SupportMessageRow = Record<string, unknown>;

/**
 * Full-viewport support conversation for /support/[threadId], built on the
 * shared @henryco/chat-thread screen (support variant).
 *
 * Host-owned concerns: row → message mapping (existing adapter), the
 * realtime merge + mark-read, the send/upload fetch bridges, localized
 * chrome, and the overflow actions (download / mute / report / copy).
 */
export default function SupportChatScreen({
  threadId,
  rows,
  threadStatus,
  subject,
  statusLine,
  initialMuted,
  download,
  viewer,
}: {
  threadId: string;
  rows: SupportMessageRow[];
  threadStatus: string;
  subject: string;
  /** Localized "{status} · {division}" line for the header. */
  statusLine: string;
  initialMuted: boolean;
  download: {
    endpoint: string;
    filename: string;
    shareTitle: string;
    label: string;
  };
  viewer: { userId: string; fullName: string };
}) {
  const router = useRouter();
  const locale = useHenryCoLocale();
  const t = useCallback(
    (text: string) => translateSurfaceLabel(locale, text),
    [locale],
  );

  const adapter = useMemo(() => accountSupportThreadAdapter(), []);
  const threadLabels = useMemo(() => buildChatThreadLabels(t), [t]);
  const { composerLabels } = useMemo(() => buildMessagingChromeLabels(t), [t]);

  const isClosed = threadStatus === "closed";
  const isResolved = threadStatus === "resolved";

  // Server snapshot + realtime inserts. Seeded once (useState initializer) —
  // RouteLiveRefresh re-renders the page for status changes, but the live
  // message channel is the realtime subscription, matching the previous
  // engine's semantics.
  const [messages, setMessages] = useState<ChatThreadMessage[]>(() => {
    const mapped: ChatThreadMessage[] = [];
    for (const row of rows) {
      const threadMessage = mapRowToMessage(row, viewer.userId);
      if (threadMessage) mapped.push(fromThreadMessage(threadMessage));
    }
    if (isClosed) {
      mapped.push({
        id: "status-note-closed",
        authorId: null,
        authorRole: "system",
        body: t(
          "This thread is closed. To continue this conversation, open a new support request — staff triage will route it cleanly.",
        ),
        createdAt: new Date().toISOString(),
      });
    } else if (isResolved) {
      mapped.push({
        id: "status-note-resolved",
        authorId: null,
        authorRole: "system",
        body: t(
          "This thread is marked resolved. Reply here to re-open it, or start a fresh request for unrelated issues.",
        ),
        createdAt: new Date().toISOString(),
      });
    }
    return mapped;
  });

  const getSupabase = useCallback((): ThreadSupabaseLike | null => {
    if (typeof window === "undefined") return null;
    try {
      // Structural minimum (channel + removeChannel) — the @supabase/ssr
      // browser client satisfies it but doesn't typedef as compatibly.
      return createSupabaseBrowser() as unknown as ThreadSupabaseLike;
    } catch {
      return null;
    }
  }, []);

  const markRead = useCallback(() => {
    if (!adapter.markReadAction) return;
    const formData = new FormData();
    formData.set("threadId", threadId);
    void adapter.markReadAction(formData);
  }, [adapter, threadId]);

  useEffect(() => {
    markRead();
  }, [markRead]);

  const { status: liveStatus } = useThreadRealtime({
    getSupabase,
    channelName: `support-thread-${threadId}`,
    table: "support_messages",
    filter: `thread_id=eq.${threadId}`,
    onInsert: (row) => {
      const threadMessage = mapRowToMessage(row, viewer.userId);
      if (!threadMessage) return;
      if (threadMessage.senderId === viewer.userId) return;
      const incoming = fromThreadMessage(threadMessage);
      setMessages((prev) =>
        prev.some((candidate) => candidate.id === incoming.id)
          ? prev
          : [...prev, incoming],
      );
      markRead();
    },
  });

  // One idempotency key per dispatched message. ChatThread retries reuse the
  // same payload object, so the WeakMap returns the same key and the reply
  // route can dedupe a commit-then-network-drop retry.
  const idempotencyKeys = useRef(new WeakMap<ChatSendPayload, string>());

  const sendMessage = useCallback(
    async (payload: ChatSendPayload): Promise<ChatSendResult> => {
      let idempotencyKey = idempotencyKeys.current.get(payload);
      if (!idempotencyKey) {
        idempotencyKey =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        idempotencyKeys.current.set(payload, idempotencyKey);
      }
      const formData = new FormData();
      formData.set("threadId", threadId);
      formData.set("body", payload.body);
      formData.set("idempotencyKey", idempotencyKey);
      if (payload.attachments && payload.attachments.length > 0) {
        formData.set(
          "attachments",
          JSON.stringify(
            payload.attachments.map((attachment) => ({
              url: attachment.url,
              name: attachment.name,
              type: attachment.type,
              size: attachment.size ?? null,
            })),
          ),
        );
      }
      const result = await adapter.sendAction(formData);
      if (!result.ok) {
        // Localize the machine reason from the reply route; anything else
        // is already human-readable copy from the adapter.
        const reason =
          result.reason === "contact_blocked"
            ? t(
                "This message can't be sent — please remove contact details like phone numbers or emails.",
              )
            : result.reason;
        return { ok: false, reason };
      }
      return {
        ok: true,
        message: {
          id: result.messageId,
          authorId: viewer.userId,
          authorName: viewer.fullName,
          authorRole: "viewer",
          body: payload.body,
          createdAt: new Date().toISOString(),
          attachments: payload.attachments,
          deliveryState: "sent",
        },
      };
    },
    [adapter, threadId, viewer.userId, viewer.fullName, t],
  );

  // Port of the engine's uploader bridge: adapter.attachAction behind the
  // composer's AttachmentUploader contract, with coarse progress framing.
  const uploader = useMemo<AttachmentUploader | undefined>(() => {
    const attach = adapter.attachAction;
    if (!attach) return undefined;
    return async (file, onProgress, signal) => {
      onProgress(15);
      const formData = new FormData();
      formData.set("file", file, file.name);
      const result = await attach(formData);
      if (signal.aborted) throw new Error(t("Upload canceled."));
      if (!result.ok) throw new Error(result.reason || t("Upload failed."));
      onProgress(100);
      return {
        url: result.url,
        bytes: typeof result.size === "number" ? result.size : undefined,
      };
    };
  }, [adapter, t]);

  const renderBody = useCallback(
    (message: ChatThreadMessage) => renderMessageMarkdown(message.body, message.id),
    [],
  );

  return (
    <ChatThread
      variant="support"
      threadId={threadId}
      viewer={{ id: viewer.userId, name: viewer.fullName }}
      messages={messages}
      onSendMessage={sendMessage}
      header={{
        title: subject,
        status: statusLine,
        onBack: () => router.push("/support"),
        live: liveStatus === "live" ? "live" : liveStatus === "reconnecting" ? "reconnecting" : null,
        actions: (
          <ThreadActionMenu
            threadId={threadId}
            subject={subject}
            initialMuted={initialMuted}
            download={download}
          />
        ),
      }}
      renderBody={renderBody}
      labels={threadLabels}
      locale={locale}
      fillViewport
      composer={{
        placeholder: t(
          "Reply with context, screenshots, or next steps. Drafts stay here while you type.",
        ),
        disabled: isClosed,
        tone: "account",
        autoFocus: !isClosed,
        enableAttachments: Boolean(uploader),
        uploader,
        maxAttachments: 4,
        labels: composerLabels,
        extras: (ctx) => <ContactSafetyHint text={ctx.draft} />,
      }}
      emptyState={
        <div>
          <p className="acct-chat-empty-title">{t("Start the conversation")}</p>
          <p className="acct-chat-empty-body">
            {t(
              "Share what's on your mind — context, screenshots, or the outcome you're after. A teammate will pick it up here and you'll see replies arrive live.",
            )}
          </p>
        </div>
      }
    />
  );
}
