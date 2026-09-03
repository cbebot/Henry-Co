"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { HubHomeCopy } from "@henryco/i18n";
import type { DivisionRow } from "../../lib/divisions";
import type { DivisionLiveStat } from "../../lib/division-stats";
import { useHomeMotion } from "./home-motion";

type HomeProofProps = {
  copy: HubHomeCopy;
  divisions: DivisionRow[];
  divisionStats: Record<string, DivisionLiveStat>;
};

type LedgerEntry = { id: string; name: string; metric: string };

/**
 * HomeProof — the honest ledger, and who makes it.
 *
 * The thesis is the copy: "the numbers above are real, and the work is ours."
 * So this beat does NOT re-print the hero's big stat cells — that would
 * contradict "above" and read as padding. Instead it presents the COMPLETE,
 * uncapped live ledger: every division reporting a real `metric`, quiet and
 * tabular (the hero only teased the first three). A `metric: null` never
 * becomes a row, so a fabricated or zero number cannot appear here.
 *
 * It closes with the maker's mark — the work is ours, signed. The mark links
 * the Studio division when it exists in the registry, and degrades to plain
 * text otherwise.
 */
export function HomeProof({ copy, divisions, divisionStats }: HomeProofProps) {
  const m = useHomeMotion();

  const ledger: LedgerEntry[] = divisions
    .map((d) => ({ id: d.key, name: d.name, metric: divisionStats[d.key]?.metric ?? null }))
    .filter((x): x is LedgerEntry => Boolean(x.metric));

  const studio = divisions.find((d) => d.key === "studio");
  const studioHref = studio?.primary_url ?? null;

  return (
    <section id="proof" className="relative scroll-mt-24 border-t border-[color:var(--home-line)]">
      <motion.div
        className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-8 sm:py-28 lg:py-32"
        variants={m.stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-12% 0px -10% 0px" }}
      >
        <motion.header variants={m.reveal} className="max-w-3xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[color:var(--home-ink-50)]">
            {copy.proof.kicker}
          </p>
          <h2
            className="mt-4 text-balance text-2xl font-semibold leading-[1.15] tracking-tight text-[color:var(--home-ink)] sm:text-3xl lg:text-4xl"
            style={{ fontFamily: "var(--acct-font-display)" }}
          >
            {copy.proof.lead}
          </h2>
        </motion.header>

        {ledger.length > 0 ? (
          <motion.div variants={m.reveal} className="mt-14 sm:mt-16">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[color:var(--home-ink-50)]">
              {copy.standard.proofRailLabel}
            </p>
            <motion.dl variants={m.stagger} className="mt-6 border-t border-[color:var(--home-line)]">
              {ledger.map((entry) => (
                <motion.div
                  key={entry.id}
                  variants={m.reveal}
                  className="flex items-baseline justify-between gap-6 border-b border-[color:var(--home-line)] py-4"
                >
                  <dt className="text-sm text-[color:var(--home-ink-55)]">{entry.name}</dt>
                  <dd
                    className="text-sm tabular-nums text-[color:var(--home-ink-85)]"
                    style={{ fontFamily: "var(--hc-font-mono)" }}
                  >
                    {entry.metric}
                  </dd>
                </motion.div>
              ))}
            </motion.dl>
          </motion.div>
        ) : null}

        <motion.div variants={m.reveal} className="mt-14">
          {studioHref ? (
            <a
              href={studioHref}
              className="group inline-flex items-center gap-2.5 rounded-sm text-sm text-[color:var(--home-ink-65)] transition-colors hover:text-[color:var(--home-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--home-ink-70)]"
            >
              <span aria-hidden className="inline-block h-1.5 w-1.5 rotate-45 bg-[color:var(--accent)]" />
              {copy.proof.makersMark}
              <ArrowUpRight className="h-4 w-4 text-[color:var(--home-ink-30)] transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[color:var(--accent)]" />
            </a>
          ) : (
            <p className="inline-flex items-center gap-2.5 text-sm text-[color:var(--home-ink-65)]">
              <span aria-hidden className="inline-block h-1.5 w-1.5 rotate-45 bg-[color:var(--accent)]" />
              {copy.proof.makersMark}
            </p>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
