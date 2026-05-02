"use client";

import { Check, Trash2 } from "lucide-react";
import { cn } from "@henryco/ui/cn";
import type { DraftState } from "../hooks/useDraftStorage";

export type DraftIndicatorProps = {
  state: DraftState;
  hasContent: boolean;
  onDiscard: () => void;
  savedLabel?: string;
  discardLabel?: string;
  className?: string;
  reduceMotion?: boolean;
};

/**
 * Premium draft state pill.
 *
 *   idle   → invisible (no clutter when nothing's typed)
 *   dirty  → invisible (we save quickly; flashing "Dirty" feels nervous)
 *   saving → soft pulse + "Saving…"
 *   saved  → check glyph + "Draft saved", small pop, fades after 1.6s back to idle
 */
export function DraftIndicator({
  state,
  hasContent,
  onDiscard,
  savedLabel = "Draft saved",
  discardLabel = "Discard draft",
  className,
  reduceMotion = false,
}: DraftIndicatorProps) {
  const visible = state === "saving" || state === "saved";

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        className
      )}
      aria-live="polite"
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
          "text-[10.5px] font-semibold uppercase tracking-[0.16em]",
          "bg-[color:var(--composer-accent,#0E7C86)]/10",
          "text-[color:var(--composer-accent,#0E7C86)]",
          "transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {state === "saved" ? (
          <Check
            className={cn(
              "h-3 w-3",
              !reduceMotion && "henryco-draft-saved-pop"
            )}
            aria-hidden
          />
        ) : (
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full bg-current",
              visible && !reduceMotion && "henryco-draft-pulse"
            )}
            aria-hidden
          />
        )}
        {state === "saving" ? "Saving…" : savedLabel}
      </span>
      {hasContent ? (
        <button
          type="button"
          onClick={onDiscard}
          className={cn(
            "ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1",
            "text-[11px] font-medium uppercase tracking-[0.14em]",
            "text-zinc-500 transition hover:text-zinc-800",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--composer-accent,#0E7C86)]/40",
            "dark:text-white/55 dark:hover:text-white"
          )}
        >
          <Trash2 className="h-3 w-3" aria-hidden />
          {discardLabel}
        </button>
      ) : null}
    </div>
  );
}
