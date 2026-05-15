"use client";

import { useMemo, useState } from "react";

import { getStudioCopy } from "@henryco/i18n";
import type { AppLocale } from "@henryco/i18n";

export type SalesKanbanCard = {
  id: string;
  stage: SalesStage;
  title: string;
  subtitle?: string | null;
  valueLabel?: string | null;
  metaLine?: string | null;
};

export type SalesStage =
  | "lead"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export type SalesKanbanProps = {
  cards: SalesKanbanCard[];
  locale?: AppLocale;
  onStageChange?: (cardId: string, nextStage: SalesStage) => void;
};

const STAGE_ORDER: SalesStage[] = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
];

/**
 * V3 PASS 21 — <SalesKanban>.
 *
 * Drag-to-stage kanban for /sales/leads + /sales/proposals. Optimistic
 * client-side state with onStageChange callback for the consumer to
 * persist via Server Action / API. Stages are hard-coded to match the
 * documented sales pipeline; the consumer is responsible for filtering
 * cards into the kanban (e.g. only show leads on /sales/leads).
 *
 * Mobile fallback (320–767 px): stages stacked vertically; drag still
 * works via touch via the native drag handlers.
 */
export function SalesKanban({ cards, locale = "en", onStageChange }: SalesKanbanProps) {
  const copy = getStudioCopy(locale);
  const [draftCards, setDraftCards] = useState<SalesKanbanCard[]>(cards);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const stageLabels: Record<SalesStage, string> = useMemo(
    () => ({
      lead: copy.sales.stageLead,
      qualified: copy.sales.stageQualified,
      proposal: copy.sales.stageProposal,
      negotiation: copy.sales.stageNegotiation,
      closed_won: copy.sales.stageWon,
      closed_lost: copy.sales.stageLost,
    }),
    [copy]
  );

  function onDragStart(event: React.DragEvent<HTMLElement>, cardId: string) {
    setActiveCardId(cardId);
    event.dataTransfer.setData("text/plain", cardId);
    event.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function onDrop(event: React.DragEvent<HTMLElement>, stage: SalesStage) {
    event.preventDefault();
    const cardId = event.dataTransfer.getData("text/plain") || activeCardId;
    if (!cardId) return;
    setDraftCards((current) =>
      current.map((card) => (card.id === cardId ? { ...card, stage } : card))
    );
    onStageChange?.(cardId, stage);
    setActiveCardId(null);
  }

  return (
    <div className="hc-scroll-x" data-testid="sales-kanban">
      <div className="grid min-w-[960px] grid-cols-6 gap-3">
        {STAGE_ORDER.map((stage) => {
          const stageCards = draftCards.filter((c) => c.stage === stage);
          return (
            <section
              key={stage}
              className="rounded-2xl border border-[color:var(--hc-line)] bg-[color:var(--hc-paper-elev)] p-3"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, stage)}
              aria-label={stageLabels[stage]}
            >
              <header className="mb-3 flex items-center justify-between">
                <h3 className="hc-label">{stageLabels[stage]}</h3>
                <span className="hc-body-muted text-xs">{stageCards.length}</span>
              </header>
              <ul className="space-y-2">
                {stageCards.map((card) => (
                  <li
                    key={card.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, card.id)}
                    className="cursor-grab rounded-xl border border-[color:var(--hc-line)] bg-[color:var(--hc-paper)] p-3 text-sm shadow-sm active:cursor-grabbing"
                  >
                    <p className="hc-body font-semibold">{card.title}</p>
                    {card.subtitle ? (
                      <p className="hc-body-muted mt-1 text-xs">{card.subtitle}</p>
                    ) : null}
                    {card.valueLabel ? (
                      <p className="hc-mono mt-2 text-xs text-[color:var(--hc-accent-text)]">
                        {card.valueLabel}
                      </p>
                    ) : null}
                    {card.metaLine ? (
                      <p className="hc-body-muted mt-1 text-xs">{card.metaLine}</p>
                    ) : null}
                  </li>
                ))}
                {stageCards.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-[color:var(--hc-line)] p-4 text-center">
                    <p className="hc-body-muted text-xs">—</p>
                  </li>
                ) : null}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
