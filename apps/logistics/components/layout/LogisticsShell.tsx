"use client";

import { getDivisionConfig, getHubUrl } from "@henryco/config";
import {
  HenryCoSearchBreadcrumb,
  PublicHeader,
  getSiteNavigationConfig,
} from "@henryco/ui/public-shell";
import type { ReactNode } from "react";

export default function LogisticsShell({
  children,
  kicker,
  accountSlot,
}: {
  children: ReactNode;
  kicker?: string;
  accountSlot?: ReactNode;
}) {
  const logistics = getDivisionConfig("logistics");
  const navCfg = getSiteNavigationConfig("logistics");

  return (
    <div className="min-h-screen pb-16">
      <PublicHeader
        brand={{
          href: "/",
          name: "",
          text: (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
                {kicker || logistics.shortName}
              </div>
              <div className="text-base font-semibold tracking-tight text-white">{logistics.name}</div>
              <div className="hidden text-xs text-[var(--logistics-muted)] sm:inline">{logistics.sub}</div>
            </div>
          ),
        }}
        items={navCfg.primaryNav}
        actions={
          <HenryCoSearchBreadcrumb
            href={getHubUrl("/search")}
            className="hidden xl:inline-flex border-[var(--logistics-line)] bg-white/[0.04] text-white hover:bg-white/[0.08] dark:border-[var(--logistics-line)] dark:bg-white/[0.04]"
          />
        }
        accountMenu={accountSlot}
        showThemeToggle={false}
        headerClassName="z-40 border-b border-[var(--logistics-line)] bg-[#09060a]/85 text-white backdrop-blur-xl"
        maxWidth="max-w-7xl"
        toolbarClassName="px-4 py-3 sm:px-6 lg:px-8"
        mobileMenuContainerClassName="px-4 py-3 sm:px-6 lg:px-8"
        mobileDrawerClassName="border-[var(--logistics-line)] bg-[#09060a]/95"
        menuButtonClassName="border-[var(--logistics-line)] bg-white/[0.04] text-white"
        getNavItemClassName={(_item, active, placement) =>
          placement === "bar"
            ? [
                "text-sm font-medium transition",
                active
                  ? "text-white"
                  : "text-[var(--logistics-muted)] hover:border-[var(--logistics-line)] hover:bg-white/[0.04] hover:text-white",
              ]
                .filter(Boolean)
                .join(" ")
            : "rounded-xl border border-[var(--logistics-line)] bg-white/[0.04] px-4 py-3 text-sm text-white"
        }
        navClassName="hidden shrink-0 flex-wrap items-center justify-end gap-1 sm:gap-2 lg:flex"
      />
      {children}
      <footer className="mt-12 border-t border-[var(--logistics-line)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-white">{logistics.name}</div>
            <p className="mt-1 max-w-md text-sm text-[var(--logistics-muted)]">{logistics.tagline}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-[var(--logistics-muted)]">
            <a href={`mailto:${logistics.supportEmail}`} className="hover:text-white">
              {logistics.supportEmail}
            </a>
            <span className="text-white/20">|</span>
            <a href={`tel:${logistics.supportPhone}`} className="hover:text-white">
              {logistics.supportPhone}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
