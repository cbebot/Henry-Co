import type { LucideIcon } from "lucide-react";
import MetricTraceDrawer from "./MetricTraceDrawer";

type MetricCardProps = {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  color?: string;
  /**
   * V3 PASS 21 / H5 — Anti-pattern #18 enforcement.
   *
   * Every reconcilable metric MUST declare a `traceId` so the
   * MetricTraceDrawer can surface the underlying SQL filter + result
   * sample + execution timestamp. Cards without a traceId are treated
   * as "bare" and surface a small warning chip until they are
   * promoted.
   */
  traceId?: string;
  traceLabel?: string;
};

export default function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "var(--owner-accent)",
  traceId,
  traceLabel,
}: MetricCardProps) {
  return (
    <div className="owner-metric">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--acct-muted)]">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold text-[var(--acct-ink)]">
            {value}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-[var(--acct-muted)]">
              {subtitle}
            </p>
          )}
          {trend && (
            <p
              className={`mt-1 text-xs font-semibold ${
                trend.positive
                  ? "text-[var(--acct-green)]"
                  : "text-[var(--acct-red)]"
              }`}
            >
              {trend.value}
            </p>
          )}
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: `${color}15` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        {traceId ? (
          <MetricTraceDrawer traceId={traceId} label={traceLabel ?? label} />
        ) : (
          <span
            className="inline-flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--acct-muted)]"
            title="No reconcile trace registered for this metric"
          >
            No trace
          </span>
        )}
      </div>
    </div>
  );
}
