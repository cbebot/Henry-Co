"use client";

import { PhoneCall, Sparkles } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";
import { getHubUrl } from "@henryco/config";
import {
  HenryCoSearchBreadcrumb,
  PublicHeader,
  type PublicNavItem,
  getSiteNavigationConfig,
} from "@henryco/ui/public-shell";
import { CareMonogram } from "@/components/brand/CareMonogram";

export type DivisionPublicConfig = {
  name: string;
  sub?: string;
  shortName?: string;
  accent?: string | null;
  /**
   * Operator-uploadable logo url is intentionally NOT honoured in the
   * public Care navbar mark. Care's brand identity is the in-house
   * CareMonogram (Henry & Co. serif H + small-caps "Care" caption +
   * periwinkle droplet). Allowing operators to swap that for an
   * uploaded raster logo created the bug the user flagged: stale
   * uploads of the parent monogram kept overriding the proper Care
   * mark and Care never showed its own identity. The prop stays in
   * the type for non-public surfaces that still want operator
   * override (e.g. admin chrome).
   */
  logoUrl?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  publicNav?: PublicNavItem[];
};

function BrandMark({ accent }: { accent?: string | null }) {
  return (
    <div
      className="
        group/brandmark
        relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden
        rounded-2xl border border-black/10 bg-white/72
        shadow-[0_12px_35px_rgba(0,0,0,0.06)] backdrop-blur-xl
        transition duration-300 ease-out
        hover:border-[color:var(--care-accent)]/35 hover:shadow-[0_18px_40px_rgba(107,124,255,0.18)]
        dark:border-white/10 dark:bg-white/[0.08] dark:shadow-[0_12px_35px_rgba(0,0,0,0.32)]
      "
      style={
        {
          "--care-mark-accent": accent || "#6B7CFF",
        } as CSSProperties
      }
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover/brandmark:opacity-100"
        style={{
          background:
            "radial-gradient(120% 100% at 30% 20%, color-mix(in srgb, var(--care-mark-accent) 22%, transparent) 0%, transparent 70%)",
        }}
      />
      <CareMonogram
        size={32}
        accent={accent || "#6B7CFF"}
        className="relative text-zinc-950 transition duration-300 group-hover/brandmark:scale-[1.04] dark:text-white"
      />
    </div>
  );
}

const DEFAULT_TAGLINE = "Premium garment care, home cleaning, and recurring service";
const DEFAULT_SUB = "Premium garment, home, and workplace care";

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
        mark: <BrandMark accent={division.accent ?? "#6B7CFF"} />,
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
