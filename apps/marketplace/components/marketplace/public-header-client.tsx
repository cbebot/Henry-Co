"use client";

import Link from "next/link";
import { Bell, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { useMarketplaceRuntime } from "@/components/marketplace/runtime-provider";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/search", label: "Search" },
  { href: "/deals", label: "Deals" },
  { href: "/collections/founder-desk", label: "Collections" },
  { href: "/trust", label: "Trust" },
  { href: "/help", label: "Support" },
];

export function PublicHeaderClient() {
  const runtime = useMarketplaceRuntime();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--market-line-strong)] bg-[color:rgba(247,243,235,0.78)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1480px] items-center gap-4 px-4 py-4 sm:px-6 xl:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-[1.35rem] border border-[var(--market-line-strong)] bg-[var(--market-noir)] text-sm font-semibold tracking-[0.2em] text-[var(--market-paper-white)]">
            HC
          </span>
          <div className="hidden sm:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--market-brass)]">
              HenryCo Marketplace
            </p>
            <p className="text-sm text-[var(--market-muted)]">
              Premium multi-vendor commerce
            </p>
          </div>
        </Link>

        <form
          action="/search"
          method="GET"
          className="hidden flex-1 items-center gap-3 rounded-full border border-[var(--market-line-strong)] bg-[var(--market-paper-white)] px-4 py-3 shadow-[0_18px_48px_rgba(25,20,14,0.08)] lg:flex"
        >
          <Search className="h-4 w-4 text-[var(--market-muted)]" />
          <input
            name="q"
            placeholder="Search premium home, office, style, curated collections..."
            className="w-full bg-transparent text-sm text-[var(--market-ink)] outline-none placeholder:text-[color:rgba(34,29,24,0.45)]"
          />
          <button className="rounded-full bg-[var(--market-noir)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--market-paper-white)]">
            Search
          </button>
        </form>

        <nav className="hidden items-center gap-5 xl:flex">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[var(--market-muted)] transition hover:text-[var(--market-ink)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href={runtime.shell.viewer.signedIn ? "/account/notifications" : "/login?next=/account/notifications"}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--market-line)] bg-[var(--market-paper-white)] text-[var(--market-ink)]"
          >
            <Bell className="h-4 w-4" />
            {runtime.shell.unreadNotificationCount ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--market-alert)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {Math.min(runtime.shell.unreadNotificationCount, 99)}
              </span>
            ) : null}
          </Link>

          <button
            type="button"
            onClick={runtime.openCart}
            aria-label={
              runtime.shell.cart.count
                ? `Open cart with ${runtime.shell.cart.count} item${runtime.shell.cart.count === 1 ? "" : "s"}`
                : "Open cart"
            }
            className="relative inline-flex h-11 items-center gap-2 rounded-full border border-[var(--market-line)] bg-[var(--market-paper-white)] px-4 text-sm font-semibold text-[var(--market-ink)]"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {runtime.shell.cart.count ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--market-noir)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--market-paper-white)]">
                {runtime.shell.cart.count}
              </span>
            ) : null}
          </button>

          {runtime.shell.viewer.canOpenVendorWorkspace ? (
            <Link
              href="/vendor"
              className="hidden rounded-full border border-[var(--market-line)] bg-[var(--market-paper-white)] px-4 py-3 text-sm font-semibold text-[var(--market-ink)] lg:inline-flex"
            >
              Vendor
            </Link>
          ) : null}

          <Link
            href={runtime.shell.viewer.signedIn ? "/account" : "/login"}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--market-noir)] px-4 text-sm font-semibold text-[var(--market-paper-white)]"
          >
            <UserRound className="h-4 w-4" />
            <span className="hidden sm:inline">
              {runtime.shell.viewer.signedIn ? runtime.shell.viewer.firstName || "Account" : "Sign in"}
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--market-line)] bg-[var(--market-paper-white)] text-[var(--market-ink)] xl:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-[var(--market-line)] transition-[max-height,opacity] duration-300 xl:hidden",
          mobileOpen ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="mx-auto max-w-[1480px] space-y-5 px-4 py-5 sm:px-6">
          <form
            action="/search"
            method="GET"
            className="flex items-center gap-3 rounded-[1.5rem] border border-[var(--market-line-strong)] bg-[var(--market-paper-white)] px-4 py-3"
          >
            <Search className="h-4 w-4 text-[var(--market-muted)]" />
            <input
              name="q"
              placeholder="Search premium products"
              className="w-full bg-transparent text-sm text-[var(--market-ink)] outline-none placeholder:text-[color:rgba(34,29,24,0.45)]"
            />
          </form>

          <nav className="grid gap-3">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-[1.35rem] border border-[var(--market-line)] bg-[var(--market-paper-white)] px-4 py-3 text-sm font-semibold text-[var(--market-ink)]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/sell"
              onClick={() => setMobileOpen(false)}
              className="rounded-[1.35rem] border border-[var(--market-line)] bg-[var(--market-soft-olive)] px-4 py-3 text-sm font-semibold text-[var(--market-ink)]"
            >
              Sell on HenryCo
            </Link>
            {runtime.shell.viewer.canOpenVendorWorkspace ? (
              <Link
                href="/vendor"
                onClick={() => setMobileOpen(false)}
                className="rounded-[1.35rem] border border-[var(--market-line)] bg-[var(--market-paper-white)] px-4 py-3 text-sm font-semibold text-[var(--market-ink)]"
              >
                Vendor workspace
              </Link>
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  );
}
