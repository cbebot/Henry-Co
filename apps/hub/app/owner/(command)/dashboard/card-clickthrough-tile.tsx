import { MousePointerClick, LayoutGrid, ArrowDownWideNarrow, TrendingDown } from "lucide-react";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";

import MetricCard from "@/components/owner/MetricCard";
import { OwnerPanel, OwnerNotice } from "@/components/owner/OwnerPrimitives";
import type { CardClickThroughMetrics } from "@/lib/owner-card-clickthrough";

/**
 * V3-11 (S9) — card-clickthrough tile for the owner workspace.
 *
 * Surfaces the V3-11 card telemetry events:
 *   - `henry.ui.card.rendered` — a classified card painted
 *   - `henry.ui.card.clicked`  — the card's primary next step activated
 *   - `henry.ui.card.demoted`  — a card demoted/removed during an audit
 *
 * The 24h render/click counts are the headline. Below them, a ranked
 * list of the LOWEST click-through cards (>= 20 renders) over 7 days —
 * these answer the owner's question empirically: a card that renders
 * often but is rarely clicked has a weak "exact next step" and is a
 * demotion candidate.
 *
 * Empty-state: when no V3-11 card events have landed (the common case
 * before the emit -> henry_events pipe is wired, mirroring the V3-05
 * slow-surface tile), the tile renders an explanatory notice so the
 * owner doesn't read the zeros as a regression.
 *
 * Strings: all copy passes through `translateSurfaceLabel` (Pattern B —
 * runtime DeepL fallback), so the V3-07 strict hardcoded-text gate stays
 * green.
 */
type CardClickThroughTileProps = {
  metrics: CardClickThroughMetrics;
  locale: AppLocale;
};

export default function CardClickThroughTile({
  metrics,
  locale,
}: CardClickThroughTileProps) {
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <OwnerPanel
      title={t("Cards by click-through rate")}
      description={t(
        "V3-11 card telemetry — every card asks: does it open the exact next step, or just show more text? Cards that render often but are rarely clicked are demotion candidates.",
      )}
    >
      {metrics.isEmptyState ? (
        <OwnerNotice
          tone="info"
          title={t("Awaiting first card events")}
          body={t(
            "No card telemetry yet. Metrics populate once `henry.ui.card.rendered` and `henry.ui.card.clicked` rows land in henry_events.",
          )}
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          icon={LayoutGrid}
          label={t("Cards rendered today")}
          value={metrics.cardsRenderedToday}
          subtitle={t("Classified card paints in the last 24h")}
          color="var(--owner-accent)"
        />
        <MetricCard
          icon={MousePointerClick}
          label={t("Card next-steps clicked today")}
          value={metrics.cardsClickedToday}
          subtitle={t("Primary card actions activated in the last 24h")}
          color="var(--owner-accent)"
        />
        <MetricCard
          icon={ArrowDownWideNarrow}
          label={t("Cards demoted (7d)")}
          value={metrics.cardsDemoted7d}
          subtitle={t("Cards demoted or removed by an audit recently")}
          color={
            metrics.cardsDemoted7d > 0
              ? "var(--acct-orange)"
              : "var(--owner-accent)"
          }
        />
      </div>

      {metrics.lowestClickThrough7d.length > 0 ? (
        <div className="mt-4 rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--acct-muted)]">
            {t("Lowest click-through (7d)")}
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {metrics.lowestClickThrough7d.map((row) => (
              <li
                key={row.cardId}
                className="flex items-center justify-between gap-3 rounded-[1rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-3 py-2"
              >
                <span className="truncate font-mono text-xs text-[var(--acct-ink)]">
                  {row.cardId}
                </span>
                <span className="shrink-0 text-xs text-[var(--acct-muted)]">
                  {row.clickThroughPct}% · {row.clicked}/{row.rendered}{" "}
                  {t("clicks")}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-2 text-xs text-[var(--acct-muted)]">
            <TrendingDown className="h-3.5 w-3.5 text-[var(--acct-orange-text)]" aria-hidden="true" />
            <span>
              {t(
                "Low click-through at high render counts signals a weak next step — review or demote.",
              )}
            </span>
          </div>
        </div>
      ) : null}
    </OwnerPanel>
  );
}
