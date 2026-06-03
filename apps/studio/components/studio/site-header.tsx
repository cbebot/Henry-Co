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
import { STUDIO_PUBLIC_THEME_STYLE } from "@/components/studio/studio-public-theme";

const studio = getDivisionConfig("studio");
const studioNav = getSiteNavigationConfig("studio");

/**
 * Studio public header — thin config wrapper over the shared, theme-aware
 * PublicChrome (V3-PUBLIC-CHROME). Brand reads "STUDIO / Henry Onyx"; CTAs are
 * studio's "Speak to Studio" (aux) + "Start a project" (primary, teal); the full
 * account dropdown + sign-out is preserved via the slotted StudioAccountChip
 * (accountMenu). Teal accent resolves from the page's STUDIO_PUBLIC_THEME_STYLE.
 */
export function StudioSiteHeader({
  supportEmail,
  accountHref,
  account,
  accountMenu,
}: {
  supportEmail: string | null;
  accountHref: string;
  account: PublicChromeAccount;
  accountMenu?: ReactNode;
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <PublicChrome
      maxWidth="max-w-[92rem]"
      accentStyle={STUDIO_PUBLIC_THEME_STYLE}
      brand={{
        href: "/",
        name: COMPANY.group.name,
        eyebrow: studio.shortName,
        mark: <HenryCoMonogram size={26} accent={studio.accent} />,
      }}
      items={studioNav.primaryNav}
      search={{ href: getHubUrl("/search"), label: "Search Henry Onyx" }}
      account={account}
      accountMenu={accountMenu}
      auxLink={studioNav.defaultCtas?.aux}
      primaryCta={studioNav.defaultCtas?.primary}
      prepend={
        <div className="mx-auto flex max-w-[92rem] flex-wrap items-center justify-between gap-4 px-5 py-2 text-xs text-[color:var(--home-ink-60)] sm:px-8 lg:px-10">
          <span className="flex items-center gap-2">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[color:var(--home-accent-text)]" />
            {t("Premium briefs, verified payment guidance, and project history in your Henry Onyx account")}
          </span>
          <span className="hidden items-center gap-5 lg:flex">
            <span>{supportEmail || studio.supportEmail}</span>
            <Link
              href={accountHref}
              className="font-semibold text-[color:var(--home-ink)] transition-colors hover:text-[color:var(--home-accent-text)]"
            >
              {t("Henry Onyx account")}
            </Link>
          </span>
        </div>
      }
    />
  );
}
