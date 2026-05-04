"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { getDivisionConfig, getHubUrl } from "@henryco/config";
import {
  HenryCoSearchBreadcrumb,
  PublicHeader,
  type PublicNavItem,
  getSiteNavigationConfig,
} from "@henryco/ui/public-shell";
import { HenryCoMonogram } from "@henryco/ui/brand";
import { StudioThemeToggle } from "@/components/studio/theme-toggle";

const studio = getDivisionConfig("studio");
const studioNav = getSiteNavigationConfig("studio");

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function StudioSiteHeader({
  supportEmail,
  accountHref,
  accountMenu,
}: {
  supportEmail: string | null;
  accountHref: string;
  accountMenu?: ReactNode;
}) {
  const getNavItemClassName = (
    _item: PublicNavItem,
    active: boolean,
    placement: "bar" | "sheet"
  ) => {
    if (placement === "bar") {
      return joinClassNames(
        "rounded-full px-4 py-2 text-sm font-medium transition",
        active
          ? "bg-[rgba(146,241,240,0.14)] text-[var(--studio-ink)]"
          : "text-[var(--studio-ink-soft)] hover:text-[var(--studio-ink)]"
      );
    }
    return "rounded-[1.2rem] border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm font-medium text-[var(--studio-ink)]";
  };

  const prepend = (
    <div className="border-b border-[rgba(146,241,240,0.08)]">
      <div className="mx-auto flex max-w-[92rem] flex-wrap items-center justify-between gap-4 px-5 py-2 text-xs text-[var(--studio-ink-soft)] sm:px-8 lg:px-10">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--studio-signal)]" />
          Premium briefs, verified payment guidance, and project history aligned with HenryCo account
        </div>
        <div className="hidden items-center gap-5 lg:flex">
          <div>{supportEmail || studio.supportEmail}</div>
          <Link href={accountHref} className="font-semibold text-[var(--studio-ink)]">
            HenryCo account
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <PublicHeader
      prepend={prepend}
      headerClassName="border-b border-[var(--studio-line)] bg-[color-mix(in_srgb,var(--studio-bg)_82%,transparent)]/90 backdrop-blur-2xl dark:border-[var(--studio-line)]"
      maxWidth="max-w-[92rem]"
      toolbarClassName="px-5 py-4 sm:px-8 lg:px-10"
      mobileMenuContainerClassName="px-5 sm:px-8 lg:px-10"
      mobileDrawerClassName="border-[var(--studio-line)]"
      menuButtonClassName="rounded-full border border-[var(--studio-line)] text-[var(--studio-ink)]"
      brand={{
        href: "/",
        name: studio.name,
        mark: (
          <div
            className="studio-brand-mark"
            style={{ color: studio.accent || "#49C0C5" }}
          >
            <HenryCoMonogram size={28} accent={studio.accent || "#49C0C5"} />
          </div>
        ),
        /** Brand text shrinks at the `lg` breakpoint so the 8-item nav
         * clears the brand column without overlap. CHROME-01A audit
         * confirmed the U-10 fix left a residual collision because the
         * brand cluster (kicker + name) occupied the same row as the
         * navigation items. The kicker is hidden between lg and xl
         * (where space is tightest) and reinstated at xl. */
        text: (
          <div className="min-w-0">
            <div className="studio-kicker truncate lg:hidden xl:block">{studio.shortName}</div>
            <div className="truncate text-[13px] font-semibold text-[var(--studio-ink)] lg:text-[12.5px] xl:text-sm">
              {studio.name}
            </div>
          </div>
        ),
      }}
      afterBrand={
        <div className="hidden rounded-full border border-[var(--studio-line)] bg-black/10 px-3 py-2 text-xs text-[var(--studio-ink-soft)] 2xl:flex">
          Premium digital product delivery
        </div>
      }
      items={studioNav.primaryNav}
      actions={
        <HenryCoSearchBreadcrumb
          href={getHubUrl("/search")}
          className="hidden xl:inline-flex border-[var(--studio-line)] bg-black/10 text-[var(--studio-ink)] hover:bg-black/20 dark:border-[var(--studio-line)] dark:bg-black/10"
        />
      }
      getNavItemClassName={getNavItemClassName}
      navClassName="hidden shrink min-w-0 items-center gap-1 lg:flex"
      auxLink={studioNav.defaultCtas?.aux}
      primaryCta={studioNav.defaultCtas?.primary}
      auxLinkClassName="border-[var(--studio-line)] px-4 py-3 text-sm font-semibold text-[var(--studio-ink-soft)] shadow-none hover:bg-transparent dark:border-[var(--studio-line)] dark:hover:bg-transparent"
      auxLinkDesktopClassName="hidden xl:inline-flex"
      primaryCtaClassName="border-0 bg-[linear-gradient(135deg,#cfe9ef_0%,#83ebe8_46%,#46aab4_100%)] px-5 py-3 text-sm font-semibold text-[#041117] shadow-[0_18px_50px_rgba(74,193,197,0.25)] hover:opacity-95 dark:border-0 dark:text-[#041117]"
      primaryCtaDesktopClassName="hidden sm:inline-flex"
      accountMenu={accountMenu}
      accountMenuFirst
      themeToggle={<StudioThemeToggle />}
      renderMobileSheetAfterNav={(close) => (
        <Link
          href={accountHref}
          onClick={() => close()}
          className="rounded-[1.2rem] border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm font-medium text-[var(--studio-ink)]"
        >
          HenryCo account
        </Link>
      )}
    />
  );
}
