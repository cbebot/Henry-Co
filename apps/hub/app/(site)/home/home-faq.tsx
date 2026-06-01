"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { HubHomeCopy } from "@henryco/i18n";
import { useHomeMotion } from "./home-motion";

type HomeFaqItem = { q: string; a: string };

type HomeFaqProps = {
  copy: HubHomeCopy;
  faqs: Array<{ question?: string | null; answer?: string | null }>;
};

/**
 * HomeFaq — the calm questions beat: native disclosure, not a card stack.
 *
 * Each row is a real `<details>/<summary>` — the accordion the browser already
 * ships: keyboard-operable, screen-reader state for free, no client JS for the
 * toggle (so it is reduced-motion-safe by construction). The shared `name`
 * makes it a single-open accordion via markup alone; browsers without support
 * just allow multiple open. framer only animates the scroll reveal, never the
 * disclosure.
 *
 * Real published FAQs (localized upstream, shape `{question, answer}`) win;
 * the static `copy.faqFallback` (`{q, a}`) only fills in when none exist — the
 * fallback never masks real content.
 */
export function HomeFaq({ copy, faqs }: HomeFaqProps) {
  const m = useHomeMotion();

  const dbFaqs: HomeFaqItem[] = faqs
    .map((f) => ({ q: (f.question ?? "").trim(), a: (f.answer ?? "").trim() }))
    .filter((f) => f.q.length > 0 && f.a.length > 0);
  const items: HomeFaqItem[] = dbFaqs.length > 0 ? dbFaqs : copy.faqFallback;

  return (
    <section id="questions" className="relative scroll-mt-24 border-t border-[color:var(--home-line)]">
      <motion.div
        className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-8 sm:py-28 lg:py-32"
        variants={m.stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-12% 0px -10% 0px" }}
      >
        <motion.header variants={m.reveal} className="max-w-3xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[color:var(--home-ink-50)]">
            {copy.faq.eyebrow}
          </p>
          <h2
            className="mt-4 text-balance text-2xl font-semibold leading-[1.15] tracking-tight text-[color:var(--home-ink)] sm:text-3xl lg:text-4xl"
            style={{ fontFamily: "var(--acct-font-display)" }}
          >
            {copy.faq.title}
          </h2>
          <p className="mt-4 max-w-prose text-base leading-relaxed text-[color:var(--home-ink-55)]">
            {copy.faq.subtitle}
          </p>
        </motion.header>

        <motion.div variants={m.stagger} className="mt-12 border-t border-[color:var(--home-line)] sm:mt-16">
          {items.map((item) => (
            <motion.div key={item.q} variants={m.reveal}>
              <details name="hub-faq" className="group border-b border-[color:var(--home-line)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-sm py-6 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--home-ink-70)] [&::-webkit-details-marker]:hidden">
                  <span className="text-base font-medium tracking-tight text-[color:var(--home-ink-85)] transition-colors group-open:text-[color:var(--home-ink)] sm:text-lg">
                    {item.q}
                  </span>
                  <ChevronDown
                    aria-hidden
                    className="h-5 w-5 shrink-0 text-[color:var(--home-ink-35)] transition-transform duration-300 group-open:rotate-180 group-open:text-[color:var(--accent)]"
                  />
                </summary>
                <div className="max-w-prose pb-7 text-sm leading-relaxed text-[color:var(--home-ink-60)] sm:text-base">
                  {item.a}
                </div>
              </details>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
