"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, LoaderCircle, SendHorizontal, SlidersHorizontal } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { saveDraft, useFormDraft } from "@henryco/lifecycle/drafts";
import { ChatMessage } from "@/components/studio/copilot-chat/chat-message";
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
 * CopilotChat — the "Talk it through" on-ramp.
 *
 * Runs a short intake conversation (model-driven when a key is present,
 * a deterministic coach-prompt walk otherwise), persisting the transcript
 * in its own draft envelope. On finish it assembles the buyer's words into
 * one description, reuses the proven one-shot synthesis to structure it
 * (with a local backstop so it never dead-ends), stages a `studio-brief-new`
 * draft on the Scope step, then routes to /request/build — the same submit
 * contract every on-ramp converges on.
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
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const router = useRouter();

  const transcript = useFormDraft<BriefChatMessage[]>(CHAT_TRANSCRIPT_KEY, [], {
    version: CHAT_TRANSCRIPT_VERSION,
  });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = transcript.value;
  const assistantTurns = countAssistantTurns(messages);
  const canFinalize = ready || assistantTurns >= BRIEF_CHAT_MIN_FINALIZE_TURNS;
  const hasStarted = messages.length > 0;

  // Keep the latest turn in view as the conversation grows.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, sending, finalizing]);

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending || finalizing) return;

    const nextMessages: BriefChatMessage[] = [...messages, { role: "user", content: trimmed }];
    transcript.setValue(nextMessages);
    setInput("");
    setError(null);
    setSending(true);

    try {
      const result = await continueStudioBriefChatAction({ messages: nextMessages });
      if (result.ok) {
        transcript.setValue((prev) => [...prev, { role: "assistant", content: result.turn.reply }]);
        setReady(result.turn.ready);
      } else {
        setError(result.message);
      }
    } catch {
      // Network failure — invite a retry rather than dead-ending the lane.
      // Stored canonical; translated at render so the callback stays stable.
      setError("That didn't go through. Try sending again.");
    } finally {
      setSending(false);
    }
  }, [finalizing, input, messages, sending, transcript]);

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

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void send();
      }
    },
    [send],
  );

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Compact header — kicker + small h1. No oversized headline chrome. */}
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--studio-signal)]">
          {t("Talk it through")}
        </p>
        <h1 className="mt-2 text-[1.5rem] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--studio-ink)] sm:text-[1.8rem]">
          {t("Describe it in your words")}
        </h1>
      </header>

      <div className="studio-panel rounded-[1.6rem] p-5 sm:p-7">
        {finalizing ? (
          <div className="flex min-h-[16rem] flex-col items-center justify-center gap-3 text-center">
            <LoaderCircle className="h-6 w-6 animate-spin text-[var(--studio-signal)]" />
            <p className="text-[14px] font-semibold text-[var(--studio-ink)]">
              {t("Shaping your brief…")}
            </p>
            <p className="max-w-sm text-[12.5px] leading-6 text-[var(--studio-ink-soft)]">
              {t("Pulling our conversation into a clear plan with honest pricing.")}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {/* Static opener — always shown above the live transcript. */}
              <ChatMessage role="assistant" content={t(BRIEF_CHAT_OPENER)} />
              {messages.map((message, index) => (
                <ChatMessage key={index} role={message.role} content={message.content} />
              ))}
              {sending ? (
                <p className="pl-11 text-[12.5px] italic text-[var(--studio-ink-soft)]">
                  {t("Thinking…")}
                </p>
              ) : null}
              <div ref={bottomRef} />
            </div>

            {error ? (
              <p className="mt-4 text-[12.5px] leading-6 text-[color:var(--studio-warn,_#d99a13)]">
                {t(error)}
              </p>
            ) : null}

            <div className="mt-6 border-t border-[var(--studio-line)] pt-5">
              <div className="flex items-end gap-3">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={onKeyDown}
                  rows={2}
                  placeholder={t("Type your reply…")}
                  className="studio-textarea flex-1 rounded-[1rem] px-4 py-3 leading-7"
                />
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={!input.trim() || sending}
                  aria-label={t("Send")}
                  className="studio-button-primary inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <SendHorizontal className="h-4 w-4" />
                </button>
              </div>

              {canFinalize ? (
                <button
                  type="button"
                  onClick={() => void finalize()}
                  className="studio-button-primary mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-semibold"
                >
                  {t("Build my brief")}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <p className="mt-4 text-center text-[12px] leading-6 text-[var(--studio-ink-soft)]">
                  {hasStarted
                    ? t("Keep going — a few more answers and we'll shape your brief.")
                    : t("Send your first message to begin.")}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Calm escape hatch — for buyers who'd rather drive every field. */}
      <p className="flex items-center gap-2 text-[13px] leading-7 text-[var(--studio-ink-soft)]">
        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-[var(--studio-signal)]" />
        {t("Prefer full control?")}{" "}
        <Link
          href="/request/build"
          className="font-semibold text-[var(--studio-signal)] underline-offset-4 transition hover:underline"
        >
          {t("Build it yourself →")}
        </Link>
      </p>
    </div>
  );
}
