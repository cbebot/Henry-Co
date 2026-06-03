"use client";

import Link from "next/link";
import { getDivisionConfig, getHubUrl } from "@henryco/config";
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
export function PropertySiteHeader({ account }: { account: PublicChromeAccount }) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <PublicChrome
      maxWidth="max-w-[92rem]"
      accentStyle={PROPERTY_PUBLIC_THEME_STYLE}
      brand={{
        href: "/",
        name: property.name,
        eyebrow: property.shortName,
        mark: <HenryCoMonogram size={26} accent={property.accent || "#B06C3E"} />,
      }}
      items={propertyNav.primaryNav}
      search={{ href: getHubUrl("/search"), label: "Search Henry Onyx" }}
      account={account}
      prepend={
        <div className="mx-auto flex max-w-[92rem] items-center justify-between gap-4 px-4 py-2 text-xs text-[color:var(--home-ink-60)] sm:px-6 lg:px-8">
          <span className="flex items-center gap-2">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[color:var(--home-accent-text)]" />
            {t("Curated listings, guided viewings, and managed-property trust rails")}
          </span>
          <Link
            href="/managed"
            className="hidden font-semibold text-[color:var(--home-ink)] transition hover:text-[color:var(--home-accent-text)] lg:inline-flex"
          >
            {t("Managed property")}
          </Link>
        </div>
      }
    />
  );
}
