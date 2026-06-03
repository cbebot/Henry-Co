"use client";

import { Sparkles, User } from "lucide-react";
import type { BriefChatRole } from "@/lib/studio/brief-chat";

/**
 * ChatMessage — one transcript bubble.
 *
 * Presentational only. Assistant turns lead with a signal-accented avatar
 * and sit left; the buyer's turns sit right in a softer panel. Content is
 * rendered as a JSX expression (conversational text, not UI chrome) so it
 * is not subject to surface-label translation.
 */
export function ChatMessage({
  role,
  content,
}: {
  role: BriefChatRole;
  content: string;
}) {
  const isAssistant = role === "assistant";

  return (
    <div className={["flex gap-3", isAssistant ? "justify-start" : "justify-end"].join(" ")}>
      {isAssistant ? (
        <span
          aria-hidden
          className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--home-accent)] bg-[color:var(--home-accent-soft)] text-[var(--studio-signal)]"
        >
          <Sparkles className="h-4 w-4" />
        </span>
      ) : null}
      <div
        className={[
          "max-w-[80%] rounded-[1.1rem] px-4 py-3 text-[14px] leading-7",
          isAssistant
            ? "border border-[var(--studio-line)] bg-[color:var(--home-surface)] text-[var(--studio-ink)]"
            : "bg-[color:var(--home-accent-soft)] text-[var(--studio-ink)]",
        ].join(" ")}
      >
        {content}
      </div>
      {isAssistant ? null : (
        <span
          aria-hidden
          className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--studio-line)] bg-[color:var(--home-surface)] text-[var(--studio-ink-soft)]"
        >
          <User className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}
