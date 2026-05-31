"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { HubHomeCopy } from "@henryco/i18n";
import type { DivisionRow } from "../../lib/divisions";
import { useHomeMotion } from "./home-motion";

type FooterLink = { href: string; label: string };

type HomeFooterProps = {
  brandTitle: string;
  brandFooterBlurb: string | null;
  divisions: DivisionRow[];
  copy: HubHomeCopy;
};

/**
 * HomeFooter — the company homepage's closing statement.
 *
 * Deliberately NOT a card stack or a single long card: four hairline-separated
 * bands, each with its OWN internal structure, so the footer reads as editorial
 * hierarchy (brand voice → engine index → page rows → baseline) rather than a
 * monotonous grid of equal blocks. The engine directory is a masthead-style
 * index of plain crawlable <a> links — premium typographic rhythm, not tiles.
 */
export function HomeFooter({
  brandTitle,
  brandFooterBlurb,
  divisions,
  copy,
}: HomeFooterProps) {
  const motionV = useHomeMotion();
  const year = new Date().getFullYear();

  const companyLinks: FooterLink[] = [
    { href: "/about", label: copy.companyPages.about },
    { href: "/contact", label: copy.companyPages.contact },
    { href: "/privacy", label: copy.footer.linkPrivacy },
    { href: "/terms", label: copy.footer.linkTerms },
  ];
  const globalLinks: FooterLink[] = [
    { href: "/search", label: copy.topBar.search },
    { href: "/preferences", label: copy.footer.linkPreferences },
  ];

  return (
    <footer className="relative border-t border-white/10 bg-[#050816] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />

      <motion.div
        className="mx-auto w-full max-w-6xl px-6 sm:px-8"
        variants={motionV.stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      >
        {/* BAND 1 — brand voice: the confident "having us" line, joy at a glance */}
        <motion.div
          variants={motionV.reveal}
          className="flex flex-col gap-5 py-14 sm:py-16"
        >
          <span
            className="text-2xl font-semibold tracking-tight sm:text-3xl"
            style={{ fontFamily: "var(--acct-font-display)" }}
          >
            {brandTitle}
          </span>
          <span
            aria-hidden
            className="h-px w-16 bg-[color:var(--accent)]"
          />
          {brandFooterBlurb ? (
            <p className="max-w-2xl text-balance text-base leading-relaxed text-white/65">
              {brandFooterBlurb}
            </p>
          ) : null}
        </motion.div>

        {/* BAND 2 — the engine directory: a masthead index, never card tiles */}
        {divisions.length > 0 ? (
          <motion.nav
            variants={motionV.reveal}
            aria-label={copy.footer.exploreDivisions}
            className="border-t border-white/10 py-12"
          >
            <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-white/45">
              {copy.footer.exploreDivisions}
            </h2>
            <ul className="mt-6 grid grid-cols-1 gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
              {divisions.map((division) => (
                <li key={division.key}>
                  <a
                    href={division.primary_url ?? "#engines"}
                    className="group flex items-center gap-3 border-t border-white/[0.08] py-3.5 transition-colors hover:bg-white/[0.02]"
                  >
                    <span
                      className="shrink-0 font-medium text-white/85 transition-colors group-hover:text-white"
                      style={{ fontFamily: "var(--acct-font-display)" }}
                    >
                      {division.name}
                    </span>
                    {division.tagline ? (
                      <span className="min-w-0 flex-1 truncate text-sm text-white/40 transition-colors group-hover:text-white/60">
                        {division.tagline}
                      </span>
                    ) : (
                      <span className="flex-1" />
                    )}
                    <ArrowUpRight
                      aria-hidden
                      className="h-4 w-4 shrink-0 text-white/30 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[color:var(--accent)]"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>
        ) : null}

        {/* BAND 3 — company + global pages as inline rows, not stacked cards */}
        <motion.div
          variants={motionV.reveal}
          className="border-t border-white/10 py-12"
        >
          <h2 className="sr-only">{copy.footer.companyPages}</h2>
          <div className="flex flex-col gap-8 sm:flex-row sm:gap-16">
            <FooterLinkGroup label={copy.footer.colHub} links={companyLinks} />
            <FooterLinkGroup label={copy.footer.colGlobal} links={globalLinks} />
          </div>
        </motion.div>

        {/* BAND 4 — baseline: copyright + the maker's mark */}
        <motion.div
          variants={motionV.reveal}
          className="flex flex-col gap-4 border-t border-white/10 py-8 text-sm text-white/40 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{`© ${year} ${brandTitle}. ${copy.footer.copyrightAllRightsReserved}`}</p>
          <p className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rotate-45 bg-[color:var(--accent)]"
            />
            {copy.footer.designedBy}
          </p>
        </motion.div>
      </motion.div>
    </footer>
  );
}

function FooterLinkGroup({
  label,
  links,
}: {
  label: string;
  links: FooterLink[];
}) {
  return (
    <nav aria-label={label} className="flex flex-col gap-3">
      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-white/45">
        {label}
      </span>
      <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-white/60 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
