/**
 * Public design system — the shared site footer (V3-PUBLIC-DESIGN-01b).
 *
 * ONE footer for every Henry Onyx public site. It consumes the `--home-*` token
 * layer (packages/ui/src/styles/public-design.css) so it is the same visual
 * family as the hero — Fraunces display, the one gold accent, the ink ramp, the
 * editorial section rhythm — in BOTH themes (the tokens flip on `.dark`).
 *
 * Editorial, not a link dump: four hairline-separated bands, each with its own
 * internal rhythm (brand voice → division masthead → page index → legal
 * baseline), so it reads as hierarchy at a glance rather than a monotonous wall
 * of equal blocks.
 *
 * SOURCES OF TRUTH (no hardcoding):
 *   • Division names + URLs  ← @henryco/config getPublicDivisions() → the brand
 *     "Henry Onyx <Division>" label + getDivisionUrl(), so the henry.holdings
 *     domain migration stays a single config flip with ZERO hardcoded domains.
 *   • Brand + legal entity    ← COMPANY.group.name / .legalName.
 *   • Every other word        ← the `copy` prop (i18n). Zero hardcoded strings.
 *
 * Server-safe (no "use client", no hooks): renders on the server where it can,
 * ships no client JS of its own. Motion is pure CSS + reduced-motion-gated.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Mail, Phone } from "lucide-react";
import {
  COMPANY,
  getPublicDivisions,
  type PublicDivisionLink,
} from "@henryco/config";
import { cn } from "../cn";
import { LaunchInterceptor } from "../public-shell/launch-interceptor";

export type SiteFooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type SiteFooterColumn = {
  title: string;
  links: SiteFooterLink[];
};

export type PublicSiteFooterCopy = {
  /** A short, warm one-line statement of what the group is. Omitted if empty. */
  statement?: string | null;
  /** Eyebrow over the division index. */
  divisionsLabel: string;
  /** "All rights reserved." — follows the © {year} {legalName}. */
  rightsReserved: string;
  /** The "built in-house by Henry Onyx Studio …" maker's mark (brand-correct). */
  attribution: string;
};

/**
 * Render "Henry Onyx" with the Fraunces ampersand as a quiet brand detail —
 * italic + accent-as-text (AA-safe on both themes). Falls back to a plain
 * wordmark for any brand string without a " & ".
 */
function BrandWordmark({ name }: { name: string }) {
  const parts = name.split(" & ");
  return (
    <span
      className="home-display"
      style={{ fontFamily: "var(--home-font-display)" }}
    >
      {parts.length === 2 ? (
        <>
          {parts[0]}{" "}
          <span className="italic text-[color:var(--home-accent-text)]">&amp;</span>{" "}
          {parts[1]}
        </>
      ) : (
        name
      )}
    </span>
  );
}

function DivisionRow({ division }: { division: PublicDivisionLink }) {
  return (
    <li>
      <a
        href={division.url}
        className="home-lift group flex items-center gap-3 border-t border-[color:var(--home-line-08)] py-3.5 home-focus"
      >
        <span
          aria-hidden
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: division.accent }}
        />
        <span
          className="shrink-0 text-[15px] font-medium text-[color:var(--home-ink-85)] transition-colors group-hover:text-[color:var(--home-ink)]"
          style={{ fontFamily: "var(--home-font-display)" }}
        >
          {division.name}
        </span>
        <span className="flex-1" />
        <ArrowUpRight
          aria-hidden
          className="h-4 w-4 shrink-0 text-[color:var(--home-ink-30)] transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[color:var(--home-accent-text)] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
        />
      </a>
    </li>
  );
}

function PageColumn({ column }: { column: SiteFooterColumn }) {
  return (
    <nav aria-label={column.title} className="flex flex-col gap-3">
      <p className="home-eyebrow text-[color:var(--home-ink-50)]">{column.title}</p>
      <ul className="flex flex-col gap-2.5">
        {column.links.map((link) => {
          const className =
            "text-sm text-[color:var(--home-ink-65)] transition-colors hover:text-[color:var(--home-ink)] home-focus";
          return (
            <li key={`${link.label}-${link.href}`}>
              {link.external ? (
                <a href={link.href} target="_blank" rel="noreferrer" className={className}>
                  {link.label}
                </a>
              ) : (
                <Link href={link.href} className={className}>
                  {link.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * PublicSiteFooter — the shared, themeable, i18n-ready site footer.
 *
 * @param copy      every word, via i18n (see PublicSiteFooterCopy).
 * @param columns   the page-link groups for THIS site (e.g. Company, Legal).
 * @param support   optional contact line shown in the brand band.
 * @param divisions defaults to the canonical config list; override only to scope.
 */
export function PublicSiteFooter({
  copy,
  columns,
  support,
  divisions = getPublicDivisions(),
  brandName = COMPANY.group.name,
  legalName = COMPANY.group.legalName,
  className,
  topSlot,
}: {
  copy: PublicSiteFooterCopy;
  columns: SiteFooterColumn[];
  support?: { email?: string | null; phone?: string | null };
  divisions?: PublicDivisionLink[];
  brandName?: string;
  legalName?: string;
  className?: string;
  /** Optional extra slot under the support line (e.g. a locale switcher). */
  topSlot?: ReactNode;
}) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "relative border-t border-[color:var(--home-line)] bg-[color:var(--home-canvas-deep)] text-[color:var(--home-ink)]",
        className,
      )}
    >
      {/* Branded division→division launch transition. Mounted once here on the
          footer — which is present on every public surface — so ANY link to a
          different division subdomain triggers the "switching divisions"
          overlay, via a single document-level interceptor (no per-link wiring). */}
      <LaunchInterceptor
        divisions={divisions.map((division) => ({
          name: division.name,
          url: division.url,
          accent: division.accent,
        }))}
      />

      {/* A whisper of the accent across the top seam — the only flourish. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--home-accent)] to-transparent opacity-40"
      />

      <div className="home-shell">
        {/* BAND 1 — brand voice: the confident one-line statement + how to reach us. */}
        <div className="flex flex-col gap-5 py-14 sm:py-16">
          <BrandWordmark name={brandName} />
          <span aria-hidden className="h-px w-16 bg-[color:var(--home-accent)]" />
          {copy.statement ? <p className="home-lede max-w-xl">{copy.statement}</p> : null}

          {support?.email || support?.phone ? (
            <div className="mt-1 flex flex-col gap-2 text-sm text-[color:var(--home-ink-65)] sm:flex-row sm:gap-6">
              {support.email ? (
                <a
                  href={`mailto:${support.email}`}
                  className="inline-flex items-center gap-2 font-medium text-[color:var(--home-ink)] transition-colors hover:text-[color:var(--home-accent-text)] home-focus"
                >
                  <Mail aria-hidden className="h-3.5 w-3.5 text-[color:var(--home-accent-text)]" />
                  {support.email}
                </a>
              ) : null}
              {support.phone ? (
                /* NUMBER-PURGE (owner 2026-07-08): raw company numbers are
                 * never rendered anywhere in the ecosystem — Google indexed
                 * them and it reads unprofessional. A phone value becomes a
                 * MASKED WhatsApp deep link: the label is the brand word
                 * (proper noun — locale-exempt), the digits live only in the
                 * href, never in visible text. */
                <a
                  href={`https://wa.me/${support.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-[color:var(--home-ink)] home-focus"
                >
                  <Phone aria-hidden className="h-3.5 w-3.5 text-[color:var(--home-accent-text)]" />
                  WhatsApp
                </a>
              ) : null}
            </div>
          ) : null}

          {topSlot ? <div className="mt-1">{topSlot}</div> : null}
        </div>

        {/* BAND 2 — the division masthead: a crawlable index of plain links, never tiles. */}
        {divisions.length > 0 ? (
          <nav aria-label={copy.divisionsLabel} className="border-t border-[color:var(--home-line)] py-12">
            <p className="home-eyebrow text-[color:var(--home-ink-50)]">{copy.divisionsLabel}</p>
            <ul className="mt-5 grid grid-cols-1 gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
              {divisions.map((division) => (
                <DivisionRow key={division.key} division={division} />
              ))}
            </ul>
          </nav>
        ) : null}

        {/* BAND 3 — page index: company + legal as inline groups, not stacked cards.
            Each column is its own labelled <nav>, so the region needs no extra heading. */}
        {columns.length > 0 ? (
          <div className="flex flex-col gap-8 border-t border-[color:var(--home-line)] py-12 sm:flex-row sm:gap-16">
            {columns.map((column) => (
              <PageColumn key={column.title} column={column} />
            ))}
          </div>
        ) : null}

        {/* BAND 4 — legal baseline: the registered entity + the maker's mark. */}
        <div className="flex flex-col gap-4 border-t border-[color:var(--home-line)] py-8 text-[color:var(--home-ink-50)] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            © {year} {legalName}. {copy.rightsReserved}
          </p>
          <p className="home-eyebrow inline-flex items-center gap-2 text-[color:var(--home-ink-50)]">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rotate-45 bg-[color:var(--home-accent)]"
            />
            {copy.attribution}
          </p>
        </div>
      </div>
    </footer>
  );
}
