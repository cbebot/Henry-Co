"use client";

import type { TypingIndicator as TypingIndicatorType } from "@/lib/messaging/types";

type Props = {
  typists: TypingIndicatorType[];
};

/**
 * Animated typing indicator. Appears below the latest message when one
 * or more remote users are typing. Spec mandates STAGGERED FADE — not
 * a bounce — so it reads as professional rather than cartoonish.
 */
export function TypingIndicator({ typists }: Props) {
  if (typists.length === 0) return null;

  const label = describeTypists(typists);

  return (
    <div
      className="flex items-center gap-2 px-2 pb-2 motion-safe:animate-[studio-msg-fade-in_180ms_ease-out]"
      role="status"
      aria-live="polite"
      aria-label={`${label} typing`}
    >
      <span className="text-[11px] font-medium tracking-[0.005em] text-white/55">
        {label}
      </span>
      <span
        className="inline-flex items-center gap-[3px] rounded-full border border-white/[0.06] bg-[#0F1524] px-2.5 py-1.5"
        aria-hidden
      >
        <Dot delay="0ms" />
        <Dot delay="200ms" />
        <Dot delay="400ms" />
      </span>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="block h-1.5 w-1.5 rounded-full bg-white/55 motion-safe:animate-[studio-msg-typing-dot_1200ms_ease-in-out_infinite]"
      style={{ animationDelay: delay }}
    />
  );
}

function describeTypists(typists: TypingIndicatorType[]): string {
  if (typists.length === 0) return "";
  if (typists.length === 1) return `${typists[0].displayName} is typing`;
  if (typists.length === 2) {
    return `${typists[0].displayName} and ${typists[1].displayName} are typing`;
  }
  return `${typists[0].displayName} and ${typists.length - 1} others are typing`;
}
