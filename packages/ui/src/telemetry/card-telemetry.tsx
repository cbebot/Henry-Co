"use client";

/**
 * V3-11 (S9) — card telemetry primitive.
 *
 * The owner's audit question — _"Does this card open the exact next step,
 * or just show more text?"_ — can only be answered EMPIRICALLY after
 * deploy: a card that renders often but is rarely clicked has a weak next
 * step. This primitive instruments cards so the owner-workspace
 * card-clickthrough tile (`apps/hub/.../card-clickthrough-tile.tsx`) can
 * compute click-through per card.
 *
 * Two surfaces:
 *   - `<CardTelemetry>` — a zero-DOM-overhead wrapper that fires
 *     `henry.ui.card.rendered` once on mount and, when the user activates
 *     the card, fires `henry.ui.card.clicked`. It renders its children
 *     inside a contents-display span and attaches a capture-phase click
 *     listener so it works for entire-card-tap AND inner-CTA cards
 *     without changing the card's markup.
 *   - `useCardRendered(...)` / `emitCardClicked(...)` — the imperative
 *     escape hatch for cards that already own their click handler.
 *
 * Dependency-light: the `@henryco/observability` emitter is lazy-imported
 * (mirrors `structured-skeleton.tsx`), so the UI package keeps zero hard
 * dep on observability at build time. When the host app has it installed,
 * the event flows; when not, we silently no-op.
 *
 * The event NAMES (`henry.ui.card.*`) are registered in
 * `packages/observability/src/events.ts` (HenryEventName union).
 */

import { useEffect, useRef, type ReactNode } from "react";

export type CardClassification = "A" | "B" | "C1" | "C2" | "C3";

type CardEventName =
  | "henry.ui.card.rendered"
  | "henry.ui.card.clicked"
  | "henry.ui.card.demoted";

async function emitCardEvent(
  name: CardEventName,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const mod = (await import(
      /* webpackIgnore: true */ "@henryco/observability"
    )) as
      | {
          emitEvent?: (params: {
            name: string;
            classification: string;
            outcome: string;
            payload?: Record<string, unknown>;
          }) => void;
        }
      | undefined;
    if (mod && typeof mod.emitEvent === "function") {
      mod.emitEvent({
        name,
        // `rendered`/`demoted` are system-state; `clicked` is a user action.
        classification: name === "henry.ui.card.clicked" ? "user_action" : "system_state",
        outcome: name === "henry.ui.card.clicked" ? "completed" : "started",
        payload,
      });
    }
  } catch {
    // Observability not installed in this surface — silent fallback.
  }
}

/**
 * Fire `henry.ui.card.rendered` once, on mount. Use inside a card that
 * already owns its own click handling (call `emitCardClicked` from there).
 */
export function useCardRendered(
  cardId: string,
  classification: CardClassification,
  division?: string,
): void {
  const firedRef = useRef(false);
  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    void emitCardEvent("henry.ui.card.rendered", {
      card_id: cardId,
      classification,
      division: division ?? "unknown",
    });
    // Identity of a card is stable for its mount; re-firing on prop change
    // would spam telemetry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Imperative: fire `henry.ui.card.clicked` when a card's next step is activated. */
export function emitCardClicked(cardId: string, target: string): void {
  void emitCardEvent("henry.ui.card.clicked", { card_id: cardId, target });
}

/** Imperative: fire `henry.ui.card.demoted` (audit-time churn logging). */
export function emitCardDemoted(
  cardId: string,
  from: CardClassification,
  to: CardClassification | "removed",
  reason: string,
): void {
  void emitCardEvent("henry.ui.card.demoted", {
    card_id: cardId,
    from,
    to,
    reason,
  });
}

export interface CardTelemetryProps {
  /** Stable identifier for this card — e.g. `account.wallet.balance`. */
  cardId: string;
  /** A/B/C1/C2/C3 classification from the V3-11 inventory. */
  classification: CardClassification;
  /** Division slug for the owner rollup breakdown. */
  division?: string;
  /** The next-step target reported on click (route or action id). */
  target?: string;
  children: ReactNode;
}

/**
 * Wrapper that instruments a card without changing its markup. Fires
 * `rendered` on mount and `clicked` on a capture-phase click anywhere in
 * the subtree (so both entire-card-tap and inner-CTA cards report).
 *
 * Renders a `display: contents` span so it adds NO box to the layout —
 * the card's own styling is untouched.
 */
export function CardTelemetry({
  cardId,
  classification,
  division,
  target,
  children,
}: CardTelemetryProps) {
  useCardRendered(cardId, classification, division);
  return (
    <span
      style={{ display: "contents" }}
      onClickCapture={() => emitCardClicked(cardId, target ?? "unknown")}
    >
      {children}
    </span>
  );
}
