"use client";

import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";
import { REACTIONS, type ReactionEmoji } from "@/lib/messaging/constants";
import type { MessageReaction } from "@/lib/messaging/types";

type ReactionDisplayProps = {
  reactions: MessageReaction[];
  onToggle: (emoji: ReactionEmoji) => void;
  /** True when the bubble is on the right (own message). Influences tone. */
  ownTone?: boolean;
  busy?: ReactionEmoji | null;
};

/**
 * Compact reaction summary rendered below a bubble. Tapping a chip
 * toggles the viewer's reaction (idempotent — adding twice removes).
 * The count animates with a small scale pulse on change.
 */
export function ReactionDisplay({
  reactions,
  onToggle,
  ownTone,
  busy,
}: ReactionDisplayProps) {
  if (reactions.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {reactions.map((reaction) => {
        const isApplied = reaction.appliedByViewer;
        const baseToneCls = ownTone
          ? isApplied
            ? "border-white/40 bg-white/15 text-[#F5F4EE]"
            : "border-white/15 bg-white/5 text-[#F5F4EE]/85 hover:bg-white/10"
          : isApplied
            ? "border-[#d4b14e]/55 bg-[#d4b14e]/15 text-[#F5F4EE]"
            : "border-white/[0.06] bg-white/[0.03] text-white/70 hover:bg-white/[0.06]";
        const isBusy = busy === reaction.emoji;
        return (
          <button
            key={reaction.emoji}
            type="button"
            onClick={() => onToggle(reaction.emoji)}
            disabled={isBusy}
            aria-pressed={isApplied}
            aria-label={`${labelFor(reaction.emoji)} reaction, ${reaction.count}`}
            className={`group inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all ${baseToneCls} ${
              isBusy ? "opacity-60" : ""
            }`}
          >
            <span aria-hidden className="text-[13px] leading-none">
              {reaction.emoji}
            </span>
            <span
              key={reaction.count}
              className="tabular-nums motion-safe:animate-[studio-msg-count-pulse_220ms_ease-out]"
            >
              {reaction.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

type ReactionPickerProps = {
  open: boolean;
  onPick: (emoji: ReactionEmoji) => void;
  onClose: () => void;
  /** Anchor element to position the popover relative to. */
  anchor?: HTMLElement | null;
  /** Force the popover to align right (own messages). */
  alignRight?: boolean;
};

/**
 * Floating reaction picker — six curated options. Keyboard navigable:
 * arrow keys move focus, Enter applies. Escape closes.
 */
export function ReactionPicker({
  open,
  onPick,
  onClose,
  alignRight,
}: ReactionPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [focusIdx, setFocusIdx] = useState(0);

  useEffect(() => {
    if (!open) return;
    setFocusIdx(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        setFocusIdx((idx) => (idx + 1) % REACTIONS.length);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        setFocusIdx((idx) => (idx - 1 + REACTIONS.length) % REACTIONS.length);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const emoji = REACTIONS[focusIdx]?.emoji;
        if (emoji) onPick(emoji);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, focusIdx, onPick, onClose]);

  useEffect(() => {
    if (!open) return;
    const buttons = containerRef.current?.querySelectorAll("button");
    const target = buttons?.[focusIdx] as HTMLButtonElement | undefined;
    target?.focus();
  }, [focusIdx, open]);

  if (!open) return null;
  return (
    <div
      ref={containerRef}
      role="menu"
      aria-label="React with"
      className={`absolute -top-12 z-30 flex items-center gap-1 rounded-full border border-white/[0.06] bg-[#0A0E1A]/95 px-1.5 py-1.5 shadow-[0_18px_48px_-18px_rgba(0,0,0,0.6)] backdrop-blur-sm motion-safe:animate-[studio-msg-fade-in_140ms_ease-out] ${
        alignRight ? "right-0" : "left-0"
      }`}
    >
      {REACTIONS.map((reaction, idx) => (
        <button
          key={reaction.emoji}
          type="button"
          role="menuitem"
          onClick={() => onPick(reaction.emoji)}
          onMouseEnter={() => setFocusIdx(idx)}
          className={`group relative flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-110 hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4b14e] ${
            focusIdx === idx ? "bg-white/[0.06]" : ""
          }`}
          aria-label={reaction.hint}
        >
          <span aria-hidden className="text-[18px] leading-none">
            {reaction.emoji}
          </span>
          <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0F1524] px-2 py-0.5 text-[10px] font-medium text-white/85 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            {reaction.label}
          </span>
        </button>
      ))}
    </div>
  );
}

function labelFor(emoji: string): string {
  const found = REACTIONS.find((r) => r.emoji === emoji);
  return found?.label || "React";
}
