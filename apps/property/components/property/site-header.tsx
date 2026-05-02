"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { getDivisionConfig, getHubUrl } from "@henryco/config";
import {
  HenryCoSearchBreadcrumb,
  PublicHeader,
  getSiteNavigationConfig,
} from "@henryco/ui/public-shell";
import type { PublicNavItem } from "@henryco/ui/public-shell";
import { HenryCoMonogram } from "@henryco/ui/brand";

const property = getDivisionConfig("property");
const propertyNav = getSiteNavigationConfig("property");

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function PropertySiteHeader({ accountSlot }: { accountSlot: ReactNode }) {
  const items: readonly PublicNavItem[] = propertyNav.primaryNav;

  return (
    <PublicHeader
      headerClassName="border-[var(--property-line)] bg-[color:color-mix(in_srgb,var(--property-bg)_80%,transparent)]/90 backdrop-blur-2xl"
      maxWidth="max-w-[92rem]"
      toolbarClassName="px-5 sm:px-8 lg:px-10"
      mobileMenuContainerClassName="px-5 sm:px-8 lg:px-10"
      mobileDrawerClassName="border-[var(--property-line)]"
      navClassName="hidden shrink-0 items-center gap-1 lg:flex"
      prepend={
        <div className="border-b border-[rgba(232,184,148,0.08)]">
          <div className="mx-auto flex max-w-[92rem] items-center justify-between gap-4 px-5 py-2 text-xs text-[var(--property-ink-soft)] sm:px-8 lg:px-10">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--property-accent-strong)]" />
              Curated listings, guided viewings, and managed-property trust rails
            </div>
            <Link href="/managed" className="hidden font-semibold text-[var(--property-ink)] lg:inline-flex">
              Managed property
            </Link>
          </div>
        </div>
      }
      afterBrand={
        <div className="hidden rounded-full border border-[var(--property-line)] bg-black/10 px-3 py-2 text-xs text-[var(--property-ink-soft)] xl:flex">
          Editorial listings for calmer decisions
        </div>
      }
      brand={{
        href: "/",
        name: "",
        mark: (
          <div
            className="property-brand-mark"
            style={{ color: property.accent || "#B06C3E" }}
          >
            <HenryCoMonogram size={28} accent={property.accent || "#B06C3E"} />
          </div>
        ),
        text: (
          <>
            <div className="property-kicker">{property.shortName}</div>
            <div className="text-sm font-semibold text-[var(--property-ink)]">{property.name}</div>
          </>
        ),
      }}
      items={items}
      actions={
        <HenryCoSearchBreadcrumb
          href={getHubUrl("/search")}
          className="hidden xl:inline-flex border-[var(--property-line)] bg-[rgba(255,255,255,0.03)] text-[var(--property-ink)] hover:bg-[rgba(255,255,255,0.07)] dark:border-[var(--property-line)] dark:bg-[rgba(255,255,255,0.03)]"
        />
      }
      accountMenu={<div className="hidden sm:block">{accountSlot}</div>}
      themeToggleBeforeAccount
      themeToggleClassName="hidden h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-[var(--property-line)] bg-[rgba(255,255,255,0.03)] px-0 py-0 sm:inline-flex"
      mobileSheetBeforeNav={<div className="mb-1 flex flex-col items-stretch gap-2">{accountSlot}</div>}
      showAccountInMobileSheetFooter={false}
      getNavItemClassName={(_item, active, placement) => {
        if (placement === "bar") {
          return joinClassNames(
            "rounded-full px-4 py-2 text-sm font-medium transition",
            active ? "property-nav-link-active" : "property-nav-link-idle"
          );
        }
        return "rounded-[1.2rem] border border-[var(--property-line)] bg-black/10 px-4 py-3 text-sm font-medium text-[var(--property-ink)]";
      }}
      menuButtonClassName="rounded-full border border-[var(--property-line)] bg-transparent shadow-none text-[var(--property-ink)] dark:bg-transparent dark:shadow-none"
    />
  );
}
