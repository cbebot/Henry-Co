"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { getSurfaceCopy, translateSurfaceLabel } from "@henryco/i18n";
import { useOptionalHenryCoLocale } from "@henryco/i18n/react";
import { cn } from "../lib/cn";

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

type FooterGroup = {
  title: string;
  links: FooterLink[];
};

export function PublicFooter({
  brand,
  description,
  support,
  groups,
  attribution = "Designed and built in-house by HenryCo Studio for the HenryCo ecosystem",
  attributionHref,
  bottomLinks,
  afterDescription,
  afterSupport,
  socials,
  tone = "default",
  className,
}: {
  brand: string;
  description: string;
  support: {
    email: string;
    phone: string;
  };
  groups: FooterGroup[];
  /** Subtle studio attribution, rendered in the bottom strip. */
  attribution?: string;
  attributionHref?: string;
  /** e.g. legal links like Privacy, Terms — rendered right of the attribution. */
  bottomLinks?: FooterLink[];
  /** Extra slot under the description (e.g. locale switcher). */
  afterDescription?: ReactNode;
  /** Extra slot under the support block. */
  afterSupport?: ReactNode;
  /** Social icon links. */
  socials?: { label: string; href: string; icon?: ReactNode }[];
  /** `onDark` keeps the footer legible on navy / black ecosystem surfaces. */
  tone?: "default" | "onDark";
  className?: string;
}) {
  const locale = useOptionalHenryCoLocale() ?? "en";
  const surfaceCopy = getSurfaceCopy(locale);
  const localize = (label: string) => translateSurfaceLabel(locale, label);
  const onDark = tone === "onDark";

  return (
    <footer
      className={cn(
        "relative mt-20 border-t backdrop-blur-xl",
        onDark
          ? "border-white/10 bg-[#050816]/72 text-white"
          : "border-zinc-200/80 bg-white/85 dark:border-white/10 dark:bg-[#050816]/60",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/35 to-transparent"
      />
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-10">
        <div>
          <div className="text-lg font-black tracking-[-0.01em] text-zinc-950 dark:text-white">
            {brand}
          </div>
          <p className="mt-4 max-w-md text-sm leading-7 text-zinc-600 dark:text-white/65">
            {description}
          </p>

          <div className="mt-6 space-y-1.5 text-sm text-zinc-700 dark:text-white/75">
            <div className="font-medium">{support.email}</div>
            <div className="text-zinc-500 dark:text-white/55">{support.phone}</div>
            {afterSupport}
          </div>

          {afterDescription ? <div className="mt-6">{afterDescription}</div> : null}

          {socials && socials.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {socials.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200/85 bg-white text-zinc-700 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:text-zinc-950 motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/75 dark:hover:border-white/20 dark:hover:text-white"
                >
                  {social.icon ?? (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                      {social.label.slice(0, 2)}
                    </span>
                  )}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        {groups.map((group) => (
          <div key={group.title}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-white/55">
              {localize(group.title)}
            </div>
            <div className="mt-4 space-y-3">
              {group.links.map((link) =>
                link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-sm font-medium text-zinc-700 transition hover:text-zinc-950 dark:text-white/75 dark:hover:text-white"
                  >
                    {localize(link.label)}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="block text-sm font-medium text-zinc-700 transition hover:text-zinc-950 dark:text-white/75 dark:hover:text-white"
                  >
                    {localize(link.label)}
                  </Link>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-zinc-200/75 px-5 py-5 text-xs text-zinc-500 dark:border-white/10 dark:text-white/50 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            © {new Date().getFullYear()} {brand}. {surfaceCopy.footer.allRightsReserved}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {bottomLinks?.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-500 transition hover:text-zinc-800 dark:text-white/55 dark:hover:text-white"
                >
                  {localize(link.label)}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-zinc-500 transition hover:text-zinc-800 dark:text-white/55 dark:hover:text-white"
                >
                  {localize(link.label)}
                </Link>
              )
            )}
            {attribution ? (
              attributionHref ? (
                <a
                  href={attributionHref}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500 transition hover:text-amber-700 dark:text-white/55 dark:hover:text-amber-300"
                >
                  <span
                    aria-hidden
                    className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500/80 dark:bg-amber-300/80"
                  />
                  {attribution}
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-white/55">
                  <span
                    aria-hidden
                    className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500/80 dark:bg-amber-300/80"
                  />
                  {attribution}
                </span>
              )
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
