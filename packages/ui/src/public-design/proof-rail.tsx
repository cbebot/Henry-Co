/**
 * Public design system — the honest proof rail (V3-PUBLIC-DESIGN-01).
 *
 * "Show the real thing." This rail renders real numbers as the proof beat and
 * ENFORCES integrity in code: any item whose value is null/undefined/empty is
 * dropped, and if nothing real remains the whole rail renders `null` — so a
 * fabricated, zero, or placeholder figure can never reach the page. This is the
 * pattern the hub homepage pioneered (home-standard / home-proof) lifted into the
 * shared system; it is the brand's honesty made structural. Numbers use mono/tabular.
 */
import type { ReactNode } from "react";
import { cn } from "../cn";

export type ProofItem = {
  /** Real value. null/undefined/"" → the item (and, if all empty, the rail) is suppressed. */
  value: string | number | null | undefined;
  label: ReactNode;
};

export function PublicProofRail({
  items,
  label,
  className,
}: {
  items: ProofItem[];
  /** Optional eyebrow above the figures. */
  label?: ReactNode;
  className?: string;
}) {
  const real = items.filter(
    (it) => it.value !== null && it.value !== undefined && String(it.value).trim() !== "",
  );
  if (real.length === 0) return null;

  return (
    <div className={cn("border-t border-[color:var(--home-line)] pt-7", className)}>
      {label ? <p className="home-eyebrow">{label}</p> : null}
      <dl className={cn("flex flex-wrap gap-x-12 gap-y-6", label && "mt-5")}>
        {real.map((it, i) => (
          <div key={i} className="flex flex-col-reverse gap-1">
            <dt className="home-caption">{it.label}</dt>
            <dd className="home-num text-3xl font-semibold text-[color:var(--home-ink)] sm:text-4xl">
              {it.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
