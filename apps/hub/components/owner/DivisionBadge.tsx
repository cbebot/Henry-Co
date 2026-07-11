import { divisionLabel, divisionColor } from "@/lib/format";

// Divisions with a canonical two-theme accent in account-tokens.css. Slugs
// outside this set (wallet, hotel, building…) keep the single-value hex from
// divisionColor(), which stays hex-only for email/report HTML.
const CANONICAL_DIVISION_ACCENTS = new Set([
  "hub",
  "account",
  "staff",
  "care",
  "marketplace",
  "property",
  "logistics",
  "jobs",
  "learn",
  "studio",
  "gaming",
  "security",
  "system",
]);

export default function DivisionBadge({ division }: { division: string | null | undefined }) {
  const slug = division || "unknown";
  const color = CANONICAL_DIVISION_ACCENTS.has(slug)
    ? `var(--acct-div-${slug}, ${divisionColor(slug)})`
    : divisionColor(slug);
  const label = divisionLabel(slug);

  return (
    <span
      className="acct-chip gap-1.5 text-[var(--acct-ink)]"
      style={{
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
      }}
    >
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
