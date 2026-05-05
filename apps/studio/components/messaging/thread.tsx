"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  Search,
  PanelRight,
  WifiOff,
} from "lucide-react";
import {
  toggleReaction as toggleReactionAction,
  markMessagesRead as markMessagesReadAction,
  sendMessage as sendMessageAction,
  softDeleteMessage as softDeleteMessageAction,
} from "@/lib/messaging/mutations";
import type { ReactionEmoji } from "@/lib/messaging/constants";
import type {
  ProjectThreadContext,
  ReplyPreview,
  SendMessageInput,
  StudioMessage,
  ThreadInitialState,
} from "@/lib/messaging/types";
import { excerpt, generateClientMessageId } from "@/lib/messaging/utils";
import { ContextPanel } from "./context-panel";
import { EmptyThreadState } from "./empty-state";
import { MessageInput } from "./message-input";
import { MessageList } from "./message-list";
import { SearchOverlay } from "./search-overlay";
import { TypingIndicator } from "./typing-indicator";
import { useMessageScroll } from "./use-message-scroll";
import { useOfflineQueue } from "./use-offline-queue";
import {
  useRealtimeMessages,
} from "./use-realtime-messages";
import { useTypingIndicator } from "./use-typing-indicator";

type Props = {
  initial: ThreadInitialState;
  /** When true, shows a back button in the header (mobile drill-in flow). */
  showBack?: boolean;
  onBack?: () => void;
  /** Optional override — when host wants the panel hidden entirely. */
  hideContextPanel?: boolean;
};

const SYSTEM_TYPES = new Set([
  "system",
  "milestone_update",
  "file_share",
  "payment_update",
  "approval_request",
]);

/**
 * The orchestrator for Surface 1 — the project thread. Responsible
 * for wiring together: realtime subscription, typing presence,
 * offline queue, scroll behaviour, search, replies, optimistic
 * sends, and the right-side context panel.
 */
export function ProjectThread({
  initial,
  showBack,
  onBack,
  hideContextPanel,
}: Props) {
  const projectId = initial.context.projectId;

  const {
    messages,
    status: realtimeStatus,
    upsertOptimistic,
    removeOptimistic,
  } = useRealtimeMessages({
    projectId,
    initialMessages: initial.messages,
    viewerId: initial.viewerId,
  });

  const { typists, beginTyping } = useTypingIndicator({
    projectId,
    viewerId: initial.viewerId,
    viewerName: initial.viewerName,
  });

  const sendDirect = useCallback(
    async (
      input: SendMessageInput,
    ): Promise<{ ok: boolean; messageId?: string; error?: string }> => {
      const result = await sendMessageAction(input);
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, messageId: result.messageId };
    },
    [],
  );

  const { queue, isOnline, enqueue, removeFromQueue } = useOfflineQueue(
    projectId,
    sendDirect,
  );

  const [reply, setReply] = useState<ReplyPreview | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contextOpen, setContextOpen] = useState(false);
  const [pendingByMessageId, setPendingByMessageId] = useState<
    Map<string, "sending" | "queued" | "failed">
  >(new Map());

  // Compute seen-state for own messages: seen if any non-self user has
  // read the message. Cheap to derive from message.readReceipts.
  const seenByMessageId = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const msg of messages) {
      if (!msg.isOwnMessage) continue;
      const seen = msg.readReceipts.some(
        (r) => r.userId !== initial.viewerId,
      );
      map.set(msg.id, seen);
    }
    return map;
  }, [messages, initial.viewerId]);

  const {
    containerRef,
    pendingNewMessage,
    scrollToBottom,
    scrollToMessage,
  } = useMessageScroll({
    messageCount: messages.length,
    smooth: true,
  });

  // Mark unread messages as read whenever the viewer focuses the
  // thread or new messages arrive while the thread is in view.
  useEffect(() => {
    const unread = messages
      .filter(
        (m) =>
          !m.isOwnMessage &&
          !m.readByViewer &&
          !m.deletedAt &&
          (!SYSTEM_TYPES.has(m.messageType) || m.messageType === "system"),
      )
      .map((m) => m.id);
    if (unread.length === 0) return;
    void markMessagesReadAction({ messageIds: unread });
  }, [messages]);

  const handleSend = useCallback(
    async (
      input: SendMessageInput,
    ): Promise<{ ok: boolean; error?: string }> => {
      const clientId = generateClientMessageId();
      const optimistic: StudioMessage = {
        id: clientId,
        projectId: input.projectId,
        senderName: initial.viewerName || "You",
        senderId: initial.viewerId,
        senderRole: initial.viewerRole,
        body: input.body,
        messageType: input.messageType || (input.body ? "text" : "file"),
        metadata: input.metadata || {},
        attachments:
          (input.attachments || []).map((a) => ({
            id: a.publicId || a.url,
            label: a.label,
            url: a.url,
            publicId: a.publicId,
            mimeType: a.mimeType,
            size: a.size,
            kind: a.kind,
          })) || [],
        reactions: [],
        readReceipts: initial.viewerId
          ? [
              {
                userId: initial.viewerId,
                readAt: new Date().toISOString(),
                displayName: initial.viewerName,
              },
            ]
          : [],
        reply: input.replyToId
          ? messages
              .filter((m) => m.id === input.replyToId)
              .map((m) => ({
                id: m.id,
                senderName: m.senderName,
                senderRole: m.senderRole,
                bodyExcerpt: excerpt(m.body, 60),
              }))[0]
          : undefined,
        createdAt: new Date().toISOString(),
        editedAt: null,
        deletedAt: null,
        isOwnMessage: true,
        readByViewer: true,
      };

      upsertOptimistic(optimistic);
      setPendingByMessageId((current) => {
        const next = new Map(current);
        next.set(clientId, isOnline ? "sending" : "queued");
        return next;
      });

      if (!isOnline) {
        enqueue(input, clientId);
        return { ok: true };
      }

      const result = await sendDirect(input);

      if (!result.ok) {
        setPendingByMessageId((current) => {
          const next = new Map(current);
          next.set(clientId, "failed");
          return next;
        });
        return { ok: false, error: result.error };
      }

      // Drop the optimistic placeholder — Realtime will deliver the
      // canonical row from the DB shortly.
      startTransition(() => {
        removeOptimistic(clientId);
        setPendingByMessageId((current) => {
          const next = new Map(current);
          next.delete(clientId);
          return next;
        });
      });

      return { ok: true };
    },
    [
      enqueue,
      initial.viewerId,
      initial.viewerName,
      initial.viewerRole,
      isOnline,
      messages,
      removeOptimistic,
      sendDirect,
      upsertOptimistic,
    ],
  );

  const handleReact = useCallback(
    async (messageId: string, emoji: ReactionEmoji) => {
      await toggleReactionAction({ messageId, emoji });
    },
    [],
  );

  const handleReply = useCallback((message: StudioMessage) => {
    setReply({
      id: message.id,
      senderName: message.senderName,
      senderRole: message.senderRole,
      bodyExcerpt: excerpt(message.body, 60) || "(attachment)",
    });
  }, []);

  const handleDelete = useCallback(async (message: StudioMessage) => {
    await softDeleteMessageAction({ messageId: message.id });
  }, []);

  const handleRetry = useCallback(
    async (message: StudioMessage) => {
      const queueItem = queue.find((q) => q.clientId === message.id);
      if (!queueItem) return;
      const result = await sendDirect({
        projectId: queueItem.projectId,
        body: queueItem.body,
        attachments: queueItem.attachments,
        replyToId: queueItem.replyToId,
        messageType: queueItem.messageType,
        metadata: queueItem.metadata,
      });
      if (result.ok) {
        removeFromQueue(queueItem.clientId);
        removeOptimistic(queueItem.clientId);
        setPendingByMessageId((current) => {
          const next = new Map(current);
          next.delete(queueItem.clientId);
          return next;
        });
      }
    },
    [queue, removeFromQueue, removeOptimistic, sendDirect],
  );

  // Last team-authored message determines whether we hint "reply".
  const awaitingReply = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i];
      if (SYSTEM_TYPES.has(msg.messageType)) continue;
      return msg.senderRole === "team" && !msg.isOwnMessage;
    }
    return false;
  }, [messages]);

  const isThreadEmpty = messages.filter((m) => !m.deletedAt).length === 0;
  const matchCount = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    const needle = searchQuery.trim().toLowerCase();
    return messages.filter(
      (m) =>
        m.body.toLowerCase().includes(needle) ||
        m.attachments.some((a) =>
          a.label.toLowerCase().includes(needle),
        ),
    ).length;
  }, [messages, searchQuery]);

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-[#050816]">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#070B14] px-3 py-2.5 sm:px-4">
          {showBack ? (
            <button
              type="button"
              onClick={onBack}
              className="rounded-full p-1.5 text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white sm:hidden"
              aria-label="Back to message list"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[14px] font-semibold tracking-[-0.005em] text-[#F5F4EE]">
              {initial.context.projectTitle}
            </h1>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/45">
              <RealtimeStatusBadge status={realtimeStatus} />
              {!isOnline ? (
                <>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1 text-amber-300">
                    <WifiOff className="h-3 w-3" aria-hidden />
                    Reconnecting
                  </span>
                </>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="rounded-full p-1.5 text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
            aria-label="Search this conversation"
            aria-expanded={searchOpen}
          >
            <Search className="h-4 w-4" aria-hidden />
          </button>
          {!hideContextPanel ? (
            <button
              type="button"
              onClick={() => setContextOpen((v) => !v)}
              className="rounded-full p-1.5 text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden"
              aria-label={contextOpen ? "Hide project context" : "Show project context"}
              aria-expanded={contextOpen}
            >
              <PanelRight className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </header>

        <SearchOverlay
          open={searchOpen}
          query={searchQuery}
          onChange={setSearchQuery}
          onClose={() => {
            setSearchOpen(false);
            setSearchQuery("");
          }}
          totalMessages={messages.length}
          matchCount={matchCount}
        />

        {/* Mobile-only condensed milestone strip when no panel. */}
        {!hideContextPanel ? (
          <MobileContextStrip context={initial.context} />
        ) : null}

        <div
          ref={containerRef}
          className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {isThreadEmpty ? (
            <EmptyThreadState
              projectName={initial.context.projectTitle}
              teamLabel={
                initial.context.team.length > 0
                  ? formatTeamLabel(initial.context.team.map((t) => t.name))
                  : null
              }
            />
          ) : (
            <MessageList
              messages={messages}
              pendingByMessageId={pendingByMessageId}
              seenByMessageId={seenByMessageId}
              searchQuery={searchQuery}
              onReact={handleReact}
              onReply={handleReply}
              onJumpToMessage={(id) => scrollToMessage(id)}
              onDelete={handleDelete}
              onRetry={handleRetry}
            />
          )}

          <TypingIndicator typists={typists} />

          {pendingNewMessage ? (
            <button
              type="button"
              onClick={() => scrollToBottom(true)}
              className="sticky bottom-3 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#d4b14e]/40 bg-[#0F1524] px-3 py-1.5 text-[12px] font-medium text-[#d4b14e] shadow-[0_18px_48px_-18px_rgba(0,0,0,0.6)] motion-safe:animate-[studio-msg-pop-up_220ms_ease-out]"
              aria-label="Jump to new message"
            >
              <ArrowDown className="h-3.5 w-3.5" aria-hidden />
              New message
            </button>
          ) : null}
        </div>

        <MessageInput
          projectId={projectId}
          projectName={initial.context.projectTitle}
          isEmpty={isThreadEmpty}
          awaitingReply={awaitingReply}
          reply={reply}
          onCancelReply={() => setReply(null)}
          onSend={handleSend}
          onTyping={beginTyping}
          offline={!isOnline}
        />
      </div>

      {!hideContextPanel ? (
        <>
          <ContextPanel
            context={initial.context}
            expanded={true}
            onToggle={() => setContextOpen(false)}
            variant="fixed"
          />
          {contextOpen ? (
            <>
              <button
                type="button"
                aria-label="Close project context"
                className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] lg:hidden"
                onClick={() => setContextOpen(false)}
              />
              <ContextPanel
                context={initial.context}
                expanded={true}
                onToggle={() => setContextOpen(false)}
                variant="sheet"
              />
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function RealtimeStatusBadge({
  status,
}: {
  status: "idle" | "connecting" | "live" | "reconnecting" | "offline";
}) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1 text-[#d4b14e]">
        <span
          aria-hidden
          className="block h-1.5 w-1.5 rounded-full bg-[#d4b14e] motion-safe:animate-[studio-msg-pulse_2.4s_ease-in-out_infinite]"
        />
        Live
      </span>
    );
  }
  if (status === "connecting") {
    return <span className="text-white/45">Connecting…</span>;
  }
  if (status === "reconnecting") {
    return <span className="text-amber-300">Reconnecting…</span>;
  }
  if (status === "offline") {
    return <span className="text-white/35">Offline</span>;
  }
  return null;
}

function MobileContextStrip({ context }: { context: ProjectThreadContext }) {
  const [open, setOpen] = useState(false);
  const milestone = context.currentMilestone;
  if (!milestone) return null;
  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 border-b border-white/[0.04] bg-[#070B14] px-3 py-2 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-medium uppercase tracking-[0.10em] text-white/45">
            Current milestone
          </div>
          <div className="truncate text-[12px] font-medium text-[#F5F4EE]">
            {milestone.name}
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-[#d4b14e]/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.06em] text-[#d4b14e]">
          {milestone.status.replace("_", " ")}
        </span>
      </button>
      {open ? (
        <div className="border-b border-white/[0.04] bg-[#070B14] px-3 pb-3 pt-1 text-[12px] text-white/65">
          {milestone.description}
          <div className="mt-1.5 text-[11px] text-white/45">
            {milestone.dueLabel}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatTeamLabel(names: string[]): string {
  const filtered = names.filter(Boolean);
  if (filtered.length === 0) return "";
  if (filtered.length === 1) return filtered[0];
  if (filtered.length === 2) return `${filtered[0]} and ${filtered[1]}`;
  return `${filtered.slice(0, -1).join(", ")}, and ${filtered[filtered.length - 1]}`;
}
