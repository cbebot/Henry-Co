"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { COMPANY, getDivisionConfig, getHubUrl } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import {
  PublicChrome,
  getSiteNavigationConfig,
  type PublicChromeAccount,
} from "@henryco/ui/public-shell";
import { HenryCoMonogram } from "@henryco/ui/brand";
import { PROPERTY_PUBLIC_THEME_STYLE } from "./property-public-theme";

const property = getDivisionConfig("property");
const propertyNav = getSiteNavigationConfig("property");

/**
 * Property public header — a thin config wrapper over the shared, theme-aware
 * `PublicChrome` (V3-PUBLIC-CHROME). All styling lives in PublicChrome on
 * --home-* tokens, so the bar flips with the page theme and wears property's
 * copper accent (resolved from the page's .home-accent-scope). No per-division
 * className overrides — the source of the old "stubborn" light-bar desync.
 */
export function PropertySiteHeader({
  account,
  accountMenu,
}: {
  account: PublicChromeAccount;
  accountMenu?: ReactNode;
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <PublicChrome
      maxWidth="max-w-[92rem]"
      accentStyle={PROPERTY_PUBLIC_THEME_STYLE}
      brand={{
        href: "/",
        // Kicker = the division ("Property"); line = the brand ("Henry Onyx").
        // Avoids the "PROPERTY / Henry Onyx Property" repeat — every site reads
        // "<DIVISION> / Henry Onyx".
        name: COMPANY.group.name,
        eyebrow: property.shortName,
        mark: <HenryCoMonogram size={22} accent={property.accent || "#B06C3E"} />,
      }}
      items={propertyNav.primaryNav}
      search={{ href: getHubUrl("/search"), label: "Search Henry Onyx" }}
      account={account}
      accountMenu={accountMenu}
      /* CHROME-64 (redesign 2026-07-08): announcement strip retired and the
       * toolbar rests dense — the shared <=64px chrome budget. Strip contents
       * (taglines, support links) live in the footer / contact surfaces. */
      dense
    />
  );
}
