import { Truck } from "lucide-react";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";
import { NG_STATES, NG_ZONE_LABELS, type NgZone } from "@henryco/config";
import { describeReachSummary } from "@/lib/checkout/delivery-reach";

/**
 * V3-DELIVERY-COMPLETE-01 (T6) — the buyer-facing "free delivery" badge.
 *
 * A quiet chip that states a seller's Delivery Promise honestly. When the viewer's
 * state is known and covered, it names it ("Free delivery to Enugu"); otherwise it
 * states the reach scope ("…nationwide" / "…across the South-East" / "…to N states").
 * Pure + hook-free, so it renders in server pages (store/PDP) and inside the client
 * product card alike — the surface passes its own `locale`. Renders nothing when
 * there is no honorable coverage (the dormant default).
 */
const STATE_NAME = new Map(NG_STATES.map((s) => [s.code, s.name] as const));

export function DeliveryPromiseBadge({
  promise,
  viewerState,
  locale,
  className,
}: {
  /** The vendor's tier-clamped covered states (already honorable), or null. */
  promise: { coveredStates: string[] } | null;
  viewerState?: string | null;
  locale: AppLocale;
  className?: string;
}) {
  if (!promise || promise.coveredStates.length === 0) return null;
  const t = (text: string) => translateSurfaceLabel(locale, text);

  let label: string;
  if (viewerState && promise.coveredStates.includes(viewerState)) {
    label = `${t("Free delivery to")} ${STATE_NAME.get(viewerState) ?? viewerState}`;
  } else {
    const summary = describeReachSummary(promise.coveredStates);
    if (summary.scope === "none") return null;
    label =
      summary.scope === "nationwide"
        ? t("Free delivery nationwide")
        : summary.scope === "zone"
          ? `${t("Free delivery across")} ${NG_ZONE_LABELS[summary.zone as NgZone]}`
          : `${t("Free delivery to")} ${summary.count} ${t("states")}`;
  }

  return (
    <span
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-full border border-[color:var(--home-line-15)] bg-[color:var(--home-glass-strong)] px-3 py-1 text-[11px] font-semibold text-[color:var(--home-ink-80)] backdrop-blur-xl"
      }
    >
      <Truck className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}
