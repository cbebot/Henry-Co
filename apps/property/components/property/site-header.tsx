"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { ThemeToggle } from "@henryco/ui";
import { getDivisionConfig } from "@henryco/config";

const property = getDivisionConfig("property");

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function PropertySiteHeader({ accountSlot }: { accountSlot: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--property-line)] bg-[color:color-mix(in_srgb,var(--property-bg)_80%,transparent)]/90 backdrop-blur-2xl">
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

      <div className="mx-auto flex max-w-[92rem] items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="property-brand-mark">
              <span>HC</span>
            </div>
            <div>
              <div className="property-kicker">{property.shortName}</div>
              <div className="text-sm font-semibold text-[var(--property-ink)]">{property.name}</div>
            </div>
          </Link>
          <div className="hidden rounded-full border border-[var(--property-line)] bg-black/10 px-3 py-2 text-xs text-[var(--property-ink-soft)] xl:flex">
            Editorial listings for calmer decisions
          </div>
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {property.publicNav.map((item) => {
            const active =
              pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={joinClassNames(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  active ? "property-nav-link-active" : "property-nav-link-idle"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden h-11 min-w-11 items-center justify-center rounded-full border border-[var(--property-line)] bg-[rgba(255,255,255,0.03)] px-0 py-0 sm:inline-flex" />
          <div className="hidden sm:block">{accountSlot}</div>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--property-line)] text-[var(--property-ink)] lg:hidden"
            aria-label="Toggle navigation"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-[var(--property-line)] px-5 py-4 sm:px-8 lg:hidden">
          <div className="mb-3 flex flex-col items-stretch gap-2">{accountSlot}</div>
          <nav className="grid gap-2">
            {property.publicNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-[1.2rem] border border-[var(--property-line)] bg-black/10 px-4 py-3 text-sm font-medium text-[var(--property-ink)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
