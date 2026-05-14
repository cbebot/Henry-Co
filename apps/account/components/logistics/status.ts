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

const LABEL_BY_STATUS: Record<string, string> = {
  quote_requested: "Quote pending",
  quote_sent: "Quote ready",
  pending_payment: "Awaiting payment",
  scheduled: "Scheduled",
  assigned: "Rider assigned",
  pickup_confirmed: "Picked up",
  in_transit: "In transit",
  delayed: "Delayed",
  attempted_delivery: "Attempted delivery",
  delivered: "Delivered",
  completed: "Completed",
  closed: "Closed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function statusLabel(status: string): string {
  return (
    LABEL_BY_STATUS[status] ??
    status.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase())
  );
}

const URGENCY_LABELS: Record<string, string> = {
  standard: "Standard",
  same_day: "Same day",
  express: "Express",
  next_day: "Next day",
};

export function urgencyLabel(urgency: string): string {
  return URGENCY_LABELS[urgency] ?? urgency.replace(/_/g, " ");
}

const SERVICE_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  same_day: "Same-day",
  inter_city: "Inter-city",
  bulk: "Bulk",
};

export function serviceLabel(service: string): string {
  return SERVICE_LABELS[service] ?? service.replace(/_/g, " ");
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
export function etaFragment(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  const delta = ms - Date.now();
  const absHours = Math.abs(delta) / 36e5;
  if (absHours < 1) {
    const minutes = Math.max(0, Math.round(Math.abs(delta) / 60_000));
    return delta >= 0 ? `in ${minutes} min` : `${minutes} min overdue`;
  }
  if (absHours < 36) {
    const hours = Math.round(absHours);
    return delta >= 0 ? `in ${hours}h` : `${hours}h overdue`;
  }
  const d = new Date(ms);
  return d.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
