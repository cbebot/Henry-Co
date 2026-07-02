"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import {
  buildChatThreadLabels,
  buildMessagingChromeLabels,
  translateSurfaceLabel,
} from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { saveDraft, useFormDraft } from "@henryco/lifecycle/drafts";
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
import { generateStudioBriefDraftAction } from "@/lib/studio/brief-copilot-action";
import type { StudioRequestConfig } from "@/lib/studio/request-config";
import {
  STUDIO_BRIEF_DRAFT_KEY,
  STUDIO_BRIEF_DRAFT_VERSION,
  structuredToDraft,
} from "@/lib/studio/request-fields";
import type { StudioService } from "@/lib/studio/types";

const CHAT_TRANSCRIPT_KEY = "studio-copilot-chat";
const CHAT_TRANSCRIPT_VERSION = 1;

/**
 * CopilotChat — the "Talk it through" on-ramp, rendered on the shared
 * @henryco/chat-thread screen (assistant variant): fixed 100dvh viewport,
 * compact header, contained scroll, optimistic per-message send state with
 * inline retry, animated typing indicator, and suggested-reply chips.
 *
 * The intake pipeline is unchanged: transcript persisted in its own draft
 * envelope ("studio-copilot-chat" v1, opener NEVER stored — the server
 * action requires user-first alternating turns), model-only engine with
 * validated envelopes, and finalize converges on the same submit contract
 * as every on-ramp (assemble → one-shot synthesis with a local backstop →
 * staged draft → /request/build). The model reports brief completeness
 * (0-100) each turn — surfaced as a slim progress bar in the header — and
 * when it declares the brief ready the conversation closes gracefully and
 * auto-finalizes after a short beat.
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

  const transcript = useFormDraft<BriefChatMessage[]>(CHAT_TRANSCRIPT_KEY, [], {
    version: CHAT_TRANSCRIPT_VERSION,
  });
  const [sending, setSending] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const autoFinalized = useRef(false);

  const messages = transcript.value;
  const assistantTurns = countAssistantTurns(messages);
  const canFinalize = ready || assistantTurns >= BRIEF_CHAT_MIN_FINALIZE_TURNS;

  // The stored transcript carries no timestamps — synthesize a stable
  // per-mount timeline so ordering is deterministic. Timestamps and day
  // pills are hidden on this surface (showTimestamps/showDaySeparators off).
  const baseTimeRef = useRef(Date.now());

  // The transcript is append-only (turns are never edited, removed, or
  // reordered — finalize navigates away), so index-derived ids are stable
  // React keys for the lifetime of the surface.
  const chatMessages = useMemo<ChatThreadMessage[]>(() => {
    const list: ChatThreadMessage[] = [
      {
        id: "opener",
        authorId: "assistant",
        authorRole: "other",
        body: t(BRIEF_CHAT_OPENER),
        createdAt: new Date(baseTimeRef.current).toISOString(),
      },
    ];
    messages.forEach((message, index) => {
      list.push({
        id: `t-${index}`,
        authorId: message.role === "user" ? "viewer" : "assistant",
        authorRole: message.role === "user" ? "viewer" : "other",
        body: message.content,
        createdAt: new Date(baseTimeRef.current + (index + 1) * 1000).toISOString(),
      });
    });
    return list;
  }, [messages, t]);

  const threadLabels = useMemo(() => buildChatThreadLabels(t), [t]);
  const { composerLabels } = useMemo(() => buildMessagingChromeLabels(t), [t]);

  const sendMessage = useCallback(
    async ({ body }: ChatSendPayload): Promise<ChatSendResult> => {
      const next: BriefChatMessage[] = [
        ...transcript.value,
        { role: "user", content: body },
      ];
      setSending(true);
      try {
        const result = await continueStudioBriefChatAction({ messages: next });
        if (!result.ok) {
          return { ok: false, reason: t(result.message) };
        }
        transcript.setValue([
          ...next,
          { role: "assistant", content: result.turn.reply },
        ]);
        setReady(result.turn.ready);
        setProgress(result.turn.progress);
        return {
          ok: true,
          message: {
            id: `t-${next.length - 1}`,
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
    [transcript, t],
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

    router.push("/request/build");
  }, [finalizing, messages, preferredTeamId, requestConfig, router, services]);

  // Auto-handoff: the moment the coach reports the brief is complete, close
  // the conversation gracefully and build the brief — no dead-end chatting
  // after "that's everything I need". A short beat first so the person reads
  // the closing line; the manual chip stays as backup before that fires.
  useEffect(() => {
    if (!ready || finalizing || autoFinalized.current) return;
    autoFinalized.current = true;
    const timer = setTimeout(() => void finalize(), 1400);
    return () => clearTimeout(timer);
  }, [ready, finalizing, finalize]);

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
    <span role="status">{t("Your brief is ready — building it now…")}</span>
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

  return (
    <div className="studio-chat-stage">
      <ChatThread
        variant="assistant"
        threadId="studio-copilot"
        viewer={{ id: "viewer" }}
        messages={chatMessages}
        onSendMessage={sendMessage}
        header={{
          title: t("Describe it in your words"),
          status: headerStatus,
          onBack: () => router.push("/request"),
          actions: (
            <Link
              href="/request/build"
              className="studio-chat-stage__escape"
              title={t("Prefer full control?")}
            >
              {t("Build it yourself →")}
            </Link>
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
