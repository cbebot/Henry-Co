import { getJobsCopy, type AppLocale, type JobsCopy } from "@henryco/i18n";

/**
 * V3 PASS 21 — <SalaryRange> primitive (Distinctive Rule #5).
 *
 * Renders the mandatory-disclosure salary range alongside (optionally)
 * the p25/p50/p75 benchmark context for the role+location. The
 * benchmark lookup happens server-side via
 * GET /api/jobs/salary/[role]/[location] — the result is passed in as
 * the `benchmark` prop here.
 *
 * Server-friendly — accepts `locale` so server components can resolve
 * without hitting useHenryCoLocale().
 */
export type SalaryRangeProps = {
  locale: AppLocale;
  currency: string;
  min: number | null;
  max: number | null;
  label?: string | null;
  benchmark?: {
    p25: number;
    p50: number;
    p75: number;
    sampleSize: number;
    sourceLabel?: string | null;
  } | null;
};

// Source attribution renders only for vetted display values — the DB column
// is free text, and internal source identifiers must never reach the UI.
const SAFE_SOURCE_LABELS = new Set([
  "Government statistics",
  "Platform survey",
  "Industry report",
]);

function formatMoney(value: number | null, currency: string, locale: AppLocale) {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  try {
    return new Intl.NumberFormat(localeForCurrency(locale, currency), {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString()}`;
  }
}

function localeForCurrency(appLocale: AppLocale, currency: string) {
  if (currency === "NGN") return "en-NG";
  if (currency === "USD") return "en-US";
  if (currency === "GBP") return "en-GB";
  if (currency === "EUR") return "de-DE";
  // Fallback — let Intl pick a sensible region for the app locale.
  return appLocale === "en" ? "en-US" : appLocale;
}

export function SalaryRange({
  locale,
  currency,
  min,
  max,
  label,
  benchmark,
}: SalaryRangeProps) {
  const copy: JobsCopy = getJobsCopy(locale);
  const labels = copy.salary;

  const minLabel = formatMoney(min, currency, locale);
  const maxLabel = formatMoney(max, currency, locale);

  const rangeText = minLabel && maxLabel
    ? `${minLabel} – ${maxLabel}`
    : minLabel || maxLabel || label || "—";

  return (
    <div className="rounded-2xl border border-[var(--jobs-line)] bg-[var(--jobs-paper-soft)] p-4">
      <div className="jobs-kicker">{labels.rangeLabel}</div>
      <div className="mt-1 text-2xl font-semibold text-[var(--jobs-ink)]">
        {rangeText}
      </div>

      {benchmark ? (
        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-[var(--jobs-line)] pt-4 text-sm">
          <div>
            <dt className="jobs-kicker">{labels.p25Label}</dt>
            <dd className="mt-1 font-medium">
              {formatMoney(benchmark.p25, currency, locale)}
            </dd>
          </div>
          <div>
            <dt className="jobs-kicker">{labels.p50Label}</dt>
            <dd className="mt-1 font-medium">
              {formatMoney(benchmark.p50, currency, locale)}
            </dd>
          </div>
          <div>
            <dt className="jobs-kicker">{labels.p75Label}</dt>
            <dd className="mt-1 font-medium">
              {formatMoney(benchmark.p75, currency, locale)}
            </dd>
          </div>
        </dl>
      ) : null}

      {benchmark ? (
        <p className="mt-3 text-xs text-[var(--jobs-muted)]">
          {labels.benchmarkLabel} · {labels.sampleLabel}{" "}
          {benchmark.sampleSize}
          {benchmark.sourceLabel && SAFE_SOURCE_LABELS.has(benchmark.sourceLabel)
            ? ` · ${labels.sourceLabel}: ${benchmark.sourceLabel}`
            : ""}
        </p>
      ) : null}
    </div>
  );
}
