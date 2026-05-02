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

  const nav = useMemo<PublicNavItem[]>(() => {
    if (division.publicNav?.length) return division.publicNav;
    return [...careNav.primaryNav];
  }, [division.publicNav, careNav.primaryNav]);

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
