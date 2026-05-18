import { CheckCircle2, MapPin, Navigation, Radio } from "lucide-react";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";
import type { LogisticsMapViewport } from "@/lib/logistics/map-provider";
import type {
  LogisticsAddress,
  LogisticsLifecycleStatus,
  LogisticsShipment,
} from "@/lib/logistics/types";

type StatusTone = "neutral" | "active" | "warn" | "good";

const STATUS_LABELS: Record<LogisticsLifecycleStatus, { label: string; tone: StatusTone }> = {
  quote_requested: { label: "Quote requested", tone: "neutral" },
  quoted: { label: "Quoted", tone: "neutral" },
  awaiting_payment: { label: "Awaiting payment", tone: "neutral" },
  booked: { label: "Booked", tone: "neutral" },
  assigned: { label: "Rider assigned", tone: "active" },
  pickup_confirmed: { label: "Pickup confirmed", tone: "active" },
  in_transit: { label: "In transit", tone: "active" },
  delayed: { label: "Delayed", tone: "warn" },
  attempted_delivery: { label: "Attempted delivery", tone: "warn" },
  delivered: { label: "Delivered", tone: "good" },
  failed_delivery: { label: "Delivery failed", tone: "warn" },
  return_initiated: { label: "Return initiated", tone: "warn" },
  returned: { label: "Returned", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

const TONE_STYLE: Record<StatusTone, { dot: string; pill: string; ring: string }> = {
  neutral: {
    dot: "bg-white/45",
    pill: "border-white/15 bg-white/[0.04] text-white/80",
    ring: "",
  },
  active: {
    dot: "bg-[var(--logistics-accent)]",
    pill:
      "border-[var(--logistics-accent)]/40 bg-[rgba(215,117,57,0.10)] text-[var(--logistics-accent-soft)]",
    ring: "shadow-[0_0_0_3px_rgba(215,117,57,0.18)]",
  },
  warn: {
    dot: "bg-amber-300",
    pill: "border-amber-400/35 bg-amber-400/[0.08] text-amber-100",
    ring: "shadow-[0_0_0_3px_rgba(251,191,36,0.18)]",
  },
  good: {
    dot: "bg-emerald-300",
    pill: "border-emerald-400/35 bg-emerald-400/[0.08] text-emerald-100",
    ring: "",
  },
};

function formatRelative(iso: string | null, t: (text: string) => string) {
  if (!iso) return null;
  const at = new Date(iso).getTime();
  if (!Number.isFinite(at)) return null;
  const diffSec = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (diffSec < 60) return t("just now");
  if (diffSec < 3600) return `${Math.round(diffSec / 60)}${t("m ago")}`;
  if (diffSec < 86_400) return `${Math.round(diffSec / 3600)}${t("h ago")}`;
  return `${Math.round(diffSec / 86_400)}${t("d ago")}`;
}

function addressSummary(address: LogisticsAddress | null | undefined, t: (text: string) => string): string {
  if (!address) return t("Address pending");
  const cityRegion = [address.city, address.region].filter(Boolean).join(", ");
  if (address.line1 && cityRegion) return `${address.line1} · ${cityRegion}`;
  return address.line1 || cityRegion || t("Address pending");
}

export default function TrackingMapPanel({
  map,
  shipment,
  locale,
}: {
  map: LogisticsMapViewport;
  shipment?: LogisticsShipment;
  locale: AppLocale;
}) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const status = shipment ? STATUS_LABELS[shipment.lifecycleStatus] : null;
  const tone = status ? TONE_STYLE[status.tone] : null;
  const isLive = shipment ? status?.tone === "active" || status?.tone === "warn" : false;
  const isDelivered = shipment?.lifecycleStatus === "delivered";
  const promiseWindow = shipment?.pricingBreakdown.promiseWindowHours;
  const lastUpdate = formatRelative(map.live?.recordedAt ?? null, t);

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[var(--logistics-line)] bg-black/25">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--logistics-line)] px-5 py-4">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-white/45">
            {t("Route")}
          </div>
          <p className="mt-1 text-sm leading-6 text-[var(--logistics-muted)]">
            {t("Coordinates come from your booking addresses and live rider telemetry — never simulated.")}
          </p>
        </div>
        {status && tone ? (
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11.5px] font-semibold ${tone.pill}`}
          >
            <span className="relative inline-flex h-1.5 w-1.5">
              {isLive ? (
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${tone.dot}`}
                />
              ) : null}
              <span
                className={`relative inline-flex h-1.5 w-1.5 rounded-full ${tone.dot}`}
              />
            </span>
            {t(status.label)}
          </div>
        ) : null}
      </div>

      <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-[#1a1210] to-[#0a0809]">
        {map.embedUrl ? (
          <iframe
            title={t("Shipment map")}
            src={map.embedUrl}
            className="h-full w-full border-0"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-[var(--logistics-line)] bg-white/[0.03] text-[var(--logistics-accent-soft)]">
              <MapPin className="h-4 w-4" />
            </span>
            <div className="text-sm font-medium text-white/90">{t("Map preview will appear here")}</div>
            <p className="max-w-md text-sm text-[var(--logistics-muted)]">
              {t("We render the route as soon as either pickup or dropoff has a precise coordinate. Live rider breadcrumbs join automatically once dispatch shares the position.")}
            </p>
          </div>
        )}
      </div>

      <dl className="divide-y divide-[var(--logistics-line)]">
        <RouteRow
          icon={<Navigation className="h-3.5 w-3.5 -rotate-45" aria-hidden />}
          label={t("Pickup")}
          primary={addressSummary(shipment?.pickupAddress ?? null, t)}
          secondary={shipment?.pickupAddress?.landmark ?? null}
          status={shipment?.pickupAddress?.latitude && shipment?.pickupAddress?.longitude ? t("Pinned") : t("Address only")}
        />
        <RouteRow
          icon={<MapPin className="h-3.5 w-3.5" aria-hidden />}
          label={t("Dropoff")}
          primary={addressSummary(shipment?.dropoffAddress ?? null, t)}
          secondary={shipment?.dropoffAddress?.landmark ?? null}
          status={shipment?.dropoffAddress?.latitude && shipment?.dropoffAddress?.longitude ? t("Pinned") : t("Address only")}
        />
        {isLive || isDelivered || map.showLiveLocationPlaceholder ? (
          <RouteRow
            icon={<Radio className={`h-3.5 w-3.5 ${isLive ? "animate-pulse" : ""}`} aria-hidden />}
            label={t("Live rider")}
            primary={
              isDelivered
                ? t("Delivered — tracking complete")
                : map.live
                ? t("Position updated")
                : t("Awaiting GPS share from dispatch")
            }
            secondary={null}
            status={
              isDelivered
                ? t("Complete")
                : lastUpdate
                ? `${t("Last update")} ${lastUpdate}`
                : t("Awaiting share")
            }
          />
        ) : null}
      </dl>

      {promiseWindow && !isDelivered ? (
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-[var(--logistics-line)] bg-white/[0.015] px-5 py-3 text-sm">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/45">
            {t("Estimated arrival")}
          </span>
          <span className="font-semibold text-white">
            {promiseWindow[0]}–{promiseWindow[1]}{t("h window")}
            <span className="ml-2 text-[12px] font-normal text-[var(--logistics-muted)]">
              {shipment?.pricingBreakdown.promiseConfidence ?? 0}% {t("confidence")}
            </span>
          </span>
        </div>
      ) : isDelivered ? (
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-[var(--logistics-line)] bg-emerald-400/[0.04] px-5 py-3 text-sm">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-emerald-200/85">
            {t("Delivered")}
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-100">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> {t("Proof of delivery captured")}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function RouteRow({
  icon,
  label,
  primary,
  secondary,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  primary: string;
  secondary: string | null;
  status: string;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-3.5">
      <span className="mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-full border border-[var(--logistics-line)] bg-white/[0.03] text-[var(--logistics-accent-soft)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
          {label}
        </div>
        <div className="mt-0.5 truncate text-[13.5px] font-semibold text-white">{primary}</div>
        {secondary ? (
          <div className="mt-0.5 truncate text-[11.5px] text-[var(--logistics-muted)]">
            {secondary}
          </div>
        ) : null}
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="text-[10.5px] font-medium tabular-nums text-[var(--logistics-muted)]">
          {status}
        </div>
      </div>
    </div>
  );
}
