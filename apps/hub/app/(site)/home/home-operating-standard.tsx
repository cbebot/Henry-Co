"use client";

import { motion } from "framer-motion";
import type { HubHomeCopy } from "@henryco/i18n";
import { useHomeMotion } from "./home-motion";

type HomeOperatingStandardProps = {
  copy: HubHomeCopy;
};

/**
 * HomeOperatingStandard — why every engine feels the same.
 *
 * This is the "nuke the value cards" section. Instead of a grid of equal
 * boxes, an editorial spread: a sticky thesis column (kicker → serif lead →
 * prose body) beside a hairline-ruled definition list of concrete
 * commitments. Each commitment is a term/description pair (real <dl>
 * semantics), numbered like an annual-report spec sheet — typography and
 * negative space do the work, not chrome.
 */
export function HomeOperatingStandard({ copy }: HomeOperatingStandardProps) {
  const m = useHomeMotion();
  const os = copy.operatingStandard;

  return (
    <section id="standard-why" className="relative scroll-mt-24 border-t border-[color:var(--home-line)]">
      <motion.div
        className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-8 sm:py-28 lg:py-32"
        variants={m.stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-12% 0px -10% 0px" }}
      >
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
          <motion.div variants={m.reveal} className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[color:var(--home-ink-50)]">
              {os.kicker}
            </p>
            <h2
              className="mt-4 text-balance text-2xl font-semibold leading-[1.15] tracking-tight text-[color:var(--home-ink)] sm:text-3xl lg:text-4xl"
              style={{ fontFamily: "var(--acct-font-display)" }}
            >
              {os.lead}
            </h2>
            <p className="mt-6 max-w-prose text-base leading-relaxed text-[color:var(--home-ink-65)]">
              {os.body}
            </p>
          </motion.div>

          <motion.dl variants={m.stagger} className="lg:pt-1">
            {os.principles.map((principle, i) => (
              <motion.div
                key={principle.title}
                variants={m.reveal}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 border-t border-[color:var(--home-line)] py-7 sm:py-8"
              >
                <span
                  aria-hidden
                  className="pt-1 text-xs tabular-nums opacity-70"
                  style={{ fontFamily: "var(--hc-font-mono)", color: "var(--accent)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <dt
                    className="text-lg font-medium tracking-tight text-[color:var(--home-ink)] sm:text-xl"
                    style={{ fontFamily: "var(--acct-font-display)" }}
                  >
                    {principle.title}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-[color:var(--home-ink-65)] sm:text-base">
                    {principle.body}
                  </dd>
                </div>
              </motion.div>
            ))}
          </motion.dl>
        </div>
      </motion.div>
    </section>
  );
}
