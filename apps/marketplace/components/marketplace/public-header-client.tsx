"use client";

import Image from "next/image";
import Link from "next/link";
import { getAccountUrl } from "@henryco/config";
import {
  Bell,
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  Package,
  Search,
  Settings2,
  ShoppingBag,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMarketplaceRuntime } from "@/components/marketplace/runtime-provider";
import { buildSharedAccountLoginUrl } from "@/lib/marketplace/shared-account";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/search", label: "Search" },
  { href: "/deals", label: "Deals" },
  { href: "/collections/founder-desk", label: "Collections" },
  { href: "/trust", label: "Trust" },
  { href: "/sell", label: "Sell" },
  { href: "/help", label: "Support" },
];

function getViewerLabel(firstName: string | null, fullName: string | null, email: string | null) {
  return firstName || fullName || email?.split("@")[0] || "Account";
}

function getViewerInitials(fullName: string | null, email: string | null) {
  const source = fullName || email || "HenryCo";
  const parts = source
    .split(/[\s._-]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "HC";
  }

  return parts
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() || "")
    .join("");
}

function AccountAvatar({
  avatarUrl,
  initials,
  label,
  className,
}: {
  avatarUrl: string | null;
  initials: string;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.08)] text-xs font-semibold uppercase tracking-[0.22em] text-[var(--market-paper-white)]",
        className
      )}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt={`${label} avatar`} fill className="object-cover" sizes="48px" />
      ) : (
        initials
      )}
    </span>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onNavigate,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center justify-between gap-3 rounded-[1.1rem] px-3 py-3 text-sm font-medium text-[var(--market-paper-white)] transition hover:bg-[rgba(255,255,255,0.06)]"
    >
      <span className="flex items-center gap-3">
        <span className="text-[var(--market-brass)]">{icon}</span>
        <span>{label}</span>
      </span>
    </Link>
  );
}

export function PublicHeaderClient() {
  const runtime = useMarketplaceRuntime();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [interactive, setInteractive] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const currentPath = useMemo(() => {
    const query = searchParams.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);

  const authHref = useMemo(
    () =>
      runtime.shell.viewer.signedIn
        ? "/account"
        : buildSharedAccountLoginUrl(
            currentPath,
            typeof window !== "undefined" ? window.location.origin : undefined
          ),
    [currentPath, runtime.shell.viewer.signedIn]
  );

  const notificationsHref = useMemo(
    () =>
      runtime.shell.viewer.signedIn
        ? "/account/notifications"
        : buildSharedAccountLoginUrl(
            "/account/notifications",
            typeof window !== "undefined" ? window.location.origin : undefined
          ),
    [runtime.shell.viewer.signedIn]
  );

  const accountLabel = runtime.shell.viewer.signedIn
    ? getViewerLabel(
        runtime.shell.viewer.firstName,
        runtime.shell.viewer.fullName,
        runtime.shell.viewer.email
      )
    : "Join us";
  const accountIdentity =
    runtime.shell.viewer.fullName ||
    runtime.shell.viewer.email ||
    getViewerLabel(
      runtime.shell.viewer.firstName,
      runtime.shell.viewer.fullName,
      runtime.shell.viewer.email
    );
  const accountInitials = getViewerInitials(
    runtime.shell.viewer.fullName,
    runtime.shell.viewer.email
  );

  useEffect(() => {
    setInteractive(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setAccountMenuOpen(false);
  }, [currentPath]);

  useEffect(() => {
    if (!accountMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        accountMenuRef.current &&
        event.target instanceof Node &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [accountMenuOpen]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      window.location.assign("/");
    }
  }

  return (
    <header
      data-marketplace-interactive={interactive ? "true" : "false"}
      className="sticky top-0 z-40 px-3 pt-3 sm:px-6 xl:px-8"
    >
      <div className="market-panel mx-auto max-w-[1480px] overflow-visible rounded-[2rem]">
        <div className="flex items-center gap-3 border-b border-[var(--market-line)] px-4 py-3 sm:px-5">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[1.45rem] border border-[var(--market-line-strong)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] text-sm font-semibold tracking-[0.22em] text-[var(--market-paper-white)]">
              HC
            </span>
            <div className="hidden min-w-0 sm:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--market-brass)]">
                HenryCo Marketplace
              </p>
              <p className="truncate text-sm text-[var(--market-muted)]">
                Refined commerce with one connected HenryCo account
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)] lg:inline-flex">
            <Sparkles className="h-3.5 w-3.5 text-[var(--market-brass)]" />
            Live catalog
          </div>

          <form
            action="/search"
            method="GET"
            className="hidden flex-1 items-center gap-3 rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-3 shadow-[0_18px_44px_rgba(0,0,0,0.18)] lg:flex"
          >
            <Search className="h-4 w-4 text-[var(--market-muted)]" />
            <input
              name="q"
              placeholder="Search lighting, office, decor, verified stores, founder-ready edits..."
              className="w-full bg-transparent text-sm text-[var(--market-paper-white)] outline-none placeholder:text-[rgba(213,224,245,0.42)]"
            />
            <button className="market-button-primary rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]">
              Search
            </button>
          </form>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href={notificationsHref}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] text-[var(--market-paper-white)]"
            >
              <Bell className="h-4 w-4" />
              {runtime.shell.unreadNotificationCount ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--market-alert)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--market-noir)]">
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
              className="relative inline-flex h-11 items-center gap-2 rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.05)] px-4 text-sm font-semibold text-[var(--market-paper-white)]"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {runtime.shell.cart.count ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--market-brass)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--market-noir)]">
                  {runtime.shell.cart.count}
                </span>
              ) : null}
            </button>

            {runtime.shell.viewer.canOpenVendorWorkspace ? (
              <Link
                href="/vendor"
                className="hidden rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm font-semibold text-[var(--market-paper-white)] lg:inline-flex"
              >
                Vendor
              </Link>
            ) : null}

            {runtime.shell.viewer.signedIn ? (
              <div className="relative hidden sm:block" ref={accountMenuRef}>
                <button
                  type="button"
                  aria-label={accountMenuOpen ? "Close account menu" : "Open account menu"}
                  aria-expanded={accountMenuOpen}
                  aria-controls="marketplace-account-menu"
                  disabled={!interactive}
                  onClick={() => setAccountMenuOpen((current) => !current)}
                  className="inline-flex h-11 min-w-[10.5rem] items-center gap-2 rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.1)] px-3 text-sm font-semibold text-[var(--market-paper-white)] transition hover:bg-[rgba(255,255,255,0.14)] disabled:cursor-wait disabled:opacity-70"
                >
                  <AccountAvatar
                    avatarUrl={runtime.shell.viewer.avatarUrl}
                    initials={accountInitials}
                    label={accountIdentity}
                    className="h-8 w-8 text-[11px]"
                  />
                  <span className="max-w-[7rem] truncate">{accountLabel}</span>
                  <ChevronDown
                    className={cn("h-4 w-4 text-[var(--market-muted)] transition", accountMenuOpen && "rotate-180")}
                  />
                </button>

                {accountMenuOpen ? (
                  <div
                    id="marketplace-account-menu"
                    className="absolute right-0 top-full z-50 mt-3 w-[19rem] overflow-hidden rounded-[1.6rem] border border-[var(--market-line)] bg-[rgba(4,8,18,0.96)] shadow-[0_28px_70px_rgba(0,0,0,0.36)] backdrop-blur-2xl"
                  >
                    <div className="border-b border-[var(--market-line)] px-4 py-4">
                      <div className="flex items-center gap-3">
                        <AccountAvatar
                          avatarUrl={runtime.shell.viewer.avatarUrl}
                          initials={accountInitials}
                          label={accountIdentity}
                          className="h-12 w-12 text-sm"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-[var(--market-paper-white)]">
                            {accountIdentity}
                          </div>
                          {runtime.shell.viewer.email ? (
                            <div className="truncate text-xs text-[var(--market-muted)]">
                              {runtime.shell.viewer.email}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 p-2">
                      <MenuLink
                        href="/account"
                        icon={<UserRound className="h-4 w-4" />}
                        label="Profile & account"
                        onNavigate={() => setAccountMenuOpen(false)}
                      />
                      <MenuLink
                        href="/account/wishlist"
                        icon={<Heart className="h-4 w-4" />}
                        label="Saved items"
                        onNavigate={() => setAccountMenuOpen(false)}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          runtime.openCart();
                          setAccountMenuOpen(false);
                        }}
                        className="flex w-full items-center justify-between gap-3 rounded-[1.1rem] px-3 py-3 text-left text-sm font-medium text-[var(--market-paper-white)] transition hover:bg-[rgba(255,255,255,0.06)]"
                      >
                        <span className="flex items-center gap-3">
                          <span className="text-[var(--market-brass)]">
                            <ShoppingBag className="h-4 w-4" />
                          </span>
                          <span>Cart</span>
                        </span>
                        {runtime.shell.cart.count ? (
                          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--market-brass)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--market-noir)]">
                            {runtime.shell.cart.count}
                          </span>
                        ) : null}
                      </button>
                      <MenuLink
                        href="/account/orders"
                        icon={<Package className="h-4 w-4" />}
                        label="Orders"
                        onNavigate={() => setAccountMenuOpen(false)}
                      />
                      <MenuLink
                        href={getAccountUrl("/security")}
                        icon={<Settings2 className="h-4 w-4" />}
                        label="Settings"
                        onNavigate={() => setAccountMenuOpen(false)}
                      />
                    </div>

                    <div className="border-t border-[var(--market-line)] p-2">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="flex w-full items-center gap-3 rounded-[1.1rem] px-3 py-3 text-left text-sm font-medium text-[var(--market-paper-white)] transition hover:bg-[rgba(255,255,255,0.06)] disabled:cursor-wait disabled:opacity-70"
                      >
                        <span className="text-[var(--market-brass)]">
                          <LogOut className="h-4 w-4" />
                        </span>
                        <span>{signingOut ? "Signing out..." : "Sign out"}</span>
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                href={authHref}
                className="inline-flex h-11 min-w-[9.5rem] items-center justify-center gap-2 rounded-full bg-[var(--market-brass)] px-4 text-sm font-bold tracking-tight text-[var(--market-noir)] shadow-[0_10px_36px_rgba(201,162,39,0.42)] ring-2 ring-[rgba(255,255,255,0.22)] transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--market-paper-white)]"
              >
                <UserRound className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{accountLabel}</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] text-[var(--market-paper-white)] lg:hidden"
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="hidden items-center justify-between gap-5 px-5 py-3 lg:flex">
          <nav className="flex flex-wrap items-center gap-2">
            {navLinks.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-[rgba(255,255,255,0.08)] text-[var(--market-paper-white)]"
                      : "text-[var(--market-muted)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--market-paper-white)]"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <p className="text-sm text-[var(--market-muted)]">
            Search-first browsing, verified sellers, split-order clarity, and shared HenryCo account identity.
          </p>
        </div>

        <div
          className={cn(
            "overflow-hidden border-t border-[var(--market-line)] transition-[max-height,opacity] duration-300 lg:hidden",
            mobileOpen ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="space-y-5 px-4 py-5 sm:px-5">
            <form
              action="/search"
              method="GET"
              className="flex items-center gap-3 rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-3"
            >
              <Search className="h-4 w-4 text-[var(--market-muted)]" />
              <input
                name="q"
                placeholder="Search premium products"
                className="w-full bg-transparent text-sm text-[var(--market-paper-white)] outline-none placeholder:text-[rgba(213,224,245,0.42)]"
              />
            </form>

            <nav className="grid gap-3">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-[1.35rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm font-semibold text-[var(--market-paper-white)]"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href={
                  runtime.shell.viewer.signedIn
                    ? "/account"
                    : buildSharedAccountLoginUrl(
                        currentPath,
                        typeof window !== "undefined" ? window.location.origin : undefined
                      )
                }
                onClick={() => setMobileOpen(false)}
                className="rounded-[1.35rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.08)] px-4 py-3 text-sm font-semibold text-[var(--market-paper-white)]"
              >
                {runtime.shell.viewer.signedIn ? "Open account" : "Join HenryCo"}
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
