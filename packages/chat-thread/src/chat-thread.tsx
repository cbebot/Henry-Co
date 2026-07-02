"use client";

/**
 * ChatThread — a full-viewport chat *screen*: one compact header, a contained
 * scroll pane (the ONLY thing that scrolls), and a docked composer as the
 * last flex child (never position:fixed). Two variants share the component:
 * "assistant" (AI typing indicator + suggested replies) and "support"
 * (attachments + SENT badge + ticket status header).
 *
 * Layout invariants (the reason this component exists):
 *   - host container is height-constrained (100dvh via .ct-viewport, never
 *     100vh); the screen is a flex column with overflow hidden
 *   - the pane has flex:1 + min-height:0 + overflow-y:auto +
 *     overscroll-behavior:contain — the page behind never moves
 *   - mount pins to the newest message instantly; new content auto-follows
 *     only within FOLLOW_THRESHOLD_PX of the bottom, otherwise a
 *     "new messages" chip appears (never yank a reader)
 *   - optimistic sends render immediately as "sending" bubbles; failures
 *     stay on THAT bubble with tap-to-retry — there is no global banner
 *   - the iOS keyboard is handled via visualViewport (--ct-kb-inset shrinks
 *     the viewport so the composer stays visible and the pinned position is
 *     preserved)
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { ArrowDown, ChevronLeft, Paperclip } from "lucide-react";
import { ChatComposer, useViewportKeyboard } from "@henryco/chat-composer";
import type {
  AttachmentUploader,
  ComposerLabels,
  ComposerSendPayload,
  ComposerTone,
} from "@henryco/chat-composer/types";
import { buildThreadView } from "./grouping";
import type { ThreadViewItem } from "./grouping";
import {
  initialFollow,
  isNearBottom,
  onIncoming,
  onScrollPosition,
} from "./follow";
import type { FollowState } from "./follow";
import {
  emptyOutbox,
  mergeOutbox,
  outboxAck,
  outboxAppend,
  outboxFail,
  outboxRetry,
} from "./outbox";
import type { OutboxState } from "./outbox";
import { DEFAULT_CHAT_THREAD_LABELS } from "./types";
import type {
  ChatAttachment,
  ChatSendPayload,
  ChatSendResult,
  ChatThreadLabels,
  ChatThreadMessage,
} from "./types";

const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(" ");

const initialsOf = (name?: string): string => {
  if (!name) return "•";
  const words = name.trim().split(/\s+/).slice(0, 2);
  const letters = words.map((word) => word.charAt(0).toUpperCase()).join("");
  return letters || "•";
};

export type ChatThreadHeaderProps = {
  title: string;
  /** Small status line under the title (ticket status, kicker copy, …). */
  status?: ReactNode;
  backHref?: string;
  onBack?: () => void;
  /** Trailing slot — overflow menus, download buttons, harness controls. */
  actions?: ReactNode;
  /** Realtime state — renders a dot + label in the status line (no floating pill). */
  live?: "live" | "reconnecting" | null;
};

export type ChatThreadSuggestion = {
  id: string;
  label: string;
  kind?: "default" | "primary";
};

export type ChatThreadComposerOptions = {
  placeholder?: string;
  disabled?: boolean;
  tone?: ComposerTone;
  enterKeyBehavior?: "newline" | "send";
  autoFocus?: boolean;
  enableAttachments?: boolean;
  uploader?: AttachmentUploader;
  maxAttachments?: number;
  acceptedMimeTypes?: readonly string[];
  enableDraft?: boolean;
  labels?: ComposerLabels;
  textareaName?: string;
  extras?: (ctx: { draft: string; setDraft: (value: string) => void }) => ReactNode;
};

export type ChatThreadProps = {
  variant: "assistant" | "support";
  /** Stable thread identifier — keys the composer draft storage. */
  threadId: string;
  viewer: { id: string; name?: string };
  /** Host-confirmed messages, ascending by createdAt. */
  messages: ChatThreadMessage[];
  /**
   * Dispatch one message. Resolve `{ ok:true, message }` after the server
   * ack (the component reconciles the optimistic bubble), `{ ok:false,
   * reason }` on failure (the bubble flips to failed + tap-to-retry).
   * Thrown errors are treated as failures.
   */
  onSendMessage: (payload: ChatSendPayload) => Promise<ChatSendResult>;
  header: ChatThreadHeaderProps;
  /** assistant variant: show the animated typing indicator. */
  typing?: boolean;
  suggestions?: ChatThreadSuggestion[];
  onSuggestion?: (id: string) => void;
  /** Avatar node for the other party (defaults to initials). */
  otherAvatar?: ReactNode;
  /** Custom body renderer (markdown etc.). Defaults to pre-wrap text. */
  renderBody?: (message: ChatThreadMessage) => ReactNode;
  labels?: ChatThreadLabels;
  composer?: ChatThreadComposerOptions;
  /** BCP-47 locale for time/date formatting. Defaults to the browser locale. */
  locale?: string;
  /**
   * Wrap the screen in `.ct-viewport` (height 100dvh − --ct-viewport-offset
   * − keyboard inset). Hosts embedding inside their own height-constrained
   * container can leave this off.
   */
  fillViewport?: boolean;
  className?: string;
  emptyState?: ReactNode;
};

export function ChatThread(props: ChatThreadProps) {
  const {
    variant,
    threadId,
    viewer,
    messages,
    onSendMessage,
    header,
    typing = false,
    suggestions,
    onSuggestion,
    otherAvatar,
    renderBody,
    labels: labelOverrides,
    composer = {},
    locale,
    fillViewport = false,
    className,
    emptyState,
  } = props;

  const labels = useMemo(
    () => ({ ...DEFAULT_CHAT_THREAD_LABELS, ...labelOverrides }),
    [labelOverrides],
  );

  const rootRef = useRef<HTMLDivElement | null>(null);
  const paneRef = useRef<HTMLDivElement | null>(null);

  // --- optimistic outbox (ref-mirrored so rapid sends chain synchronously) ---
  const [outbox, setOutboxState] = useState<OutboxState>(() => emptyOutbox());
  const outboxRef = useRef(outbox);
  const applyOutbox = useCallback(
    (update: (state: OutboxState) => OutboxState) => {
      outboxRef.current = update(outboxRef.current);
      setOutboxState(outboxRef.current);
    },
    [],
  );

  // Acked messages the host list hasn't caught up with yet.
  const [confirmed, setConfirmed] = useState<ChatThreadMessage[]>([]);
  useEffect(() => {
    setConfirmed((prev) => {
      if (prev.length === 0) return prev;
      const next = prev.filter(
        (message) => !messages.some((candidate) => candidate.id === message.id),
      );
      return next.length === prev.length ? prev : next;
    });
  }, [messages]);

  // --- follow state (ref-mirrored for use inside layout effects) ---
  const [follow, setFollowState] = useState<FollowState>(() => initialFollow());
  const followRef = useRef(follow);
  const applyFollow = useCallback(
    (update: (state: FollowState) => FollowState) => {
      followRef.current = update(followRef.current);
      setFollowState(followRef.current);
    },
    [],
  );

  const merged = useMemo(
    () => mergeOutbox(messages, confirmed, outbox, viewer),
    [messages, confirmed, outbox, viewer],
  );
  const view = useMemo(() => buildThreadView(merged), [merged]);
  const lastMessage = merged.length > 0 ? merged[merged.length - 1] : null;

  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches),
    [],
  );

  const pinToBottom = useCallback(
    (behavior: "auto" | "smooth" = "auto") => {
      const pane = paneRef.current;
      if (!pane) return;
      if (behavior === "smooth" && !prefersReducedMotion) {
        pane.scrollTo({ top: pane.scrollHeight, behavior: "smooth" });
      } else {
        pane.scrollTop = pane.scrollHeight;
      }
    },
    [prefersReducedMotion],
  );

  // Mount pinned to the newest message instantly — no visible animation.
  const mountedRef = useRef(false);
  useLayoutEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    pinToBottom("auto");
  }, [pinToBottom]);

  // Content growth: auto-follow near the bottom, count unseen otherwise.
  const prevCountRef = useRef(merged.length);
  useLayoutEffect(() => {
    const previous = prevCountRef.current;
    prevCountRef.current = merged.length;
    if (merged.length <= previous) return;
    const own = lastMessage?.authorRole === "viewer";
    applyFollow((state) => onIncoming(state, merged.length - previous, Boolean(own)));
    if (followRef.current.following) pinToBottom("auto");
  }, [merged.length, lastMessage, applyFollow, pinToBottom]);

  // The typing indicator adds height without a count change — keep pinned.
  useEffect(() => {
    if (typing && followRef.current.following) pinToBottom("auto");
  }, [typing, pinToBottom]);

  const handleScroll = useCallback(() => {
    const pane = paneRef.current;
    if (!pane) return;
    applyFollow((state) =>
      onScrollPosition(
        state,
        isNearBottom(pane.scrollTop, pane.clientHeight, pane.scrollHeight),
      ),
    );
  }, [applyFollow]);

  // iOS keyboard: shrink the viewport by the visualViewport inset so the
  // composer stays visible; re-pin if the reader was following.
  const { bottomInset } = useViewportKeyboard(true);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.style.setProperty("--ct-kb-inset", `${bottomInset}px`);
    if (followRef.current.following) {
      requestAnimationFrame(() => pinToBottom("auto"));
    }
  }, [bottomInset, pinToBottom]);

  // --- send pipeline ---
  const payloadsRef = useRef(new Map<string, ChatSendPayload>());

  const runSend = useCallback(
    async (localId: string, payload: ChatSendPayload) => {
      let result: ChatSendResult;
      try {
        result = await onSendMessage(payload);
      } catch (error) {
        result = {
          ok: false,
          reason: error instanceof Error ? error.message : undefined,
        };
      }
      if (result.ok) {
        const message = result.message;
        if (message) {
          setConfirmed((prev) =>
            prev.some((candidate) => candidate.id === message.id)
              ? prev
              : [...prev, message],
          );
        }
        payloadsRef.current.delete(localId);
        applyOutbox((state) => outboxAck(state, localId));
      } else {
        applyOutbox((state) => outboxFail(state, localId, result.reason ?? null));
      }
    },
    [onSendMessage, applyOutbox],
  );

  const dispatchSend = useCallback(
    (payload: ChatSendPayload) => {
      const appended = outboxAppend(outboxRef.current, {
        body: payload.body,
        attachments: payload.attachments,
        now: new Date().toISOString(),
      });
      outboxRef.current = appended.state;
      setOutboxState(appended.state);
      payloadsRef.current.set(appended.localId, payload);
      applyFollow((state) => onIncoming(state, 1, true));
      void runSend(appended.localId, payload);
    },
    [applyFollow, runSend],
  );

  const retrySend = useCallback(
    (localId: string) => {
      const payload = payloadsRef.current.get(localId);
      if (!payload) return;
      applyOutbox((state) => outboxRetry(state, localId));
      void runSend(localId, payload);
    },
    [applyOutbox, runSend],
  );

  const handleComposerSend = useCallback(
    (payload: ComposerSendPayload) => {
      const attachments: ChatAttachment[] = payload.attachments
        .filter((attachment) => attachment.status === "uploaded")
        .map((attachment) => ({
          url: attachment.remote?.url ?? attachment.previewUrl ?? "",
          name: attachment.name,
          type: attachment.mimeType,
          size: attachment.size,
          width: attachment.remote?.width,
          height: attachment.remote?.height,
        }))
        .filter((attachment) => attachment.url.length > 0);
      const body = payload.text.trim();
      if (!body && attachments.length === 0) return;
      dispatchSend({
        body,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      // Resolve immediately: the optimistic bubble owns the send lifecycle
      // from here (per-message state + retry), so the composer clears now.
    },
    [dispatchSend],
  );

  // --- formatting ---
  const timeFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }),
    [locale],
  );
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    [locale],
  );

  const dayText = useCallback(
    (item: Extract<ThreadViewItem, { kind: "day" }>): string => {
      if (item.label === "today") return labels.today;
      if (item.label === "yesterday") return labels.yesterday;
      return dateFormatter.format(item.date);
    },
    [labels.today, labels.yesterday, dateFormatter],
  );

  // --- screen-reader announcements for incoming other-party messages ---
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    if (!lastMessage || lastMessage.authorRole === "viewer") return;
    const name = lastMessage.authorName || labels.systemName;
    const preview =
      lastMessage.body.length > 140
        ? `${lastMessage.body.slice(0, 140)}…`
        : lastMessage.body;
    setAnnouncement(preview ? `${name}: ${preview}` : name);
  }, [lastMessage, labels.systemName]);

  const chipVisible = !follow.following && follow.unseen > 0;

  const handleChip = useCallback(() => {
    applyFollow((state) => onScrollPosition(state, true));
    pinToBottom("smooth");
  }, [applyFollow, pinToBottom]);

  const renderGroup = (item: Extract<ThreadViewItem, { kind: "group" }>) => {
    const side =
      item.authorRole === "viewer"
        ? "own"
        : item.authorRole === "system"
          ? "system"
          : "other";
    const last = item.messages[item.messages.length - 1];
    const lastState = side === "own" ? last.deliveryState : null;
    return (
      <li key={item.key} className="ct-group" data-side={side}>
        {side === "other" ? (
          <span className="ct-avatar" aria-hidden>
            {otherAvatar ?? initialsOf(item.authorName)}
          </span>
        ) : null}
        <div className="ct-group-stack">
          {side === "other" && item.authorName ? (
            <span className="ct-group-name">{item.authorName}</span>
          ) : null}
          {item.messages.map((message, index) => {
            const position =
              item.messages.length === 1
                ? "single"
                : index === 0
                  ? "first"
                  : index === item.messages.length - 1
                    ? "last"
                    : "middle";
            return (
              <MessageBubble
                key={message.id}
                message={message}
                position={position}
                labels={labels}
                renderBody={renderBody}
                onRetry={retrySend}
              />
            );
          })}
          <span className="ct-group-meta">
            <time dateTime={last.createdAt}>
              {timeFormatter.format(new Date(last.createdAt))}
            </time>
            {variant === "support" && lastState === "sent" ? (
              <span className="ct-badge">{labels.sent}</span>
            ) : null}
            {lastState === "delivered" ? (
              <span className="ct-state-label">{labels.delivered}</span>
            ) : null}
            {lastState === "read" ? (
              <span className="ct-state-label">{labels.read}</span>
            ) : null}
          </span>
        </div>
      </li>
    );
  };

  const screen = (
    <div
      className={cx("ct-screen", !fillViewport && className)}
      data-variant={variant}
      ref={fillViewport ? undefined : rootRef}
    >
      <header className="ct-header">
        {header.backHref ? (
          <a className="ct-header-back" href={header.backHref} aria-label={labels.back}>
            <ChevronLeft aria-hidden />
          </a>
        ) : header.onBack ? (
          <button
            type="button"
            className="ct-header-back"
            onClick={header.onBack}
            aria-label={labels.back}
          >
            <ChevronLeft aria-hidden />
          </button>
        ) : null}
        <div className="ct-header-titles">
          <h1 className="ct-header-title">{header.title}</h1>
          {header.status || header.live ? (
            <p className="ct-header-status">
              {header.live ? (
                <span className="ct-live" data-state={header.live}>
                  <span className="ct-live-dot" aria-hidden />
                  {header.live === "reconnecting" ? labels.reconnecting : labels.live}
                </span>
              ) : null}
              {header.live && header.status ? (
                <span className="ct-header-sep" aria-hidden>
                  ·
                </span>
              ) : null}
              {header.status}
            </p>
          ) : null}
        </div>
        {header.actions ? <div className="ct-header-actions">{header.actions}</div> : null}
      </header>

      <div className="ct-body">
        <div
          className="ct-pane"
          ref={paneRef}
          onScroll={handleScroll}
          role="log"
          aria-label={header.title}
        >
          <div className="ct-col">
            {merged.length === 0 && emptyState ? (
              <div className="ct-empty">{emptyState}</div>
            ) : null}
            <ol className="ct-list">
              {view.map((item) =>
                item.kind === "day" ? (
                  <li key={item.key} className="ct-day" role="separator">
                    <span>{dayText(item)}</span>
                  </li>
                ) : (
                  renderGroup(item)
                ),
              )}
              {typing ? (
                <li className="ct-group" data-side="other" data-typing="true">
                  <span className="ct-avatar" aria-hidden>
                    {otherAvatar ?? "…"}
                  </span>
                  <div className="ct-group-stack">
                    <div className="ct-bubble ct-typing" role="status" aria-label={labels.typing}>
                      <span className="ct-typing-dot" aria-hidden />
                      <span className="ct-typing-dot" aria-hidden />
                      <span className="ct-typing-dot" aria-hidden />
                    </div>
                  </div>
                </li>
              ) : null}
            </ol>
          </div>
        </div>
        {chipVisible ? (
          <button type="button" className="ct-chip" onClick={handleChip}>
            <ArrowDown aria-hidden />
            {labels.newMessages}
            {follow.unseen > 1 ? ` (${follow.unseen})` : ""}
          </button>
        ) : null}
      </div>

      <div className="ct-composer">
        {suggestions && suggestions.length > 0 ? (
          <div className="ct-suggestions">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                className="ct-suggestion"
                data-kind={suggestion.kind ?? "default"}
                onClick={() => onSuggestion?.(suggestion.id)}
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        ) : null}
        <ChatComposer
          threadId={threadId}
          onSend={handleComposerSend}
          placeholder={composer.placeholder}
          tone={composer.tone ?? "neutral"}
          disabled={composer.disabled}
          enableAttachments={composer.enableAttachments ?? false}
          uploadAttachment={composer.uploader}
          maxAttachments={composer.maxAttachments}
          acceptedMimeTypes={composer.acceptedMimeTypes}
          enableDraft={composer.enableDraft ?? true}
          enableFullScreenOnMobile={false}
          autoFocus={composer.autoFocus ?? false}
          edgeToEdgeMobile
          enterKeyBehavior={composer.enterKeyBehavior ?? "newline"}
          maxRows={5}
          labels={composer.labels}
          composerExtras={
            composer.extras
              ? ({ text, setText }) => composer.extras!({ draft: text, setDraft: setText })
              : undefined
          }
          textareaName={composer.textareaName}
        />
      </div>

      <span className="ct-sr" aria-live="polite">
        {announcement}
      </span>
    </div>
  );

  if (!fillViewport) return screen;
  return (
    <div className={cx("ct-viewport", className)} ref={rootRef}>
      {screen}
    </div>
  );
}

type BubblePosition = "single" | "first" | "middle" | "last";

function MessageBubble({
  message,
  position,
  labels,
  renderBody,
  onRetry,
}: {
  message: ChatThreadMessage;
  position: BubblePosition;
  labels: Required<ChatThreadLabels>;
  renderBody?: (message: ChatThreadMessage) => ReactNode;
  onRetry: (localId: string) => void;
}) {
  const sending = message.deliveryState === "sending";
  const failed = message.deliveryState === "failed";
  const images = (message.attachments ?? []).filter((attachment) =>
    attachment.type.startsWith("image/"),
  );
  const files = (message.attachments ?? []).filter(
    (attachment) => !attachment.type.startsWith("image/"),
  );

  return (
    <div
      className="ct-msg"
      data-pos={position}
      data-state={message.deliveryState ?? undefined}
      data-ct-message-id={message.id}
    >
      <div className="ct-bubble">
        {message.body ? (
          <div className="ct-bubble-text">
            {renderBody ? renderBody(message) : message.body}
          </div>
        ) : null}
        {images.length > 0 ? (
          <div className="ct-media-grid" data-count={images.length === 1 ? "one" : "many"}>
            {images.map((image) => (
              <a
                key={image.url}
                className="ct-media"
                href={image.url}
                target="_blank"
                rel="noreferrer noopener"
                style={{
                  aspectRatio:
                    image.width && image.height
                      ? `${image.width} / ${image.height}`
                      : "4 / 3",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.name} loading="lazy" />
              </a>
            ))}
          </div>
        ) : null}
        {files.length > 0 ? (
          <ul className="ct-files">
            {files.map((file) => (
              <li key={file.url}>
                <a
                  className="ct-file"
                  href={file.url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Paperclip aria-hidden />
                  <span>{file.name}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {sending ? <span className="ct-msg-state">{labels.sending}</span> : null}
      {failed ? (
        <button type="button" className="ct-retry" onClick={() => onRetry(message.id)}>
          {message.failReason ? `${message.failReason} · ` : ""}
          {labels.retry}
        </button>
      ) : null}
    </div>
  );
}
