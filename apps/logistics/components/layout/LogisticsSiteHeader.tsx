"use client";

import { } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { COMPANY, getDivisionConfig, getHubUrl } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import {
  PublicChrome,
  type PublicChromeAccount,
  type PublicNavItem,
  getSiteNavigationConfig,
} from "@henryco/ui/public-shell";
import { HenryCoMonogram } from "@henryco/ui/brand";
import { LOGISTICS_PUBLIC_THEME_STYLE } from "@/lib/logistics-public-theme";

const logistics = getDivisionConfig("logistics");

/**
 * Logistics public header — thin config wrapper over the shared, theme-aware
 * PublicChrome (V3-PUBLIC-REBUILD-logistics). Brand reads "LOGISTICS / Henry Onyx"
 * (the shared HenryCoMonogram as the mark); the account dropdown + sign-out are
 * preserved via the slotted LogisticsAccountChip; the bar flips with the page and
 * wears logistics' copper accent (resolved from LOGISTICS_PUBLIC_THEME_STYLE).
 */
export default function LogisticsSiteHeader({
  account,
  accountMenu,
}: {
  account: PublicChromeAccount;
  accountMenu?: ReactNode;
}) {
  const locale = useHenryCoLocale();
  const nav = useMemo(() => getSiteNavigationConfig("logistics"), []);

  const ctaHrefs = useMemo(() => {
    const set = new Set<string>();
    if (nav.defaultCtas?.primary?.href) set.add(nav.defaultCtas.primary.href);
    if (nav.defaultCtas?.secondary?.href) set.add(nav.defaultCtas.secondary.href);
    return set;
  }, [nav.defaultCtas]);

  const items = useMemo<PublicNavItem[]>(
    () => nav.primaryNav.filter((item) => !ctaHrefs.has(item.href)),
    [nav.primaryNav, ctaHrefs],
  );

  return (
    <PublicChrome
      maxWidth="max-w-[92rem]"
      accentStyle={LOGISTICS_PUBLIC_THEME_STYLE}
      brand={{
        href: "/",
        name: COMPANY.group.name,
        eyebrow: logistics.shortName || "Logistics",
        mark: <HenryCoMonogram size={22} accent={logistics.accent || "#D06F32"} />,
      }}
      items={items}
      search={{ href: getHubUrl("/search"), label: "Search Henry Onyx" }}
      account={account}
      accountMenu={accountMenu}
      primaryCta={nav.defaultCtas?.primary}
      auxLink={nav.defaultCtas?.secondary}
      /* CHROME-64 (redesign 2026-07-08): announcement strip retired and the
       * toolbar rests dense — the shared <=64px chrome budget. Strip contents
       * (taglines, support links) live in the footer / contact surfaces. */
      dense
    />
  );
}
