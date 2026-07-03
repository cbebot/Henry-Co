"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  LoaderCircle,
  MessagesSquare,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  buildChatThreadLabels,
  buildMessagingChromeLabels,
  translateSurfaceLabel,
} from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { clearDraft, loadDraft, saveDraft, useFormDraft } from "@henryco/lifecycle/drafts";
import {
  ChatThread,
  type ChatSendPayload,
  type ChatSendResult,
  type ChatThreadMessage,
  type ChatThreadSuggestion,
} from "@henryco/chat-thread";
import {
  continueStudioBriefChatAction,
} from "@/lib/studio/brief-chat-action";
import {
  BRIEF_CHAT_MIN_FINALIZE_TURNS,
  BRIEF_CHAT_OPENER,
  assembleChatDescription,
  countAssistantTurns,
  inferServiceKindFromProjectType,
  synthesizeBriefFromTranscript,
  type BriefChatMessage,
} from "@/lib/studio/brief-chat";
import {
  BRIEF_STORE_KEY,
  BRIEF_STORE_VERSION,
  createConversation,
  deleteConversation,
  emptyBriefStore,
  getActiveConversation,
  migrateLegacyTranscript,
  setActiveConversation,
  sortedConversations,
  updateConversation,
  type BriefChatStore,
  type StoredBriefChat,
} from "@/lib/studio/brief-conversations";
import { generateStudioBriefDraftAction } from "@/lib/studio/brief-copilot-action";
import type { StudioRequestConfig } from "@/lib/studio/request-config";
import {
  STUDIO_BRIEF_DRAFT_KEY,
  STUDIO_BRIEF_DRAFT_VERSION,
  structuredToDraft,
} from "@/lib/studio/request-fields";
import type { StudioService } from "@/lib/studio/types";

const LEGACY_TRANSCRIPT_KEY = "studio-copilot-chat";

/**
 * CopilotChat — the "Talk it through" on-ramp, rendered on the shared
 * @henryco/chat-thread screen (assistant variant), now with a WhatsApp-style
 * brief list: every conversation is its own brief, headed by the buyer's own
 * words. The header offers the list and a "new brief" action; the list shows
 * title, latest line, progress, and a Ready badge, and hands back into the
 * chat on tap.
 *
 * The intake pipeline per conversation is unchanged: opener never stored
 * (user-first alternating contract), model-only engine with honest failure
 * copy (no scripted stand-ins — abuse is limited by rules server-side),
 * model-reported progress in the header, ready → composer lock + graceful
 * auto-handoff into /request/build.
 */
export function CopilotChat({
  services,
  requestConfig,
  preferredTeamId,
}: {
  services: StudioService[];
  requestConfig: StudioRequestConfig;
  preferredTeamId: string | null;
}) {
  const locale = useHenryCoLocale();
  const t = useCallback(
    (text: string) => translateSurfaceLabel(locale, text),
    [locale],
  );
  const router = useRouter();

  const storeDraft = useFormDraft<BriefChatStore>(BRIEF_STORE_KEY, emptyBriefStore(), {
    version: BRIEF_STORE_VERSION,
  });
  const store = storeDraft.value;
  const setStore = storeDraft.setValue;

  // One-time upgrade from the single-transcript era: an in-flight brief
  // becomes the first conversation, then the legacy envelope is cleared.
  const migratedRef = useRef(false);
  useEffect(() => {
    if (migratedRef.current) return;
    migratedRef.current = true;
    const legacy = loadDraft<BriefChatMessage[]>(LEGACY_TRANSCRIPT_KEY);
    const legacyMessages = Array.isArray(legacy?.value) ? legacy.value : null;
    if (!legacyMessages || legacyMessages.length === 0) return;
    setStore((prev) => migrateLegacyTranscript(prev, legacyMessages, { now: Date.now() }) ?? prev);
    clearDraft(LEGACY_TRANSCRIPT_KEY);
  }, [setStore]);

  const active = getActiveConversation(store);
  const conversations = useMemo(() => sortedConversations(store), [store]);

  // list ⟷ chat. Land in the chat (that is what "Talk it through" promises);
  // the list is one tap away in the header.
  const [view, setView] = useState<"chat" | "list">("chat");
  const [sending, setSending] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  // Auto-handoff must only follow a LIVE ready transition — reopening an
  // already-ready conversation from the list stays put (manual chip only).
  const [liveReadyId, setLiveReadyId] = useState<string | null>(null);

  const messages = useMemo(() => active?.messages ?? [], [active]);
  const ready = active?.ready ?? false;
  const progress = active?.progress ?? 0;
  const assistantTurns = countAssistantTurns(messages);
  const canFinalize = ready || assistantTurns >= BRIEF_CHAT_MIN_FINALIZE_TURNS;

  // The stored transcript carries no timestamps — synthesize a stable
  // per-mount timeline so ordering is deterministic. Timestamps and day
  // pills are hidden on this surface (showTimestamps/showDaySeparators off).
  const baseTimeRef = useRef(Date.now());

  // Conversations are append-only (turns are never edited or reordered), so
  // conversation-scoped index ids are stable React keys.
  const chatMessages = useMemo<ChatThreadMessage[]>(() => {
    const conversationKey = active?.id ?? "none";
    const list: ChatThreadMessage[] = [
      {
        id: `${conversationKey}-opener`,
        authorId: "assistant",
        authorRole: "other",
        body: t(BRIEF_CHAT_OPENER),
        createdAt: new Date(baseTimeRef.current).toISOString(),
      },
    ];
    messages.forEach((message, index) => {
      list.push({
        id: `${conversationKey}-t-${index}`,
        authorId: message.role === "user" ? "viewer" : "assistant",
        authorRole: message.role === "user" ? "viewer" : "other",
        body: message.content,
        createdAt: new Date(baseTimeRef.current + (index + 1) * 1000).toISOString(),
      });
    });
    return list;
  }, [messages, active?.id, t]);

  const threadLabels = useMemo(() => buildChatThreadLabels(t), [t]);
  const { composerLabels } = useMemo(() => buildMessagingChromeLabels(t), [t]);

  const startNewBrief = useCallback(() => {
    setStore((prev) => createConversation(prev, { now: Date.now() }).store);
    setView("chat");
  }, [setStore]);

  const openConversation = useCallback(
    (id: string) => {
      setStore((prev) => setActiveConversation(prev, id));
      setView("chat");
    },
    [setStore],
  );

  const removeConversation = useCallback(
    (id: string) => {
      setStore((prev) => deleteConversation(prev, id));
    },
    [setStore],
  );

  const sendMessage = useCallback(
    async ({ body }: ChatSendPayload): Promise<ChatSendResult> => {
      // Lazily materialise the conversation on first send.
      let conversationId = active?.id ?? null;
      let base = messages;
      if (!conversationId) {
        const created = createConversation(store, { now: Date.now() });
        conversationId = created.id;
        base = getActiveConversation(created.store)?.messages ?? [];
        setStore(created.store);
      }
      const next: BriefChatMessage[] = [...base, { role: "user", content: body }];
      setSending(true);
      try {
        const result = await continueStudioBriefChatAction({ messages: next });
        if (!result.ok) {
          return { ok: false, reason: t(result.message) };
        }
        const withReply: BriefChatMessage[] = [
          ...next,
          { role: "assistant", content: result.turn.reply },
        ];
        setStore((prev) =>
          updateConversation(prev, conversationId!, {
            messages: withReply,
            ready: result.turn.ready,
            progress: result.turn.progress,
            now: Date.now(),
          }),
        );
        if (result.turn.ready) setLiveReadyId(conversationId);
        return {
          ok: true,
          message: {
            id: `${conversationId}-t-${next.length - 1}`,
            authorId: "viewer",
            authorRole: "viewer",
            body,
            createdAt: new Date(
              baseTimeRef.current + next.length * 1000,
            ).toISOString(),
          },
        };
      } catch {
        // Network failure — the bubble keeps the text with inline retry.
        return { ok: false, reason: t("That didn't go through. Try sending again.") };
      } finally {
        setSending(false);
      }
    },
    [active?.id, messages, store, setStore, t],
  );

  const finalize = useCallback(async () => {
    if (finalizing) return;
    setFinalizing(true);

    const description = assembleChatDescription(messages);
    let structured = synthesizeBriefFromTranscript(messages);
    try {
      const formData = new FormData();
      formData.set("description", description);
      const result = await generateStudioBriefDraftAction(formData);
      if (result.ok) structured = result.structured;
    } catch {
      // One-shot synthesis unreachable — the local backstop stands in so the
      // conversation still becomes a real, editable brief.
    }

    const serviceKind = inferServiceKindFromProjectType(structured.projectType);
    const draftValue = structuredToDraft(structured, {
      config: requestConfig,
      services,
      serviceKind,
      preferredTeamId,
    });

    saveDraft({
      key: STUDIO_BRIEF_DRAFT_KEY,
      // Land on Scope (step 1): project shape is decided, so the buyer
      // reviews pre-filled capabilities and honest pricing next.
      value: { ...draftValue, stepIndex: 1 },
      savedAt: Date.now(),
      version: STUDIO_BRIEF_DRAFT_VERSION,
    });

    if (active?.id) {
      setStore((prev) =>
        updateConversation(prev, active.id, { finalizedAt: Date.now(), now: Date.now() }),
      );
    }

    router.push("/request/build");
  }, [finalizing, messages, preferredTeamId, requestConfig, router, services, active?.id, setStore]);

  // Auto-handoff: the moment the coach reports the brief is complete, close
  // the conversation gracefully and build the brief — no dead-end chatting
  // after "that's everything I need". A short beat first so the person reads
  // the closing line; the manual chip stays as backup. Only fires for the
  // conversation whose ready arrived in THIS session (liveReadyId).
  useEffect(() => {
    if (!ready || finalizing || !active || active.id !== liveReadyId) return;
    const timer = setTimeout(() => void finalize(), 1400);
    return () => clearTimeout(timer);
  }, [ready, finalizing, active, liveReadyId, finalize]);

  // Quick-reply chips: example briefs to start; the finalize CTA once the
  // conversation has enough shape (backup while the auto-handoff beat runs).
  // Hidden while a turn is in flight so a second dispatch can't race the
  // alternating-turn contract.
  const suggestions = useMemo<ChatThreadSuggestion[]>(() => {
    if (sending || finalizing) return [];
    if (canFinalize) {
      return [{ id: "finalize", label: t("Build my brief"), kind: "primary" }];
    }
    if (messages.length === 0) {
      return [
        {
          id: "example-brand",
          label: t("A logo and brand kit for my café"),
          text: t("A logo and brand kit for my café"),
        },
        {
          id: "example-site",
          label: t("A simple website for my consulting business"),
          text: t("A simple website for my consulting business"),
        },
        {
          id: "example-photo",
          label: t("Product photos for my online store"),
          text: t("Product photos for my online store"),
        },
      ];
    }
    return [];
  }, [sending, finalizing, canFinalize, messages.length, t]);

  const handleSuggestion = useCallback(
    (id: string) => {
      if (id === "finalize") void finalize();
    },
    [finalize],
  );

  // Header status: the model-reported completeness once the conversation is
  // moving; the ready hand-off line once the coach closes; the kicker before.
  const headerStatus = ready ? (
    <span role="status">
      {active?.id === liveReadyId
        ? t("Your brief is ready — building it now…")
        : t("This brief is ready.")}
    </span>
  ) : progress > 0 ? (
    <span className="studio-chat-progress">
      <span>{t("Brief progress")}</span>
      <span
        className="studio-chat-progress__track"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("Brief progress")}
      >
        <span
          className="studio-chat-progress__fill"
          style={{ width: `${progress}%` }}
        />
      </span>
      <span aria-hidden>{progress}%</span>
    </span>
  ) : (
    t("Talk it through")
  );

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
      }),
    [locale],
  );

  if (finalizing) {
    return (
      <div className="studio-chat-stage">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <LoaderCircle className="h-6 w-6 animate-spin text-[var(--studio-signal)]" />
          <p className="text-[14px] font-semibold text-[var(--studio-ink)]">
            {t("Shaping your brief…")}
          </p>
          <p className="max-w-sm text-[12.5px] leading-6 text-[var(--studio-ink-soft)]">
            {t("Pulling our conversation into a clear plan with honest pricing.")}
          </p>
        </div>
      </div>
    );
  }

  if (view === "list") {
    return (
      <div className="studio-chat-stage">
        <div className="studio-brieflist">
          <header className="studio-brieflist__bar">
            <button
              type="button"
              className="studio-brieflist__back"
              onClick={() => router.push("/request")}
              aria-label={t("Back")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="studio-brieflist__titles">
              <h1>{t("Your briefs")}</h1>
              <p>{t("Every conversation becomes a brief you can finish any time.")}</p>
            </div>
            <button
              type="button"
              className="studio-brieflist__new"
              onClick={startNewBrief}
            >
              <Plus aria-hidden />
              {t("New brief")}
            </button>
          </header>
          <div className="studio-brieflist__scroll">
            {conversations.length === 0 ? (
              <div className="studio-brieflist__empty">
                <MessagesSquare aria-hidden />
                <p>{t("No briefs yet — start your first one.")}</p>
                <button type="button" className="studio-brieflist__new" onClick={startNewBrief}>
                  <Plus aria-hidden />
                  {t("New brief")}
                </button>
              </div>
            ) : (
              <ul className="studio-brieflist__list">
                {conversations.map((conversation) => (
                  <BriefRow
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === store.activeId}
                    onOpen={() => openConversation(conversation.id)}
                    onDelete={() => removeConversation(conversation.id)}
                    t={t}
                    timeFormatter={timeFormatter}
                  />
                ))}
              </ul>
            )}
          </div>
          <footer className="studio-brieflist__foot">
            {t("Prefer full control?")}{" "}
            <Link href="/request/build">{t("Build it yourself →")}</Link>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="studio-chat-stage">
      <ChatThread
        variant="assistant"
        threadId={active ? `studio-copilot:${active.id}` : "studio-copilot"}
        viewer={{ id: "viewer" }}
        messages={chatMessages}
        onSendMessage={sendMessage}
        header={{
          title: active?.title || t("Describe it in your words"),
          status: headerStatus,
          onBack: () =>
            conversations.length > 0 ? setView("list") : router.push("/request"),
          actions: (
            <>
              <button
                type="button"
                className="studio-chat-stage__action"
                onClick={() => setView("list")}
                aria-label={t("Your briefs")}
                title={t("Your briefs")}
              >
                <MessagesSquare aria-hidden />
                {conversations.length > 1 ? (
                  <span className="studio-chat-stage__count">{conversations.length}</span>
                ) : null}
              </button>
              <button
                type="button"
                className="studio-chat-stage__action"
                onClick={startNewBrief}
                aria-label={t("New brief")}
                title={t("New brief")}
              >
                <Plus aria-hidden />
              </button>
            </>
          ),
        }}
        typing={sending}
        suggestions={suggestions}
        onSuggestion={handleSuggestion}
        otherAvatar={<Sparkles aria-hidden />}
        labels={threadLabels}
        locale={locale}
        showDaySeparators={false}
        showTimestamps={false}
        fillViewport
        composer={{
          placeholder: t("Type your reply…"),
          // "neutral" = the composer's dark teal pair (#0E7C86/#0A5C63) —
          // same family as the public studio accent AND AA with the send
          // button's white label; the "studio" tone is the dashboard gold.
          tone: "neutral",
          busy: sending,
          // The coach closed the conversation — no further replies are
          // expected while the auto-handoff builds the brief.
          disabled: ready,
          autoFocus: true,
          enterKeyBehavior: "send",
          enableAttachments: false,
          labels: composerLabels,
        }}
      />
    </div>
  );
}

function BriefRow({
  conversation,
  isActive,
  onOpen,
  onDelete,
  t,
  timeFormatter,
}: {
  conversation: StoredBriefChat;
  isActive: boolean;
  onOpen: () => void;
  onDelete: () => void;
  t: (text: string) => string;
  timeFormatter: Intl.DateTimeFormat;
}) {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const snippet = lastMessage
    ? lastMessage.content.replace(/\s+/g, " ").trim()
    : t("Not started yet");
  return (
    <li className="studio-brieflist__row" data-active={isActive || undefined}>
      <button type="button" className="studio-brieflist__open" onClick={onOpen}>
        <span className="studio-brieflist__row-top">
          <span className="studio-brieflist__title">
            {conversation.title || t("New brief")}
          </span>
          <time className="studio-brieflist__time">
            {timeFormatter.format(new Date(conversation.updatedAt))}
          </time>
        </span>
        <span className="studio-brieflist__row-bottom">
          <span className="studio-brieflist__snippet">{snippet}</span>
          {conversation.ready ? (
            <span className="studio-brieflist__badge" data-kind="ready">
              <CheckCircle2 aria-hidden />
              {conversation.finalizedAt ? t("Brief built") : t("Ready")}
            </span>
          ) : conversation.progress > 0 ? (
            <span className="studio-brieflist__badge">{conversation.progress}%</span>
          ) : null}
        </span>
      </button>
      <button
        type="button"
        className="studio-brieflist__delete"
        onClick={onDelete}
        aria-label={t("Delete brief")}
        title={t("Delete brief")}
      >
        <Trash2 aria-hidden />
      </button>
    </li>
  );
}
