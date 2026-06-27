"use client";

import { DivisionImage } from "@henryco/dashboard-shell/components";
import Link from "next/link";
import { getAccountUrl, getHubUrl } from "@henryco/config";
import { getSurfaceCopy, translateSurfaceLabel, getMarketplacePublicExtraCopy } from "@henryco/i18n";
import { useOptionalHenryCoLocale } from "@henryco/i18n/react";
import { ButtonPendingContent, HenryCoPublicAccountPresets, PublicAccountChip } from "@henryco/ui";
import { logoutEverywhere } from "@henryco/auth/client";
import { HenryCoMonogram } from "@henryco/ui/brand";
import { BottomSheet, type BottomSheetCloseReason } from "@henryco/ui/mobile";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import {
  Bell,
  Globe,
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
import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { useMarketplaceRuntime } from "@/components/marketplace/runtime-provider";
import { buildSharedAccountLoginUrl, buildSharedAccountSignupUrl } from "@/lib/marketplace/shared-account";
import { cn } from "@/lib/utils";
import { marketplaceToolbarNav } from "@henryco/ui/public-shell";

const navLinks = marketplaceToolbarNav;

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

function MobileSignOutRow({ onNavigate }: { onNavigate: () => void }) {
  const locale = useOptionalHenryCoLocale() ?? "en";
  const surfaceCopy = getSurfaceCopy(locale);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          if (busy) return;
          setError(null);
          setBusy(true);
          try {
            const supabase = getBrowserSupabase();
            const result = await logoutEverywhere({
              supabase,
              redirectTo: "/",
            });
            if (!result.ok && result.serverLogoutStatus && result.serverLogoutStatus >= 500) {
              throw new Error(`Marketplace logout failed with status ${result.serverLogoutStatus}`);
            }
            onNavigate();
          } catch (logoutError) {
            console.error(logoutError);
            setError(surfaceCopy.marketplaceHeader.signOutError);
            setBusy(false);
          }
        }}
        className="flex w-full items-center justify-center gap-2 rounded-[1.35rem] border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 disabled:cursor-wait disabled:opacity-60"
      >
        <ButtonPendingContent
          pending={busy}
          pendingLabel={surfaceCopy.publicAccount.signingOut}
          spinnerLabel={surfaceCopy.publicAccount.signOut}
          className="inline-flex"
          textClassName="inline-flex items-center gap-2 font-semibold"
        >
          <>
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            {surfaceCopy.publicAccount.signOut}
          </>
        </ButtonPendingContent>
      </button>
      {error ? <p className="text-center text-xs font-medium text-red-200">{error}</p> : null}
    </div>
  );
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
  const locale = useOptionalHenryCoLocale() ?? "en";
  const extraCopy = getMarketplacePublicExtraCopy(locale);
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(avatarUrl) && !failed;
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.08)] text-xs font-semibold uppercase tracking-[0.22em] text-[var(--market-paper-white)]",
        className
      )}
    >
      {showImage && avatarUrl ? (
        <DivisionImage
          src={avatarUrl}
          alt={extraCopy.header.avatarAlt(label)}
          fill
          className="object-cover"
          sizes="48px"
          unoptimized
          onError={() => setFailed(true)}
          radius="0"
        />
      ) : (
        initials
      )}
    </span>
  );
}

export function PublicHeaderClient() {
  const locale = useOptionalHenryCoLocale() ?? "en";
  const surfaceCopy = getSurfaceCopy(locale);
  const extraCopy = getMarketplacePublicExtraCopy(locale);
  const runtime = useMarketplaceRuntime();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPath = useMemo(() => {
    const query = searchParams.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);
  const [mobileOpenPath, setMobileOpenPath] = useState<string | null>(null);
  const mobileOpen = mobileOpenPath === currentPath;

  const loginHref = useMemo(
    () =>
      buildSharedAccountLoginUrl(
        currentPath,
        typeof window !== "undefined" ? window.location.origin : undefined
      ),
    [currentPath]
  );

  const signupHref = useMemo(
    () =>
      buildSharedAccountSignupUrl(
        currentPath,
        typeof window !== "undefined" ? window.location.origin : undefined
      ),
    [currentPath]
  );

  const notificationsHref = useMemo(
    () =>
      runtime.shell.viewer.signedIn
        ? getAccountUrl("/notifications")
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
    : surfaceCopy.marketplaceHeader.guestLabel;
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

  const chipUser = runtime.shell.viewer.signedIn
    ? {
        displayName: accountLabel,
        email: runtime.shell.viewer.email,
        avatarUrl: runtime.shell.viewer.avatarUrl,
      }
    : null;

  // Stable ids for the trigger ↔ sheet relationship. Using `useId()`
  // (SSR-safe) so the same id is on the trigger's `aria-controls` and
  // the sheet's `id`.
  const drawerIdBase = useId();
  const drawerId = `marketplace-public-mobile-nav-${drawerIdBase}`;
  const drawerTitleId = `${drawerId}-title`;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // The legacy Escape-listener / `body.overflow = "hidden"` effect
  // that used to live here was the FIX-CHROME-01 root cause: setting
  // `body.style.overflow = "hidden"` detaches every sticky descendant
  // from the viewport because the body stops being the scrolling
  // container. The sticky `<header>` (and the drawer nested inside it)
  // collapse back to their document-flow position, rendered at the
  // top of the page far above the user's current scroll — only the
  // `fixed inset-0` backdrop stayed visible, matching the owner's
  // iPhone screenshot. The `BottomSheet` primitive below owns Esc,
  // backdrop tap, Android back, focus trap, and iOS-Safari-safe
  // body scroll lock (via `position: fixed; top: -<scrollY>px` +
  // `window.scrollTo` restore), so this entire effect is gone.
  const closeDrawer = useCallback(() => setMobileOpenPath(null), [setMobileOpenPath]);
  const handleSheetClose = useCallback(
    (_reason: BottomSheetCloseReason) => setMobileOpenPath(null),
    [setMobileOpenPath],
  );

  return (
    <header
      data-marketplace-interactive="true"
      className="sticky top-0 z-50 px-3 pt-3 sm:px-6 xl:px-8"
    >
      {/* FIX-CHROME-01: the inline `fixed inset-0` backdrop is gone.
       * The drawer below is now a `BottomSheet` portal-mounted at
       * `document.body`, so it renders its own backdrop outside any
       * sticky/transform ancestor and cannot orphan when the page is
       * scrolled. */}
      <div className="market-panel relative z-50 mx-auto max-w-[1480px] overflow-visible rounded-[2rem]">
        <div className="flex items-center gap-3 border-b border-[var(--market-line)] px-4 py-3 sm:px-5">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#04070d] rounded-2xl"
            aria-label={extraCopy.header.homeAriaLabel}
          >
            <span
              className="inline-flex h-12 w-12 items-center justify-center rounded-[1.45rem] border border-[var(--market-line-strong)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] text-[var(--market-paper-white)] shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
              style={{ color: "#F6E7C7" }}
            >
              <HenryCoMonogram size={32} accent="#B2863B" />
            </span>
            <div className="hidden min-w-0 sm:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--market-brass)]">
                HenryCo Marketplace
              </p>
              <p className="truncate text-sm text-[var(--market-muted)]">
                {surfaceCopy.marketplaceHeader.brandSubtitle}
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)] lg:inline-flex">
            <Sparkles className="h-3.5 w-3.5 text-[var(--market-brass)]" />
            {surfaceCopy.marketplaceHeader.liveCatalog}
          </div>

          <Link
            href={getHubUrl("/search")}
            className="hidden items-center gap-2 rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm font-semibold text-[var(--market-paper-white)] xl:inline-flex"
          >
            {extraCopy.header.searchHenryCo}
          </Link>

          <form
            action="/search"
            method="GET"
            className="hidden flex-1 items-center gap-3 rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-3 shadow-[0_18px_44px_rgba(0,0,0,0.18)] lg:flex"
          >
            <Search className="h-4 w-4 text-[var(--market-muted)]" />
            <input
              name="q"
              placeholder={surfaceCopy.marketplaceHeader.longSearchPlaceholder}
              className="w-full bg-transparent text-sm text-[var(--market-paper-white)] outline-none placeholder:text-[rgba(213,224,245,0.42)]"
            />
            <button className="market-button-primary rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]">
              {translateSurfaceLabel(locale, "Search")}
            </button>
          </form>

          <div className="ml-auto flex items-center gap-2">
            {/* Guests see no bell — there is nothing to notify them about until
             * they sign in. CHROME-01A audit caught a "99" badge rendering on
             * an unauthenticated marketplace homepage. */}
            {runtime.shell.viewer.signedIn ? (
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
            ) : null}

            <button
              type="button"
              onClick={runtime.openCart}
              aria-label={
                runtime.shell.cart.count
                  ? `${translateSurfaceLabel(locale, "Cart")} (${runtime.shell.cart.count})`
                  : translateSurfaceLabel(locale, "Cart")
              }
              className="relative inline-flex h-11 items-center gap-2 rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.05)] px-4 text-sm font-semibold text-[var(--market-paper-white)]"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">{translateSurfaceLabel(locale, "Cart")}</span>
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
                {translateSurfaceLabel(locale, "Vendor")}
              </Link>
            ) : null}

            <div className="hidden sm:block">
              <PublicAccountChip
                {...HenryCoPublicAccountPresets.onDarkMarketing}
                user={chipUser}
                loginHref={loginHref}
                accountHref={getAccountUrl("/")}
                signupHref={signupHref}
                signupLabel={translateSurfaceLabel(locale, "Get started")}
                preferencesHref={getAccountUrl("/settings")}
                settingsHref={getAccountUrl("/security")}
                showSignOut
                signOutApiPath="/api/auth/logout"
                signOutRedirectHref="/"
                onSignOut={async () => {
                  const supabase = getBrowserSupabase();
                  await logoutEverywhere({
                    supabase,
                    redirectTo: "/",
                  });
                }}
                buttonClassName="h-11 min-w-[10.5rem] rounded-full"
                menuItems={
                  chipUser
                    ? [
                        {
                          label: translateSurfaceLabel(locale, "Saved items"),
                          href: "/account/wishlist",
                          icon: <Heart className="h-4 w-4 text-[var(--market-brass)]" aria-hidden />,
                        },
                        {
                          label: translateSurfaceLabel(locale, "Cart"),
                          onClick: () => runtime.openCart(),
                          icon: <ShoppingBag className="h-4 w-4 text-[var(--market-brass)]" aria-hidden />,
                          badge: runtime.shell.cart.count ? (
                            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--market-brass)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--market-noir)]">
                              {runtime.shell.cart.count}
                            </span>
                          ) : null,
                        },
                        {
                          label: translateSurfaceLabel(locale, "Orders"),
                          href: "/account/orders",
                          icon: <Package className="h-4 w-4 text-zinc-500" aria-hidden />,
                        },
                      ]
                    : []
                }
              />
            </div>

            {runtime.shell.viewer.signedIn ? (
              <Link
                href={getAccountUrl("/")}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.08)] sm:hidden"
                aria-label={`${surfaceCopy.publicAccount.openAccountFor.replace("{name}", accountIdentity)}`}
              >
                <AccountAvatar
                  avatarUrl={runtime.shell.viewer.avatarUrl}
                  initials={accountInitials}
                  label={accountIdentity}
                  className="h-8 w-8 text-[11px]"
                />
              </Link>
            ) : (
              <div className="flex items-center gap-1.5 sm:hidden">
                <Link
                  href={loginHref}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.05)] px-3 text-xs font-semibold text-[var(--market-paper-white)]"
                  aria-label={surfaceCopy.publicAccount.signInAria}
                >
                  {translateSurfaceLabel(locale, "Sign in")}
                </Link>
                <Link
                  href={signupHref}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--market-brass)] px-3 text-xs font-bold text-[var(--market-noir)]"
                  aria-label={surfaceCopy.publicAccount.signUpAria}
                >
                  {translateSurfaceLabel(locale, "Join")}
                </Link>
              </div>
            )}

            <button
              ref={triggerRef}
              type="button"
              onClick={() => setMobileOpenPath((openPath) => (openPath === currentPath ? null : currentPath))}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] text-[var(--market-paper-white)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--market-noir)] lg:hidden"
              aria-haspopup="dialog"
              aria-expanded={mobileOpen}
              aria-controls={drawerId}
              aria-label={mobileOpen ? translateSurfaceLabel(locale, "Close navigation") : translateSurfaceLabel(locale, "Open navigation")}
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
            {surfaceCopy.marketplaceHeader.searchSummary}
          </p>
        </div>

      </div>
      {/* Portal-rendered BottomSheet drawer — replaces the inline
       * `max-height` collapse + body.overflow=hidden pattern. Anchored
       * at `document.body`, so it always renders at the bottom of the
       * viewport regardless of how deep the user has scrolled. The
       * primitive owns Esc, Android back, swipe-down, backdrop tap,
       * focus trap, and iOS-Safari-safe body scroll lock. Content
       * inside is preserved verbatim from the legacy drawer:
       * mobile-search → primary nav → account links (signed-in)
       * OR sign-in / sign-up CTAs (guest). */}
      <BottomSheet
        open={mobileOpen}
        onClose={handleSheetClose}
        id={drawerId}
        labelledBy={drawerTitleId}
        surface="marketplace.public_header_drawer"
        triggerRef={triggerRef}
        initialFocusRef={closeRef}
      >
        <header className="flex items-start justify-between gap-3 border-b border-[var(--market-line)] px-5 pb-4 pt-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-brass)]">
              {surfaceCopy.marketplaceHeader.brandSubtitle}
            </p>
            <p
              id={drawerTitleId}
              className="mt-1 line-clamp-2 text-base font-semibold tracking-tight text-[var(--market-paper-white)]"
            >
              {translateSurfaceLabel(locale, "Open navigation")}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={closeDrawer}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--market-line)] text-[var(--market-muted)] transition hover:text-[var(--market-paper-white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]"
            aria-label={translateSurfaceLabel(locale, "Close navigation")}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div
          className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5"
          style={{ WebkitOverflowScrolling: "touch" } as CSSProperties}
        >
          <form
            action="/search"
            method="GET"
            className="flex items-center gap-3 rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-3"
          >
            <Search className="h-4 w-4 text-[var(--market-muted)]" />
            <input
              name="q"
              placeholder={surfaceCopy.marketplaceHeader.shortSearchPlaceholder}
              className="w-full bg-transparent text-sm text-[var(--market-paper-white)] outline-none placeholder:text-[rgba(213,224,245,0.42)]"
            />
          </form>

          <nav className="grid gap-3">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeDrawer}
                className="rounded-[1.35rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm font-semibold text-[var(--market-paper-white)]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={getHubUrl("/search")}
              onClick={closeDrawer}
              className="rounded-[1.35rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm font-semibold text-[var(--market-paper-white)]"
            >
              {extraCopy.header.searchHenryCo}
            </Link>
            {runtime.shell.viewer.signedIn ? (
              <>
                <Link
                  href={getAccountUrl("/")}
                  onClick={closeDrawer}
                  className="flex items-center gap-2 rounded-[1.35rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.08)] px-4 py-3 text-sm font-semibold text-[var(--market-paper-white)]"
                >
                  <UserRound className="h-4 w-4 text-[var(--market-brass)]" aria-hidden />
                  {translateSurfaceLabel(locale, "Profile & account")}
                </Link>
                <Link
                  href="/account/wishlist"
                  onClick={closeDrawer}
                  className="flex items-center gap-2 rounded-[1.35rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm font-semibold text-[var(--market-paper-white)]"
                >
                  <Heart className="h-4 w-4 text-[var(--market-brass)]" aria-hidden />
                  {translateSurfaceLabel(locale, "Saved items")}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    runtime.openCart();
                    closeDrawer();
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-[1.35rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-left text-sm font-semibold text-[var(--market-paper-white)]"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-[var(--market-brass)]" aria-hidden />
                    {translateSurfaceLabel(locale, "Cart")}
                  </span>
                  {runtime.shell.cart.count ? (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--market-brass)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--market-noir)]">
                      {runtime.shell.cart.count}
                    </span>
                  ) : null}
                </button>
                <Link
                  href="/account/orders"
                  onClick={closeDrawer}
                  className="flex items-center gap-2 rounded-[1.35rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm font-semibold text-[var(--market-paper-white)]"
                >
                  <Package className="h-4 w-4 text-[var(--market-brass)]" aria-hidden />
                  {translateSurfaceLabel(locale, "Orders")}
                </Link>
                <a
                  href={getAccountUrl("/settings")}
                  target="_blank"
                  rel="noreferrer"
                  onClick={closeDrawer}
                  className="flex items-center gap-2 rounded-[1.35rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm font-semibold text-[var(--market-paper-white)]"
                >
                  <Globe className="h-4 w-4 text-zinc-400" aria-hidden />
                  {translateSurfaceLabel(locale, "Language & preferences")}
                </a>
                <a
                  href={getAccountUrl("/security")}
                  target="_blank"
                  rel="noreferrer"
                  onClick={closeDrawer}
                  className="flex items-center gap-2 rounded-[1.35rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm font-semibold text-[var(--market-paper-white)]"
                >
                  <Settings2 className="h-4 w-4 text-zinc-400" aria-hidden />
                  {translateSurfaceLabel(locale, "Settings")}
                </a>
                <MobileSignOutRow onNavigate={closeDrawer} />
              </>
            ) : (
              <>
                <Link
                  href={loginHref}
                  onClick={closeDrawer}
                  className="rounded-[1.35rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm font-semibold text-[var(--market-paper-white)]"
                >
                  {translateSurfaceLabel(locale, "Sign in")}
                </Link>
                <Link
                  href={signupHref}
                  onClick={closeDrawer}
                  className="rounded-[1.35rem] border border-[var(--market-brass)] bg-[var(--market-brass)] px-4 py-3 text-sm font-bold text-[var(--market-noir)]"
                >
                  {translateSurfaceLabel(locale, "Get started")}
                </Link>
              </>
            )}
          </nav>
        </div>
      </BottomSheet>
    </header>
  );
}
