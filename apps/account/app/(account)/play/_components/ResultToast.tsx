"use client";

import { useEffect, useRef } from "react";
import type { ArenaCopy } from "@henryco/i18n";

export type ResultOutcome = "win" | "loss" | "tie";

/**
 * The crafted Henry Onyx result moment — an original animated result card (not a
 * generic toast). Focus moves to it and it announces via aria-live; the winning
 * connection pulses on the board behind it.
 */
export function ResultToast({
  outcome,
  copy,
  detail,
  canReview,
  onRematch,
  onReview,
  onExit,
}: {
  outcome: ResultOutcome;
  copy: ArenaCopy;
  detail?: string;
  canReview?: boolean;
  onRematch: () => void;
  onReview?: () => void;
  onExit: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  const title = outcome === "win" ? copy.match.youWon : outcome === "loss" ? copy.match.youLost : copy.match.tie;
  const seal = outcome === "win" ? "✦" : outcome === "loss" ? "◆" : "•";

  return (
    <div ref={ref} tabIndex={-1} role="status" aria-live="assertive" className={`acct-result acct-result--${outcome}`}>
      <span className="acct-result__seal" aria-hidden>
        {seal}
      </span>
      <h2 className="acct-result__title">{title}</h2>
      {detail ? <p className="acct-result__sub">{detail}</p> : null}
      <div className="acct-result__actions">
        <button type="button" className="acct-arena-btn acct-arena-btn--accent" onClick={onRematch}>
          {copy.practice.rematch}
        </button>
        {canReview && onReview ? (
          <button type="button" className="acct-arena-btn" onClick={onReview}>
            {copy.practice.review}
          </button>
        ) : null}
        <button type="button" className="acct-arena-btn" onClick={onExit}>
          {copy.practice.backToArena}
        </button>
      </div>
    </div>
  );
}
