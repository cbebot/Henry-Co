"use client";

import { PhoneCall } from "lucide-react";
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
const DEFAULT_TAGLINE = "Reliable pickup, delivery, and fulfilment with live tracking";

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
  supportPhone,
}: {
  account: PublicChromeAccount;
  accountMenu?: ReactNode;
  supportPhone?: string | null;
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
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
        mark: <HenryCoMonogram size={26} accent={logistics.accent || "#D06F32"} />,
      }}
      items={items}
      search={{ href: getHubUrl("/search"), label: "Search Henry Onyx" }}
      account={account}
      accountMenu={accountMenu}
      primaryCta={nav.defaultCtas?.primary}
      auxLink={nav.defaultCtas?.secondary}
      prepend={
        <div className="mx-auto flex max-w-[92rem] items-center justify-between gap-4 px-4 py-2 text-xs text-[color:var(--home-ink-60)] sm:px-6 lg:px-10">
          <span className="flex items-center gap-2">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[color:var(--home-accent-text)]" />
            {t(DEFAULT_TAGLINE)}
          </span>
          {supportPhone ? (
            <span className="hidden items-center gap-2 font-semibold text-[color:var(--home-ink)] lg:inline-flex">
              <PhoneCall className="h-3.5 w-3.5 text-[color:var(--home-accent-text)]" aria-hidden />
              {supportPhone}
            </span>
          ) : null}
        </div>
      }
    />
  );
}
