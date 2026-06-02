"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { getDivisionConfig, getHubUrl } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
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
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const getNavItemClassName = (
    _item: PublicNavItem,
    active: boolean,
    placement: "bar" | "sheet"
  ) => {
    if (placement === "bar") {
      return joinClassNames(
        "rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-[color:var(--home-accent-soft)] text-[color:var(--home-ink)]"
          : "text-[color:var(--home-ink-65)] hover:text-[color:var(--home-ink)]"
      );
    }
    return "rounded-[1.2rem] border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] px-4 py-3 text-sm font-medium text-[color:var(--home-ink)]";
  };

  const prepend = (
    <div className="border-b border-[color:var(--home-line-08)]">
      <div className="mx-auto flex max-w-[92rem] flex-wrap items-center justify-between gap-4 px-5 py-2 text-xs text-[color:var(--home-ink-60)] sm:px-8 lg:px-10">
        <div className="flex items-center gap-2">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[color:var(--home-accent)]" />
          {t("Premium briefs, verified payment guidance, and project history in your Henry Onyx account")}
        </div>
        <div className="hidden items-center gap-5 lg:flex">
          <div>{supportEmail || studio.supportEmail}</div>
          <Link
            href={accountHref}
            className="font-semibold text-[color:var(--home-ink)] transition-colors hover:text-[color:var(--home-accent-text)]"
          >
            {t("Henry Onyx account")}
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <PublicHeader
      prepend={prepend}
      headerClassName="border-b border-[color:var(--home-line)] bg-[color:var(--home-glass)] backdrop-blur-2xl"
      maxWidth="max-w-[92rem]"
      toolbarClassName="px-5 py-4 sm:px-8 lg:px-10"
      mobileMenuContainerClassName="px-5 sm:px-8 lg:px-10"
      mobileDrawerClassName="border-[color:var(--home-line)]"
      menuButtonClassName="rounded-full border border-[color:var(--home-line-15)] text-[color:var(--home-ink)]"
      brand={{
        href: "/",
        name: t(studio.name),
        mark: (
          <div className="studio-brand-mark" style={{ color: studio.accent }}>
            <HenryCoMonogram size={28} accent={studio.accent} />
          </div>
        ),
        /** Brand text shrinks at `lg` so the 8-item nav clears the brand column;
         * the kicker is hidden between lg and xl (tightest) and reinstated at xl. */
        text: (
          <div className="min-w-0">
            <div className="home-eyebrow truncate lg:hidden xl:block">{t(studio.shortName)}</div>
            <div
              className="truncate text-[13px] font-semibold text-[color:var(--home-ink)] lg:text-[12.5px] xl:text-sm"
              style={{ fontFamily: "var(--home-font-display)" }}
            >
              {t(studio.name)}
            </div>
          </div>
        ),
      }}
      afterBrand={
        <div className="hidden rounded-full border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] px-3 py-2 text-xs text-[color:var(--home-ink-60)] 2xl:flex">
          {t("Premium digital product delivery")}
        </div>
      }
      items={studioNav.primaryNav}
      actions={
        <HenryCoSearchBreadcrumb
          href={getHubUrl("/search")}
          className="hidden xl:inline-flex border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] text-[color:var(--home-ink)] hover:bg-[color:var(--home-surface-07)]"
        />
      }
      getNavItemClassName={getNavItemClassName}
      navClassName="hidden shrink min-w-0 items-center gap-1 lg:flex"
      auxLink={studioNav.defaultCtas?.aux}
      primaryCta={studioNav.defaultCtas?.primary}
      auxLinkClassName="border-[color:var(--home-line-12)] px-4 py-3 text-sm font-semibold text-[color:var(--home-ink-65)] shadow-none hover:bg-transparent hover:text-[color:var(--home-ink)]"
      auxLinkDesktopClassName="hidden xl:inline-flex"
      primaryCtaClassName="border-transparent! bg-[color:var(--home-accent)]! px-5 py-3 text-sm font-semibold text-[color:var(--home-accent-ink)]! shadow-none transition-colors hover:bg-[color:var(--home-accent-strong)]!"
      primaryCtaDesktopClassName="hidden sm:inline-flex"
      accountMenu={accountMenu}
      accountMenuFirst
      themeToggle={<StudioThemeToggle />}
      renderMobileSheetAfterNav={(close) => (
        <Link
          href={accountHref}
          onClick={() => close()}
          className="rounded-[1.2rem] border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] px-4 py-3 text-sm font-medium text-[color:var(--home-ink)]"
        >
          {t("Henry Onyx account")}
        </Link>
      )}
    />
  );
}
