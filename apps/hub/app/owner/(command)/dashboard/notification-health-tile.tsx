/**
 * V3-03 — Notification health tile (scaffold).
 *
 * Owner-workspace dashboard tile reporting:
 *   - delivery success rate (last 24h) — count('seen' + 'delivered')
 *     ÷ count(all)
 *   - average sent-to-read time — median across 'seen' rows last 24h
 *   - failure count — count('failed') last 24h
 *
 * Server component. Queries customer_notifications +
 * staff_notifications via the admin client. RLS-safe because the
 * tile renders only inside the owner workspace which is gated by
 * `requireOwner()` in the (command) layout.
 *
 * V3-08 (empty dashboard truth) consumes this tile as one of the
 * dashboard module entries. Until V3-08 ships, this file lives next
 * to the owner dashboard route so the conductor can wire it up
 * post-merge.
 *
 * Strings via @henryco/i18n surface:notification-message namespace.
 */

import { translateSurfaceLabel } from "@henryco/i18n";
import { createAdminSupabase } from "@/lib/supabase";

const WINDOW_HOURS = 24;

type HealthStats = {
  totalSent: number;
  totalDelivered: number;
  totalSeen: number;
  totalFailed: number;
  deliverySuccessRate: number; // 0..1
  failureCount: number;
  // Average sent → read latency in seconds. Null when no 'seen' rows.
  avgSentToReadSeconds: number | null;
};

async function fetchHealthStats(): Promise<HealthStats> {
  const admin = createAdminSupabase();
  const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  // Customer audience. We pull just the columns we need.
  // (staff_notifications follows the same shape and could be unioned
  // but for V3-03 scaffold we report customer-audience health only;
  // the staff variant is a follow-up.)
  const { data, error } = await admin
    .from("customer_notifications")
    .select("delivery_state, created_at, read_at")
    .gte("created_at", since)
    .limit(5000);

  if (error || !data) {
    return {
      totalSent: 0,
      totalDelivered: 0,
      totalSeen: 0,
      totalFailed: 0,
      deliverySuccessRate: 0,
      failureCount: 0,
      avgSentToReadSeconds: null,
    };
  }

  let sent = 0;
  let delivered = 0;
  let seen = 0;
  let failed = 0;
  let readLatencySum = 0;
  let readLatencyCount = 0;

  for (const row of data as Array<{
    delivery_state: string | null;
    created_at: string;
    read_at: string | null;
  }>) {
    switch (row.delivery_state) {
      case "sent":
        sent += 1;
        break;
      case "delivered":
        delivered += 1;
        break;
      case "seen":
        seen += 1;
        if (row.read_at) {
          const created = new Date(row.created_at).getTime();
          const read = new Date(row.read_at).getTime();
          if (Number.isFinite(created) && Number.isFinite(read) && read >= created) {
            readLatencySum += (read - created) / 1000;
            readLatencyCount += 1;
          }
        }
        break;
      case "failed":
        failed += 1;
        break;
      default:
        break;
    }
  }

  const totalNonFailed = sent + delivered + seen;
  const totalAll = totalNonFailed + failed;
  // "Delivered" success = at least delivered status; 'sent' alone is
  // a pending row, so we exclude it from the success numerator.
  const deliveredOrBetter = delivered + seen;
  const deliverySuccessRate = totalAll > 0 ? deliveredOrBetter / totalAll : 0;

  return {
    totalSent: sent,
    totalDelivered: delivered,
    totalSeen: seen,
    totalFailed: failed,
    deliverySuccessRate,
    failureCount: failed,
    avgSentToReadSeconds:
      readLatencyCount > 0 ? readLatencySum / readLatencyCount : null,
  };
}

function formatSeconds(seconds: number | null, t: (s: string) => string): string {
  if (seconds === null) return t("No reads yet");
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 60 * 60) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export type NotificationHealthTileProps = {
  /** Locale token for strings — host passes the resolved locale. */
  locale?: string;
};

export default async function NotificationHealthTile({
  locale = "en",
}: NotificationHealthTileProps) {
  const stats = await fetchHealthStats();
  const t = (text: string) =>
    translateSurfaceLabel(locale as Parameters<typeof translateSurfaceLabel>[0], text);

  const successColor =
    stats.deliverySuccessRate >= 0.95
      ? "text-emerald-600"
      : stats.deliverySuccessRate >= 0.85
        ? "text-amber-600"
        : "text-rose-600";

  return (
    <section
      className="rounded-2xl border border-[var(--acct-line,#e5e7eb)] bg-[var(--acct-bg-soft,#fafaf7)] p-4"
      data-tile="notification-health"
    >
      <header className="mb-3">
        <h3 className="text-sm font-semibold text-[var(--acct-ink,#111827)]">
          {t("Notification health")}
        </h3>
        <p className="mt-0.5 text-xs text-[var(--acct-muted,#6b7280)]">
          {t("Last 24 hours")}
        </p>
      </header>

      <dl className="grid grid-cols-3 gap-3">
        <div>
          <dt className="text-[0.65rem] uppercase tracking-wide text-[var(--acct-muted,#6b7280)]">
            {t("Delivery rate")}
          </dt>
          <dd className={`mt-1 text-lg font-semibold tabular-nums ${successColor}`}>
            {formatPercent(stats.deliverySuccessRate)}
          </dd>
        </div>
        <div>
          <dt className="text-[0.65rem] uppercase tracking-wide text-[var(--acct-muted,#6b7280)]">
            {t("Avg sent to read")}
          </dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-[var(--acct-ink,#111827)]">
            {formatSeconds(stats.avgSentToReadSeconds, t)}
          </dd>
        </div>
        <div>
          <dt className="text-[0.65rem] uppercase tracking-wide text-[var(--acct-muted,#6b7280)]">
            {t("Failures")}
          </dt>
          <dd
            className={`mt-1 text-lg font-semibold tabular-nums ${
              stats.failureCount > 0 ? "text-rose-600" : "text-[var(--acct-ink,#111827)]"
            }`}
          >
            {stats.failureCount}
          </dd>
        </div>
      </dl>

      <details className="mt-3 text-[0.7rem] text-[var(--acct-muted,#6b7280)]">
        <summary className="cursor-pointer select-none font-medium">
          {t("State breakdown")}
        </summary>
        <ul className="mt-2 space-y-1 tabular-nums">
          <li>
            {t("Sent")}: {stats.totalSent}
          </li>
          <li>
            {t("Delivered")}: {stats.totalDelivered}
          </li>
          <li>
            {t("Read")}: {stats.totalSeen}
          </li>
          <li>
            {t("Failed")}: {stats.totalFailed}
          </li>
        </ul>
      </details>
    </section>
  );
}
