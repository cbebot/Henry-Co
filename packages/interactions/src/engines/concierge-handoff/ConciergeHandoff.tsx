"use client";

/**
 * Concierge Handoff Engine — `<ConciergeHandoff>` (doctrine Engine 9).
 *
 * An opt-in, never-modal entry into the concierge surface, appearing only
 * at the three tested moments (linger / bounce / post-success). Framed in
 * service language; the free first message is real value; premium appears
 * only when the user asks for more (that lives in the concierge surface
 * itself — the app wires `onOpen` to @henryco/intelligence).
 */

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@henryco/ui/cn";
import { resolveHandoffTrigger, type HandoffTrigger } from "./concierge.logic";

export interface ConciergeHandoffLabels {
  /** Service-framed offer, e.g. "Want a hand picking? Talk to a specialist — free for the first message." */
  offer: string;
  /** Button label, e.g. "Ask a specialist". */
  action: string;
}

export interface ConciergeHandoffProps {
  labels: ConciergeHandoffLabels;
  /** Count of bounces between candidate listings (app-tracked). */
  bounceCount?: number;
  /** True when rendered on a post-success surface (Joy's single next action). */
  postSuccess?: boolean;
  /** Open the concierge surface (wired to @henryco/intelligence by the app). */
  onOpen: (trigger: HandoffTrigger) => void;
  className?: string;
}

export function ConciergeHandoff({
  labels,
  bounceCount = 0,
  postSuccess = false,
  onOpen,
  className,
}: ConciergeHandoffProps) {
  const [lingerMs, setLingerMs] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const interval = setInterval(() => setLingerMs(Date.now() - startedAt), 5_000);
    const reset = () => setLingerMs(0);
    // Meaningful action resets the linger clock; scroll alone does not.
    window.addEventListener("click", reset, true);
    window.addEventListener("keydown", reset, true);
    return () => {
      clearInterval(interval);
      window.removeEventListener("click", reset, true);
      window.removeEventListener("keydown", reset, true);
    };
  }, []);

  const trigger = resolveHandoffTrigger(lingerMs, bounceCount, postSuccess);
  if (!trigger) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[1.5rem] border border-zinc-200/70 bg-zinc-50/60 p-4",
        "dark:border-white/8 dark:bg-white/[0.03]",
        className,
      )}
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:color-mix(in_srgb,var(--site-accent,#C9A227)_14%,transparent)] text-[color:var(--site-accent,#C9A227)]"
        aria-hidden
      >
        <MessageCircle className="h-4.5 w-4.5" />
      </span>
      <p className="flex-1 text-sm leading-6 text-zinc-600 dark:text-white/70">{labels.offer}</p>
      <button
        type="button"
        onClick={() => onOpen(trigger)}
        className={cn(
          "inline-flex min-h-[44px] items-center rounded-full px-4 text-sm font-semibold outline-none",
          "text-[color:var(--site-accent,#C9A227)] hover:brightness-110",
          "focus-visible:ring-2 focus-visible:ring-amber-500/55 focus-visible:ring-offset-2",
        )}
      >
        {labels.action}
      </button>
    </div>
  );
}
