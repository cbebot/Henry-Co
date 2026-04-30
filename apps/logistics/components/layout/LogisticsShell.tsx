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
      <footer className="mt-16 border-t border-[var(--logistics-line)]">
        <div
          aria-hidden
          className="pointer-events-none mx-auto h-px max-w-7xl bg-gradient-to-r from-transparent via-[var(--logistics-accent-soft)]/40 to-transparent"
        />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
          <div className="space-y-5">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
                {logistics.shortName}
              </div>
              <div className="mt-2 text-base font-semibold tracking-[-0.01em] text-white">
                {logistics.name}
              </div>
            </div>
            <p className="max-w-md text-sm leading-7 text-[var(--logistics-muted)]">
              {logistics.tagline}
            </p>
            <div className="space-y-1.5 text-sm">
              <a
                href={`mailto:${logistics.supportEmail}`}
                className="block font-medium text-white transition hover:text-[var(--logistics-accent-soft)]"
              >
                {logistics.supportEmail}
              </a>
              <a
                href={`tel:${logistics.supportPhone}`}
                className="block text-[var(--logistics-muted)] transition hover:text-white"
              >
                {logistics.supportPhone}
              </a>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--logistics-muted)]">
              Service
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              {[
                { href: "/quote", label: "Get a quote" },
                { href: "/track", label: "Track a job" },
                { href: "/business", label: "For business" },
                { href: "/coverage", label: "Coverage" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-white/75 transition hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--logistics-muted)]">
              HenryCo
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <a
                href={getHubUrl("/")}
                className="text-white/75 transition hover:text-white"
              >
                HenryCo group
              </a>
              <a
                href={getHubUrl("/preferences")}
                className="text-white/75 transition hover:text-white"
              >
                Preferences
              </a>
              <a
                href={getHubUrl("/privacy")}
                className="text-white/75 transition hover:text-white"
              >
                Privacy
              </a>
              <a
                href={getHubUrl("/terms")}
                className="text-white/75 transition hover:text-white"
              >
                Terms
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--logistics-line)] px-4 py-5 text-xs text-[var(--logistics-muted)] sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} {logistics.name}. All rights reserved.</div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em]">
              <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--logistics-accent-soft)]" />
              Designed and built in-house by HenryCo Studio for the HenryCo ecosystem
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
