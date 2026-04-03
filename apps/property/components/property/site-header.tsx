"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Moon, SunMedium, X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { getDivisionConfig } from "@henryco/config";
import { getSharedAccountPropertyUrl } from "@/lib/property/links";

const property = getDivisionConfig("property");

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--property-line)] bg-[rgba(255,255,255,0.03)] text-[var(--property-ink)]"
      aria-label="Toggle theme"
    >
      {isDark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function PropertySiteHeader({
  signedIn,
  signedInLabel,
}: {
  signedIn: boolean;
  signedInLabel?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const accountHref = signedIn ? getSharedAccountPropertyUrl() : "/login";

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
                  active
                    ? "bg-[rgba(232,184,148,0.14)] text-[var(--property-ink)]"
                    : "text-[var(--property-ink-soft)] hover:text-[var(--property-ink)]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href={accountHref}
            className="property-button-primary hidden rounded-full px-5 py-3 text-sm font-semibold sm:inline-flex"
          >
            {signedIn ? signedInLabel || "Account" : "Sign in"}
          </Link>
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
            <Link
              href={accountHref}
              onClick={() => setOpen(false)}
              className="rounded-[1.2rem] bg-[linear-gradient(135deg,#fde8da_0%,#e9bb95_42%,#bb7542_100%)] px-4 py-3 text-sm font-semibold text-[#1c120d]"
            >
              {signedIn ? "Open account" : "Sign in"}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
