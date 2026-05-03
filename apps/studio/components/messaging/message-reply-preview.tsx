"use client";

import { CornerUpLeft, X } from "lucide-react";
import type { ReplyPreview } from "@/lib/messaging/types";

type ComposerPreviewProps = {
  preview: ReplyPreview;
  onCancel: () => void;
};

/**
 * Quoted-original block above the composer when the user is composing
 * a reply. Cancel restores the composer to a normal send.
 */
export function ReplyComposerPreview({ preview, onCancel }: ComposerPreviewProps) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-[#0A0E1A] px-3 py-2"
      data-reply-preview="composer"
    >
      <span
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#d4b14e]/15 text-[#d4b14e]"
        aria-hidden
      >
        <CornerUpLeft className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1 border-l-2 border-[#d4b14e] pl-3">
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#d4b14e]">
          Replying to {preview.senderName}
        </div>
        <p className="mt-0.5 truncate text-[12px] text-white/70">
          {preview.bodyExcerpt || "(no content)"}
        </p>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="shrink-0 rounded-full p-1 text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white/80"
        aria-label="Cancel reply"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

type BubblePreviewProps = {
  preview: ReplyPreview;
  ownTone?: boolean;
  onJump?: (messageId: string) => void;
};

/**
 * Quoted-original block embedded inside a sent-reply bubble. Tap to
 * scroll the conversation to the original message.
 */
export function ReplyBubblePreview({
  preview,
  ownTone,
  onJump,
}: BubblePreviewProps) {
  const tone = ownTone ? "border-white/30 text-[#F5F4EE]/85" : "border-[#d4b14e] text-white/75";
  return (
    <button
      type="button"
      onClick={() => onJump?.(preview.id)}
      className={`block w-full rounded-lg border-l-2 px-2.5 py-1.5 text-left transition-opacity hover:opacity-90 ${tone}`}
      aria-label={`Jump to original message from ${preview.senderName}`}
    >
      <div
        className={`text-[11px] font-medium uppercase tracking-[0.10em] ${
          ownTone ? "text-[#F5F4EE]/85" : "text-[#d4b14e]"
        }`}
      >
        {preview.senderName}
      </div>
      <p className="mt-0.5 truncate text-[12px] leading-snug">
        {preview.bodyExcerpt || "(no content)"}
      </p>
    </button>
  );
}
