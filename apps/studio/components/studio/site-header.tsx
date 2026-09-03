"use client";

import type { ReactNode } from "react";
import { COMPANY, getDivisionConfig, getHubUrl } from "@henryco/config";
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
 *
 * CHROME-64 (redesign 2026-07-08): the ~40px announcement strip is retired —
 * its support email lives in the footer and the account link in the account
 * chip — and the toolbar rests `dense`. Total chrome: 111px → ~63px, inside
 * the owner's 64px budget.
 */
export function StudioSiteHeader({
  account,
  accountMenu,
  primaryCta,
  auxLink,
}: {
  account: PublicChromeAccount;
  accountMenu?: ReactNode;
  /** AWARE-SP3: role-aware chrome CTAs resolved server-side. Fall back to the
   *  static studio nav config when not supplied (unadopted call sites). */
  primaryCta?: { label: string; href: string };
  auxLink?: { label: string; href: string };
}) {
  return (
    <PublicChrome
      maxWidth="max-w-[92rem]"
      accentStyle={STUDIO_PUBLIC_THEME_STYLE}
      brand={{
        href: "/",
        name: COMPANY.group.name,
        eyebrow: studio.shortName,
        mark: <HenryCoMonogram size={22} accent={studio.accent} />,
      }}
      items={studioNav.primaryNav}
      search={{ href: getHubUrl("/search"), label: "Search Henry Onyx" }}
      account={account}
      accountMenu={accountMenu}
      auxLink={auxLink ?? studioNav.defaultCtas?.aux}
      primaryCta={primaryCta ?? studioNav.defaultCtas?.primary}
      dense
    />
  );
}
