"use client";

import { useState, type ReactNode } from "react";
import type { ArenaCopy } from "@henryco/i18n";
import type { GameId } from "@henryco/gaming-arena";

/**
 * The Coach — a replayable, stepped walkthrough that teaches the goal, the
 * rules, and how to win. Collapsed it is a single "Learn how to win" button;
 * opened it steps through the per-game lesson. Contextual in-play tips render
 * via the sibling HintBox.
 */
export function Coach({
  gameId,
  copy,
  startOpen = false,
}: {
  gameId: GameId;
  copy: ArenaCopy;
  startOpen?: boolean;
}) {
  const steps = gameId === "onyx-cards" ? copy.coach.cardsSteps : copy.coach.linesSteps;
  const [open, setOpen] = useState(startOpen);
  const [i, setI] = useState(0);

  if (!open) {
    return (
      <button
        type="button"
        className="acct-arena-btn acct-arena-btn--accent"
        onClick={() => {
          setI(0);
          setOpen(true);
        }}
      >
        {copy.coach.learnCta}
      </button>
    );
  }

  const step = steps[i]!;
  const isLast = i === steps.length - 1;

  return (
    <section className="acct-coach" aria-label={copy.coach.title}>
      <span className="acct-coach__kicker">
        {copy.coach.title} · {i + 1}/{steps.length}
      </span>
      <h3 className="acct-coach__title">{step.title}</h3>
      <p className="acct-coach__body">{step.body}</p>
      <div className="acct-coach__dots" aria-hidden>
        {steps.map((_, k) => (
          <span key={k} className={`acct-coach__dot${k === i ? " acct-coach__dot--on" : ""}`} />
        ))}
      </div>
      <div className="acct-coach__row">
        <button type="button" className="acct-arena-btn" onClick={() => setOpen(false)}>
          {copy.coach.skip}
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          {i > 0 ? (
            <button type="button" className="acct-arena-btn" onClick={() => setI((n) => n - 1)}>
              {copy.coach.back}
            </button>
          ) : null}
          {isLast ? (
            <button
              type="button"
              className="acct-arena-btn acct-arena-btn--accent"
              onClick={() => setOpen(false)}
            >
              {copy.coach.done}
            </button>
          ) : (
            <button
              type="button"
              className="acct-arena-btn acct-arena-btn--accent"
              onClick={() => setI((n) => n + 1)}
            >
              {copy.coach.next}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/** A contextual in-play tip (e.g. "⚠ block C5"). */
export function HintBox({ children }: { children: ReactNode }) {
  return (
    <div className="acct-coach__hint" role="status" aria-live="polite">
      <span>{children}</span>
    </div>
  );
}
