"use client";

import { motion } from "framer-motion";
import type { HubHomeCopy } from "@henryco/i18n";
import type { DivisionRow } from "../../lib/divisions";
import type { DivisionLiveStat } from "../../lib/division-stats";
import { useHomeMotion } from "./home-motion";
import { HomeIndexRow } from "./home-index-row";

type HomeIndexProps = {
  copy: HubHomeCopy;
  divisions: DivisionRow[];
  divisionStats: Record<string, DivisionLiveStat>;
};

/**
 * HomeIndex — the centerpiece: an editorial "index of engines".
 *
 * Not a grid of cards. A full-width typographic directory — the contents page
 * of a serious annual report, a premium departures board — one hairline-ruled
 * row per engine, in intentional registry order (featured first, then
 * `sort_order`, never accidental-alphabetical). Each row is one large link to
 * the division and the live proof points line up in a scannable right column.
 * The signature hover interaction lives in HomeIndexRow; the sibling-dim
 * focus-pull is the one CSS trick that lives here, on the list.
 */
export function HomeIndex({ copy, divisions, divisionStats }: HomeIndexProps) {
  const m = useHomeMotion();

  const ordered = [...divisions].sort((a, b) => {
    if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.name.localeCompare(b.name);
  });

  return (
    <section id="engines" className="relative scroll-mt-24 border-t border-[color:var(--home-line)]">
      <motion.div
        className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-8 sm:py-28 lg:py-32"
        variants={m.stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-12% 0px -10% 0px" }}
      >
        <motion.header variants={m.reveal} className="max-w-3xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[color:var(--home-ink-50)]">
            {copy.index.kicker}
          </p>
          <h2
            className="mt-4 text-balance text-xl leading-relaxed text-[color:var(--home-ink-75)] sm:text-2xl"
            style={{ fontFamily: "var(--acct-font-display)" }}
          >
            {copy.index.lead}
          </h2>
        </motion.header>

        {ordered.length > 0 ? (
          <motion.ul
            variants={m.stagger}
            className="mt-12 border-t border-[color:var(--home-line)] sm:mt-16 [&:focus-within>li:not(:focus-within)]:opacity-50 [&:hover>li:not(:hover)]:opacity-50"
          >
            {ordered.map((division) => (
              <HomeIndexRow
                key={division.key}
                division={division}
                stat={divisionStats[division.key] ?? null}
                href={division.primary_url ?? "#engines"}
                copy={copy}
              />
            ))}
          </motion.ul>
        ) : (
          <motion.p variants={m.reveal} className="mt-12 text-sm text-[color:var(--home-ink-50)]">
            {copy.index.empty}
          </motion.p>
        )}
      </motion.div>
    </section>
  );
}
