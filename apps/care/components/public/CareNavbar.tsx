/* eslint-disable @next/next/no-img-element */
"use client";

import { PhoneCall, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { getHubUrl } from "@henryco/config";
import {
  HenryCoSearchBreadcrumb,
  PublicHeader,
  type PublicNavItem,
  getSiteNavigationConfig,
} from "@henryco/ui/public-shell";
import { HenryCoMonogram } from "@henryco/ui/brand";

export type DivisionPublicConfig = {
  name: string;
  sub?: string;
  shortName?: string;
  accent?: string | null;
  logoUrl?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  publicNav?: PublicNavItem[];
};

function BrandMark({
  name,
  logoUrl,
  accent,
}: {
  name: string;
  shortName?: string;
  logoUrl?: string | null;
  accent?: string | null;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const cleanSrc = typeof logoUrl === "string" && logoUrl.trim() ? logoUrl.trim() : null;
  const isFailed = Boolean(cleanSrc && failedSrc === cleanSrc);

  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.08] shadow-[0_12px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      {cleanSrc && !isFailed ? (
        <img
          src={cleanSrc}
          alt={name}
          className="h-full w-full object-contain p-1.5"
          loading="eager"
          decoding="async"
          onError={() => {
            if (cleanSrc) setFailedSrc(cleanSrc);
          }}
        />
      ) : (
        <HenryCoMonogram size={32} accent={accent || "#C9A227"} />
      )}
    </div>
  );
}

const DEFAULT_TAGLINE =
  "Pickup delivery, home cleaning, office cleaning, and recurring care";

const DEFAULT_SUB =
  "Garment care, home cleaning, office cleaning, and pickup delivery";

export default function CareNavbar({
  division,
  accountSlot,
}: {
  division: DivisionPublicConfig;
  accountSlot?: ReactNode;
}) {
  const careNav = useMemo(() => getSiteNavigationConfig("care"), []);

  /** Drop nav entries that the header already renders as the primary /
   * secondary CTA buttons. Without this filter the header shows two
   * "Track" links and two "Book"/"Book now" buttons in the same row. */
  const ctaHrefs = useMemo(() => {
    const set = new Set<string>();
    if (careNav.defaultCtas?.primary?.href) set.add(careNav.defaultCtas.primary.href);
    if (careNav.defaultCtas?.secondary?.href) set.add(careNav.defaultCtas.secondary.href);
    return set;
  }, [careNav.defaultCtas]);

  const nav = useMemo<PublicNavItem[]>(() => {
    const source = division.publicNav?.length ? division.publicNav : careNav.primaryNav;
    return source.filter((item) => !ctaHrefs.has(item.href));
  }, [division.publicNav, careNav.primaryNav, ctaHrefs]);

  const actions = (
    <>
      <HenryCoSearchBreadcrumb
        href={getHubUrl("/search")}
        className="hidden xl:inline-flex"
      />
      <div className="hidden items-center gap-2 rounded-full border border-black/8 bg-white/68 px-4 py-2 text-xs font-medium text-zinc-600 shadow-[0_12px_32px_rgba(12,17,45,0.06)] xl:flex dark:border-white/10 dark:bg-white/[0.04] dark:text-white/68">
        <Sparkles className="h-4 w-4 text-[color:var(--accent)]" />
        {DEFAULT_TAGLINE}
      </div>
      {division.supportPhone ? (
        <div className="hidden items-center gap-2 rounded-full border border-black/8 bg-white/68 px-4 py-2 text-xs font-medium text-zinc-600 shadow-[0_12px_32px_rgba(12,17,45,0.06)] 2xl:flex dark:border-white/10 dark:bg-white/[0.04] dark:text-white/68">
          <PhoneCall className="h-4 w-4 text-[color:var(--accent)]" />
          {division.supportPhone}
        </div>
      ) : null}
    </>
  );

  return (
    <PublicHeader
      brand={{
        name: division.name,
        sub: division.sub ?? DEFAULT_SUB,
        href: "/",
        mark: (
          <BrandMark
            name={division.name}
            shortName={division.shortName}
            logoUrl={division.logoUrl}
            accent={division.accent ?? "#C9A227"}
          />
        ),
        /** Custom brand text — keeps "Henry & Co. Fabric Care" on a
         * single line at every viewport above 320px. Without this
         * override the default PublicHeader brand block let the long
         * name wrap to four lines and clipped "PREMIUM" → "PRE…" on
         * narrow shells (CHROME-01A audit). On the smallest screens
         * (<sm) we collapse to the short brand only so the toolbar
         * actions still fit. */
        text: (
          <div className="min-w-0 leading-tight">
            <div
              className="block truncate text-[13px] font-black tracking-[0.01em] text-zinc-950 sm:hidden dark:text-white"
              title={division.name}
            >
              {division.shortName || "Fabric Care"}
            </div>
            <div
              className="hidden truncate text-[13.5px] font-black tracking-[0.01em] text-zinc-950 sm:block md:text-[15px] lg:text-base dark:text-white"
              title={division.name}
            >
              {division.name}
            </div>
            {division.sub ? (
              <div className="hidden truncate text-[10.5px] uppercase tracking-[0.18em] text-zinc-500 md:block dark:text-white/45">
                {division.sub}
              </div>
            ) : null}
          </div>
        ),
      }}
      items={nav}
      primaryCta={careNav.defaultCtas?.primary}
      secondaryCta={careNav.defaultCtas?.secondary}
      accountMenu={accountSlot}
      actions={actions}
      headerClassName="z-40 border-b border-[var(--care-border)] bg-[var(--care-bg)] shadow-[0_1px_0_rgba(255,255,255,0.06)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04)]"
      maxWidth="max-w-[92rem]"
    />
  );
}
