import { ArrowRight } from "lucide-react";
import { AmbientGlow, Magnetic, PublicCTA } from "@henryco/ui/public-design";

/**
 * HomeEcosystem — the landing's V3 showcase band (owner directive
 * 2026-07-08: the /v3 surfaces must be visible ON the landing, not only
 * in the footer).
 *
 * Placed directly after the divisions index — the visitor has just seen
 * what exists; this band offers the walk. Lagos doctrine applied: three
 * elements (title, one support line, one primary CTA), 2x breathing,
 * the shared AmbientGlow as its depth layer, the primary magnetized.
 * All copy arrives pre-translated from the v3 namespace — zero new keys.
 */

export type HomeEcosystemCopy = {
  eyebrow: string;
  title: string;
  supportLine: string;
  tryLabel: string;
  shippedLabel: string;
  earnLabel: string;
};

export function HomeEcosystem({ copy }: { copy: HomeEcosystemCopy }) {
  return (
    <section id="ecosystem" className="relative scroll-mt-24 overflow-hidden">
      <AmbientGlow />
      <div className="home-shell relative z-10 py-24 sm:py-32">
        <div className="home-reveal max-w-2xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[color:var(--home-accent-text)]">
            {copy.eyebrow}
          </p>
          <h2 className="home-display mt-6 text-[color:var(--home-ink)]">{copy.title}</h2>
          <p className="home-body-sm mt-6 max-w-xl text-[color:var(--home-ink-60)]">
            {copy.supportLine}
          </p>
        </div>

        <div className="home-reveal mt-12 flex flex-wrap items-center gap-x-6 gap-y-4">
          <Magnetic>
            <PublicCTA href="/v3/try" size="lg" trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden />}>
              {copy.tryLabel}
            </PublicCTA>
          </Magnetic>
          <PublicCTA href="/v3/what-shipped" variant="ghost">
            {copy.shippedLabel}
          </PublicCTA>
          <PublicCTA href="/v3/how-we-earn" variant="ghost">
            {copy.earnLabel}
          </PublicCTA>
        </div>
      </div>
    </section>
  );
}
