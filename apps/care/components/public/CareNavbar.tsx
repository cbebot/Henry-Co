"use client";

import { PhoneCall } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { COMPANY, getHubUrl } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import {
  PublicChrome,
  type PublicChromeAccount,
  type PublicNavItem,
  getSiteNavigationConfig,
} from "@henryco/ui/public-shell";
import { HenryCoMonogram } from "@henryco/ui/brand";
import { CARE_PUBLIC_THEME_STYLE } from "@/lib/care-public-theme";

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

const DEFAULT_TAGLINE = "Premium garment care, home cleaning, and recurring service";

/**
 * Care public header — thin config wrapper over the shared, theme-aware
 * PublicChrome (V3-PUBLIC-REBUILD-care). Brand reads "FABRIC CARE / Henry Onyx"
 * (the shared HenryCoMonogram as the mark, standardised across every division);
 * the account dropdown + sign-out
 * are preserved via the slotted CareAccountChip; the bar flips with the page and
 * wears care's cobalt accent (resolved from CARE_PUBLIC_THEME_STYLE).
 */
export default function CareNavbar({
  division,
  account,
  accountMenu,
}: {
  division: DivisionPublicConfig;
  account: PublicChromeAccount;
  accountMenu?: ReactNode;
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const careNav = useMemo(() => getSiteNavigationConfig("care"), []);

  // Drop nav entries the chrome already renders as the primary/aux CTA buttons.
  const ctaHrefs = useMemo(() => {
    const set = new Set<string>();
    if (careNav.defaultCtas?.primary?.href) set.add(careNav.defaultCtas.primary.href);
    if (careNav.defaultCtas?.secondary?.href) set.add(careNav.defaultCtas.secondary.href);
    return set;
  }, [careNav.defaultCtas]);

  const items = useMemo<PublicNavItem[]>(() => {
    const source = division.publicNav?.length ? division.publicNav : careNav.primaryNav;
    return source.filter((item) => !ctaHrefs.has(item.href));
  }, [division.publicNav, careNav.primaryNav, ctaHrefs]);

  return (
    <PublicChrome
      maxWidth="max-w-[92rem]"
      accentStyle={CARE_PUBLIC_THEME_STYLE}
      brand={{
        href: "/",
        name: COMPANY.group.name,
        eyebrow: division.shortName || "Fabric Care",
        mark: <HenryCoMonogram size={26} accent={division.accent || "#6B7CFF"} />,
      }}
      items={items}
      search={{ href: getHubUrl("/search"), label: "Search Henry Onyx" }}
      account={account}
      accountMenu={accountMenu}
      primaryCta={careNav.defaultCtas?.primary}
      auxLink={careNav.defaultCtas?.secondary}
      prepend={
        <div className="mx-auto flex max-w-[92rem] items-center justify-between gap-4 px-4 py-2 text-xs text-[color:var(--home-ink-60)] sm:px-6 lg:px-10">
          <span className="flex items-center gap-2">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[color:var(--home-accent-text)]" />
            {t(DEFAULT_TAGLINE)}
          </span>
          {division.supportPhone ? (
            <span className="hidden items-center gap-2 font-semibold text-[color:var(--home-ink)] lg:inline-flex">
              <PhoneCall className="h-3.5 w-3.5 text-[color:var(--home-accent-text)]" aria-hidden />
              {division.supportPhone}
            </span>
          ) : null}
        </div>
      }
    />
  );
}
