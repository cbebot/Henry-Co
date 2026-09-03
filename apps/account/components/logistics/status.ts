import type { AccountCopy } from "@henryco/i18n";
import { formatAccountTemplate } from "@henryco/i18n";

type LogisticsCopy = AccountCopy["divisionLogistics"];

export type StatusTone = "active" | "warn" | "success" | "neutral";

const TONE_BY_STATUS: Record<string, StatusTone> = {
  quote_requested: "neutral",
  quote_sent: "neutral",
  pending_payment: "warn",
  scheduled: "neutral",
  assigned: "active",
  pickup_confirmed: "active",
  in_transit: "active",
  delayed: "warn",
  attempted_delivery: "warn",
  delivered: "success",
  completed: "success",
  closed: "neutral",
  cancelled: "neutral",
  refunded: "neutral",
};

export function statusTone(status: string): StatusTone {
  return TONE_BY_STATUS[status] ?? "neutral";
}

export function statusLabel(status: string, copy: LogisticsCopy): string {
  const labels = copy.statusLabels;
  switch (status) {
    case "quote_requested":
      return labels.quoteRequested;
    case "quote_sent":
      return labels.quoteSent;
    case "pending_payment":
      return labels.pendingPayment;
    case "scheduled":
      return labels.scheduled;
    case "assigned":
      return labels.assigned;
    case "pickup_confirmed":
      return labels.pickupConfirmed;
    case "in_transit":
      return labels.inTransit;
    case "delayed":
      return labels.delayed;
    case "attempted_delivery":
      return labels.attemptedDelivery;
    case "delivered":
      return labels.delivered;
    case "completed":
      return labels.completed;
    case "closed":
      return labels.closed;
    case "cancelled":
      return labels.cancelled;
    case "refunded":
      return labels.refunded;
    default:
      return status.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
  }
}

export function urgencyLabel(urgency: string, copy: LogisticsCopy): string {
  switch (urgency) {
    case "standard":
      return copy.urgencyLabels.standard;
    case "same_day":
      return copy.urgencyLabels.sameDay;
    case "express":
      return copy.urgencyLabels.express;
    case "next_day":
      return copy.urgencyLabels.nextDay;
    default:
      return urgency.replace(/_/g, " ");
  }
}

export function serviceLabel(service: string, copy: LogisticsCopy): string {
  switch (service) {
    case "scheduled":
      return copy.serviceLabels.scheduled;
    case "same_day":
      return copy.serviceLabels.sameDay;
    case "inter_city":
      return copy.serviceLabels.interCity;
    case "bulk":
      return copy.serviceLabels.bulk;
    default:
      return service.replace(/_/g, " ");
  }
}

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function shortDate(iso: string | null): { day: string; month: string } {
  if (!iso) return { day: "—", month: "" };
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return { day: "—", month: "" };
  return {
    day: d.getUTCDate().toString().padStart(2, "0"),
    month: SHORT_MONTHS[d.getUTCMonth()] ?? "",
  };
}

/**
 * Compute a human ETA fragment from a scheduled timestamp. Returns short,
 * countdown-flavored copy when within the next 36 hours, otherwise a
 * locale-formatted date.
 */
export function etaFragment(iso: string | null, copy: LogisticsCopy): string | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  const delta = ms - Date.now();
  const absHours = Math.abs(delta) / 36e5;
  if (absHours < 1) {
    const minutes = Math.max(0, Math.round(Math.abs(delta) / 60_000));
    return delta >= 0
      ? formatAccountTemplate(copy.shipment.etaMinutesInTemplate, { minutes })
      : formatAccountTemplate(copy.shipment.etaMinutesOverdueTemplate, { minutes });
  }
  if (absHours < 36) {
    const hours = Math.round(absHours);
    return delta >= 0
      ? formatAccountTemplate(copy.shipment.etaHoursInTemplate, { hours })
      : formatAccountTemplate(copy.shipment.etaHoursOverdueTemplate, { hours });
  }
  const d = new Date(ms);
  return d.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
