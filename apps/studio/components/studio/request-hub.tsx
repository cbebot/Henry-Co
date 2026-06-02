"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ListChecks,
  MessagesSquare,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { useStudioMotion } from "@/lib/studio/motion";

type OnRamp = {
  href: string;
  kicker: string;
  title: string;
  body: string;
  icon: LucideIcon;
  /** The calmest entry gets a persistent signal accent so the eye lands
   * there first — without shouting over the other two. */
  featured?: boolean;
};

/**
 * StudioRequestHub — the calm front door for /request.
 *
 * Replaces the in-page two-lane landing (StudioRequestLanding, which
 * mounted both the co-pilot panel and the full builder behind a client
 * tab toggle) with three navigational on-ramps. Each routes to a
 * dedicated surface, and all three converge on the same builder + submit
 * contract at /request/build:
 *   - Talk it through    → /request/copilot  (conversational draft)
 *   - Answer a few …     → /request/guided   (adaptive interview)
 *   - Build it yourself  → /request/build    (manual builder)
 *
 * No giant hero (owner rejects oversized headline chrome): a compact
 * kicker + h1 sits above a responsive 3-card grid. The cards stagger in
 * on mount via useStudioMotion (reduced-motion-gated); per-card hover
 * affordances (lift, arrow slide, underline sweep) stay pure CSS.
 */
export function StudioRequestHub() {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const m = useStudioMotion();

  const onRamps: OnRamp[] = [
    {
      href: "/request/copilot",
      kicker: t("Most natural"),
      title: t("Talk it through"),
      body: t("Describe it in your words. We ask, you answer, a brief takes shape."),
      icon: MessagesSquare,
      featured: true,
    },
    {
      href: "/request/guided",
      kicker: t("Fastest"),
      title: t("Answer a few questions"),
      body: t("Tap through quick choices. No blank page."),
      icon: ListChecks,
    },
    {
      href: "/request/build",
      kicker: t("Most detailed"),
      title: t("Build it yourself"),
      body: t("Drive every field. Most control."),
      icon: SlidersHorizontal,
    },
  ];

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Compact hero — kicker + h1 + one calm line. No oversized headline. */}
      <section>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--studio-signal)]">
          {t("Start a brief")}
        </p>
        <h1 className="mt-3 max-w-3xl text-balance text-[1.7rem] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--studio-ink)] sm:text-[2.1rem] md:text-[2.4rem]">
          {t("Tell us what you need.")}
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-[14.5px] leading-[1.7] text-[var(--studio-ink-soft)] sm:text-[15.5px]">
          {t(
            "Three ways in — every one ends in the same brief, with honest pricing before you commit.",
          )}
        </p>
      </section>

      {/* Three on-ramps. Single column on mobile, 3-up from lg. Each card is
          one tap target wrapping its full content for screen readers. */}
      <motion.ul
        variants={m.staggerChildren}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:gap-5 lg:grid-cols-3"
      >
        {onRamps.map((ramp) => (
          <motion.li key={ramp.href} variants={m.reveal}>
            <Link
              href={ramp.href}
              className={[
                "studio-panel group relative flex h-full flex-col overflow-hidden rounded-[1.6rem] p-5 transition duration-300 hover:-translate-y-1 sm:p-6",
                ramp.featured
                  ? "border-[color:var(--home-accent)]"
                  : "hover:border-[color:var(--home-accent-ring)]",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  aria-hidden
                  className={[
                    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] border text-[var(--studio-signal)] transition",
                    ramp.featured
                      ? "border-[color:var(--home-accent)] bg-[color:var(--home-accent-soft)]"
                      : "border-[var(--studio-line)] bg-[color:var(--home-surface-04)] group-hover:border-[color:var(--home-accent-ring)]",
                  ].join(" ")}
                >
                  <ramp.icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-[var(--studio-ink-soft)] transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--studio-signal)]" />
              </div>

              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--studio-signal)]">
                {ramp.kicker}
              </p>
              <h2 className="mt-1.5 text-[1.15rem] font-semibold tracking-tight text-[var(--studio-ink)]">
                {ramp.title}
              </h2>
              <p className="mt-2 text-[13.5px] leading-7 text-[var(--studio-ink-soft)]">
                {ramp.body}
              </p>

              {/* Accent underline sweep — pure-CSS micro-interaction that
                  fills from the left on hover; sits at the card's base. */}
              <span
                aria-hidden
                className="mt-auto block h-px w-0 bg-gradient-to-r from-[var(--studio-signal)] to-transparent transition-all duration-500 ease-out group-hover:w-full"
              />
            </Link>
          </motion.li>
        ))}
      </motion.ul>

      {/* Templates escape hatch — for buyers who already know the shape. */}
      <p className="text-[13.5px] leading-7 text-[var(--studio-ink-soft)]">
        {t("Know exactly what you want?")}{" "}
        <Link
          href="/pick"
          className="font-semibold text-[var(--studio-signal)] underline-offset-4 transition hover:underline"
        >
          {t("Browse ready-made templates →")}
        </Link>
      </p>
    </div>
  );
}
