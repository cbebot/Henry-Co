import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  color?: string;
};

export default function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "var(--owner-accent)",
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
    </div>
  );
}
