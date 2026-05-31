"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import type { AppLocale, HubHomeCopy } from "@henryco/i18n";
import type { DivisionRow } from "../../lib/divisions";
import type { DivisionLiveStat } from "../../lib/division-stats";
import { useHomeMotion } from "./home-motion";
import { HomeAmbient } from "./home-ambient";

type HomeStandardProps = {
  copy: HubHomeCopy;
  locale: AppLocale;
  divisions: DivisionRow[];
  divisionStats: Record<string, DivisionLiveStat>;
  heroWelcome: string | null;
  accent: string;
};

type CountCell = { id: string; value: string; label: string };
type LiveMetric = { id: string; metric: string; name: string };

/**
 * HomeStandard — the above-the-fold beat: "One standard, many engines".
 *
 * No giant hero. It leads with a confident operator's statement (display
 * serif, gravity not size), one calm sub-line, a single way in, and an honest
 * live proof rail. Every rail number is real: the counts derive from
 * `initialDivisions`; the live phrases come from `divisionStats[key].metric`,
 * which is `string | null` — nulls are filtered out, so a fabricated or zero
 * number cannot render. A restrained ambient depth layer sits behind it all.
 */
export function HomeStandard({
  copy,
  locale,
  divisions,
  divisionStats,
  heroWelcome,
  accent,
}: HomeStandardProps) {
  const m = useHomeMotion();
  const nf = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const total = divisions.length;
  const activeCount = divisions.filter((d) => d.status === "active").length;
  const sectorCount = new Set(divisions.flatMap((d) => d.categories ?? [])).size;

  const countCells: CountCell[] = [];
  if (total > 0)
    countCells.push({ id: "divisions", value: nf.format(total), label: copy.stats.divisions });
  if (activeCount > 0)
    countCells.push({ id: "active", value: nf.format(activeCount), label: copy.stats.activeNow });
  if (sectorCount > 0)
    countCells.push({ id: "sectors", value: nf.format(sectorCount), label: copy.stats.sectors });

  const liveMetrics: LiveMetric[] = divisions
    .map((d) => ({ id: d.key, name: d.name, metric: divisionStats[d.key]?.metric ?? null }))
    .filter((x): x is LiveMetric => Boolean(x.metric))
    .slice(0, 3);

  const hasRail = countCells.length > 0 || liveMetrics.length > 0;

  return (
    <section id="standard" className="relative scroll-mt-24 overflow-hidden">
      <HomeAmbient accent={accent} />

      <motion.div
        className="relative z-10 mx-auto w-full max-w-6xl px-6 py-24 sm:px-8 sm:py-28 lg:py-36"
        variants={m.stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-12% 0px -10% 0px" }}
      >
        {heroWelcome ? (
          <motion.p
            variants={m.reveal}
            className="mb-7 inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-white/45"
          >
            <span aria-hidden className="inline-block h-1.5 w-1.5 rotate-45 bg-[color:var(--accent)]" />
            {heroWelcome}
          </motion.p>
        ) : null}

        <motion.h1
          variants={m.reveal}
          className="max-w-4xl text-balance text-3xl font-semibold leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl"
          style={{ fontFamily: "var(--acct-font-display)" }}
        >
          {copy.standard.statement}
        </motion.h1>

        <motion.p
          variants={m.reveal}
          className="mt-6 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg"
        >
          {copy.standard.sub}
        </motion.p>

        <motion.div variants={m.reveal} className="mt-9">
          <a
            href="#engines"
            className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-medium text-white transition-colors hover:border-[color:var(--accent)] hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            {copy.standard.ctaPrimary}
            <ArrowDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
          </a>
        </motion.div>

        {hasRail ? (
          <motion.div variants={m.reveal} className="mt-16 border-t border-white/10 pt-8">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-white/45">
              {copy.standard.proofRailLabel}
            </p>

            {countCells.length > 0 ? (
              <motion.dl variants={m.stagger} className="mt-6 flex flex-wrap gap-x-12 gap-y-6">
                {countCells.map((cell) => (
                  <motion.div
                    key={cell.id}
                    variants={m.countUp}
                    className="flex flex-col-reverse gap-1"
                  >
                    <dt className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                      {cell.label}
                    </dt>
                    <dd
                      className="text-3xl font-semibold tabular-nums text-white sm:text-4xl"
                      style={{ fontFamily: "var(--hc-font-mono)" }}
                    >
                      {cell.value}
                    </dd>
                  </motion.div>
                ))}
              </motion.dl>
            ) : null}

            {liveMetrics.length > 0 ? (
              <ul className="mt-7 flex flex-wrap items-baseline gap-x-8 gap-y-2">
                {liveMetrics.map((lm) => (
                  <li key={lm.id} className="flex items-baseline gap-2">
                    <span
                      className="text-sm text-white/85"
                      style={{ fontFamily: "var(--hc-font-mono)" }}
                    >
                      {lm.metric}
                    </span>
                    <span className="text-xs text-white/40">{lm.name}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </motion.div>
        ) : null}
      </motion.div>
    </section>
  );
}
