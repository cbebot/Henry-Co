"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { getSurfaceCopy, translateSurfaceLabel } from "@henryco/i18n";
import { useOptionalHenryCoLocale } from "@henryco/i18n/react";
import { BottomSheet, type BottomSheetCloseReason } from "../mobile/bottom-sheet";
import { cn } from "../lib/cn";
import { ThemeToggle } from "../public/theme-toggle";
import { HenryCoPublicSurfaceTokens } from "./surface-tokens";
import { SkipLink } from "../a11y/skip-link";

function isNavActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

export type PublicNavItem = {
  label: string;
  href: string;
  external?: boolean;
};

export type PublicHeaderBrand = {
  name: string;
  sub?: string;
  href?: string;
  mark?: ReactNode;
  text?: ReactNode;
};

export type PublicHeaderProps = {
  brand: PublicHeaderBrand;
  items: readonly PublicNavItem[];
  primaryCta?: PublicNavItem;
  secondaryCta?: PublicNavItem;
  auxLink?: PublicNavItem;
  accountMenu?: ReactNode;
  actions?: ReactNode;
  afterBrand?: ReactNode;
  accountMenuFirst?: boolean;
  headerClassName?: string;
  prepend?: ReactNode;
  showThemeToggle?: boolean;
  themeToggleBeforeAccount?: boolean;
  themeToggleClassName?: string;
  themeToggle?: ReactNode;
  maxWidth?: string;
  getNavItemClassName?: (
    item: PublicNavItem,
    active: boolean,
    placement: "bar" | "sheet"
  ) => string;
  navClassName?: string;
  toolbarClassName?: string;
  mobileMenuContainerClassName?: string;
  mobileDrawerClassName?: string;
  menuButtonClassName?: string;
  auxLinkClassName?: string;
  auxLinkDesktopClassName?: string;
  secondaryCtaClassName?: string;
  secondaryCtaDesktopClassName?: string;
  primaryCtaClassName?: string;
  primaryCtaDesktopClassName?: string;
  mobileSheetAfterNav?: ReactNode;
  renderMobileSheetAfterNav?: (close: () => void) => ReactNode;
  mobileSheetBeforeNav?: ReactNode;
  /**
   * Render the premium in-place profile card at the top of the mobile
   * drawer. The callback receives the same `dismiss` function the nav
   * links use (rAF-deferred close — see FIX-CHROME-02 RCA), so any
   * link / button inside the rendered card closes the drawer without
   * racing the App Router transition.
   *
   * When provided, this REPLACES the `mobileSheetBeforeNav` slot's
   * role for account content. Callers usually pass
   * `<DrawerAccountSection ... />` from `@henryco/ui/public`.
   *
   * Prefer this over `mobileDrawerProfile` whenever the caller is a
   * client component — the dismiss callback ensures even same-route
   * taps close the drawer cleanly.
   */
  renderMobileSheetProfile?: (dismiss: () => void) => ReactNode;
  /**
   * Net-new in FIX-CHROME-02. Element variant of `renderMobileSheet
   * Profile` for callers that live in Server Components (jobs, learn,
   * logistics, studio, hub) and can't pass a function across the
   * server/client boundary. The element is rendered as-is; taps that
   * navigate to a different route will still auto-close via the
   * pathname-change effect in PublicHeader.
   */
  mobileDrawerProfile?: ReactNode;
  showAccountInMobileSheetFooter?: boolean;
  /**
   * `floating` — premium rounded elevated bar (default for division marketing sites).
   * `default` — full-bleed sticky strip (e.g. hub noir / custom dark shells).
   */
  variant?: "default" | "floating";
  /**
   * Wrap theme toggle + account chip in one bordered capsule so the identity strip feels intentional.
   * @default true
   */
  groupIdentityActions?: boolean;
  /** Extra classes on the identity capsule (theme + account) */
  identityClusterClassName?: string;
};

export function PublicHeader({
  brand,
  items,
  primaryCta,
  secondaryCta,
  auxLink,
  accountMenu,
  actions,
  afterBrand,
  accountMenuFirst = false,
  headerClassName,
  prepend,
  showThemeToggle = true,
  themeToggleBeforeAccount = false,
  themeToggleClassName,
  themeToggle,
  maxWidth = "max-w-7xl",
  getNavItemClassName,
  navClassName = "hidden shrink-0 items-center gap-6 lg:flex",
  toolbarClassName,
  mobileMenuContainerClassName,
  mobileDrawerClassName,
  menuButtonClassName,
  auxLinkClassName,
  auxLinkDesktopClassName,
  secondaryCtaClassName,
  secondaryCtaDesktopClassName,
  primaryCtaClassName,
  primaryCtaDesktopClassName,
  mobileSheetAfterNav,
  renderMobileSheetAfterNav,
  mobileSheetBeforeNav,
  renderMobileSheetProfile,
  mobileDrawerProfile,
  showAccountInMobileSheetFooter = true,
  /** Most division shells use full-bleed themed headers; set `"floating"` for elevated rounded chrome. */
  variant = "default",
  groupIdentityActions = true,
  identityClusterClassName,
}: PublicHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const locale = useOptionalHenryCoLocale() ?? "en";
  const surfaceCopy = getSurfaceCopy(locale);
  const floating = variant === "floating";
  const localize = (label: string) => translateSurfaceLabel(locale, label);

  // Stable ids so the trigger's `aria-controls` and the sheet's `id`
  // line up across renders. `useId()` is SSR-safe so the markup matches
  // between server and client streams.
  const idBase = useId();
  const drawerId = `henryco-public-mobile-nav-${idBase}`;
  const drawerTitleId = `${drawerId}-title`;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // Route-change auto-close. The drawer holds anchor links/CTAs that
  // navigate within Next.js — when pathname flips, the sheet should
  // animate out via `open=false`. The BottomSheet primitive owns its
  // own scroll lock, focus trap, Esc handling, Android back, backdrop
  // tap and swipe-down dismiss, so the inline `body.overflow=hidden`
  // and Escape effect that used to live here are gone — replacing the
  // sticky-break root cause behind the FIX-CHROME-01 report.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleSheetClose = useCallback((_reason: BottomSheetCloseReason) => {
    setOpen(false);
  }, []);

  const closeDrawer = useCallback(() => setOpen(false), []);

  /**
   * Defer the sheet's close until AFTER Next.js's App Router has had a
   * chance to call `history.pushState` for the in-flight transition.
   *
   * Closing synchronously inside a Link's onClick (the pre-FIX-CHROME-02
   * behaviour) races with `BottomSheet`'s `useAndroidBackClose` cleanup:
   * the cleanup runs in the same React commit, sees the sentinel still
   * on top of `history.state` (because App Router transitions push
   * state via `useTransition`, not synchronously), and calls
   * `history.back()`. That `back()` cancels the pending route push
   * before it can commit — the user's tap appears dead.
   *
   * `requestAnimationFrame` schedules the close for the next paint.
   * By then the route has pushed its own history state, so the
   * sentinel is no longer the top entry and the cleanup correctly
   * skips its `history.back()` branch.
   *
   * Same-pathname taps (e.g. tapping "Home" while already on `/`)
   * still close because we don't depend on a `pathname` change.
   *
   * SSR fallback: just close synchronously — no router race in a
   * non-browser context, and Next.js never renders the drawer
   * mounted=true on the server anyway.
   */
  const dismissAfterNavigation = useCallback(() => {
    if (typeof window === "undefined" || !window.requestAnimationFrame) {
      setOpen(false);
      return;
    }
    window.requestAnimationFrame(() => setOpen(false));
  }, []);

  const focusRingBar =
    "rounded-md outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-amber-400/45 dark:focus-visible:ring-offset-[#0a0f14]";
  const defaultBarLink =
    `relative text-sm font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-white/70 dark:hover:text-white ${focusRingBar}`;
  const defaultBarLinkActive =
    "font-semibold text-zinc-950 after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-px after:rounded-full after:bg-gradient-to-r after:from-amber-500/90 after:via-amber-400/70 after:to-amber-600/50 dark:text-white dark:after:from-amber-400/90 dark:after:via-amber-300/60 dark:after:to-amber-500/40";
  const defaultSheetLink = HenryCoPublicSurfaceTokens.menuSheetLink;
  const defaultSheetLinkActive =
    "border-amber-400/55 bg-amber-50/95 font-semibold text-zinc-900 shadow-[0_12px_40px_rgba(245,158,11,0.12)] dark:border-amber-400/35 dark:bg-amber-950/35 dark:text-white";

  const focusRingPill =
    "outline-none focus-visible:ring-2 focus-visible:ring-amber-500/55 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-amber-400/50 dark:focus-visible:ring-offset-[#0a0f14]";
  const defaultAuxClass =
    `rounded-full border border-black/8 bg-white/90 px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-white/12 dark:bg-zinc-950/55 dark:text-white/85 dark:hover:bg-zinc-900/75 ${focusRingPill}`;
  const defaultSecondaryClass =
    `rounded-full border border-black/12 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-white/12 dark:bg-zinc-900/80 dark:text-white/90 dark:hover:bg-zinc-800/90 ${focusRingPill}`;
  const defaultPrimaryClass =
    `rounded-full border border-amber-600/20 bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 dark:border-amber-400/30 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 ${focusRingPill}`;

  const auxDesktopClass = cn(defaultAuxClass, auxLinkClassName, auxLinkDesktopClassName);
  const secondaryDesktopClass = cn(
    defaultSecondaryClass,
    secondaryCtaClassName,
    secondaryCtaDesktopClassName
  );
  const primaryDesktopClass = cn(
    defaultPrimaryClass,
    primaryCtaClassName,
    primaryCtaDesktopClassName
  );

  const defaultAuxSheet =
    `rounded-full border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-medium text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 ${focusRingPill}`;
  const defaultSecondarySheet =
    `rounded-full border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-semibold text-zinc-800 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 ${focusRingPill}`;
  const defaultPrimarySheet =
    `rounded-full bg-amber-600 px-4 py-3 text-center text-sm font-semibold text-white dark:bg-amber-500 dark:text-zinc-950 ${focusRingPill}`;

  const auxSheetClass = cn(defaultAuxSheet, auxLinkClassName);
  const secondarySheetClass = cn(defaultSecondarySheet, secondaryCtaClassName);
  const primarySheetClass = cn(defaultPrimarySheet, primaryCtaClassName);

  const themeToggleNode: ReactNode = showThemeToggle
    ? (themeToggle ?? (
        <ThemeToggle
          className={cn(
            "h-9 w-9 shrink-0 rounded-xl border-zinc-200/90 shadow-sm dark:border-zinc-700/90",
            themeToggleClassName
          )}
        />
      ))
    : null;

  function wrapIdentity(nodes: ReactNode) {
    if (!groupIdentityActions) return nodes;
    return (
      <div
        className={cn(
          HenryCoPublicSurfaceTokens.identityActionCluster,
          "[&_button]:shrink-0",
          identityClusterClassName
        )}
      >
        {nodes}
      </div>
    );
  }

  const desktopCtas = (
    <>
      {auxLink ? (
        <Link href={auxLink.href} className={auxDesktopClass}>
          {localize(auxLink.label)}
        </Link>
      ) : null}
      {secondaryCta ? (
        <Link href={secondaryCta.href} className={secondaryDesktopClass}>
          {localize(secondaryCta.label)}
        </Link>
      ) : null}
      {primaryCta ? (
        <Link href={primaryCta.href} className={primaryDesktopClass}>
          {localize(primaryCta.label)}
        </Link>
      ) : null}
    </>
  );

  const desktopIdentityOrdered = themeToggleBeforeAccount ? (
    <>
      {themeToggleNode}
      {accountMenu}
    </>
  ) : (
    <>
      {accountMenu}
      {themeToggleNode}
    </>
  );

  const desktopToolbarDefault = (
    <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
      {actions}
      {desktopCtas}
      {wrapIdentity(desktopIdentityOrdered)}
    </div>
  );

  const desktopToolbarAccountFirst = (
    <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
      {actions}
      {wrapIdentity(desktopIdentityOrdered)}
      {desktopCtas}
    </div>
  );

  const mobileIdentityOrdered = themeToggleBeforeAccount ? (
    <>
      {themeToggleNode}
      {accountMenu}
    </>
  ) : (
    <>
      {accountMenu}
      {themeToggleNode}
    </>
  );

  const toolbarRow = (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        floating ? "px-4 py-3 sm:px-5" : "px-6 py-4 sm:px-8 lg:px-10",
        toolbarClassName
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <Link
          href={brand.href || "/"}
          className={cn("flex min-w-0 items-center gap-3", focusRingBar)}
        >
          {brand.mark}
          {brand.text ? (
            <div className="min-w-0">{brand.text}</div>
          ) : (
            <div className="min-w-0">
              <div className="text-base font-black tracking-[0.02em] text-zinc-950 dark:text-white">
                {brand.name}
              </div>
              {brand.sub ? (
                <div className="truncate text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-white/45">
                  {brand.sub}
                </div>
              ) : null}
            </div>
          )}
        </Link>
        {afterBrand}
      </div>

      <nav className={navClassName}>
        {items.map((item) => {
          const active = !item.external && isNavActive(pathname, item.href);
          const barClass = getNavItemClassName
            ? getNavItemClassName(item, active, "bar")
            : cn(defaultBarLink, active && defaultBarLinkActive);

          return item.external ? (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className={barClass}
            >
              {localize(item.label)}
            </a>
          ) : (
            <Link key={item.label} href={item.href} className={barClass} aria-current={active ? "page" : undefined}>
              {localize(item.label)}
            </Link>
          );
        })}
      </nav>

      <div className="hidden min-w-0 shrink-0 lg:flex lg:max-w-[min(52%,520px)]">
        {accountMenuFirst ? desktopToolbarAccountFirst : desktopToolbarDefault}
      </div>

      <div className="flex min-w-0 shrink-0 items-center gap-2 lg:hidden">
        {actions}
        {wrapIdentity(mobileIdentityOrdered)}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200/90 bg-white text-zinc-950 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus-visible:ring-amber-400/45 dark:focus-visible:ring-offset-[#0a0f14]",
            floating && "h-10 w-10 rounded-xl",
            menuButtonClassName
          )}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={drawerId}
          aria-label={open ? surfaceCopy.publicHeader.closeMenu : surfaceCopy.publicHeader.openMenu}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );

  // Mobile drawer is rendered via the canonical `BottomSheet` primitive
  // from `@henryco/ui/mobile`. The sheet portal-mounts at
  // `document.body`, so it lives OUTSIDE the sticky header — the
  // owner-reported sticky-break bug (body.overflow=hidden detaching
  // sticky descendants from their viewport anchor) cannot recur
  // because we no longer touch `body.style.overflow` here. Body
  // scroll lock is owned by BottomSheet via the iOS-Safari-safe
  // `position: fixed; top: -<scrollY>px` pattern, with a
  // `window.scrollTo` restore on close.
  const mobileBottomSheet = (
    <BottomSheet
      open={open}
      onClose={handleSheetClose}
      id={drawerId}
      labelledBy={drawerTitleId}
      surface="henryco.public_header_drawer"
      triggerRef={triggerRef}
      initialFocusRef={closeRef}
    >
      <header className="flex items-start justify-between gap-3 border-b border-white/10 px-5 pb-4 pt-2 dark:border-white/10">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            {surfaceCopy.publicHeader.menu}
          </p>
          <p
            id={drawerTitleId}
            className="mt-1 line-clamp-2 text-base font-semibold tracking-tight text-white"
          >
            {brand.name}
          </p>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={closeDrawer}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/75 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/55"
          aria-label={surfaceCopy.publicHeader.closeMenu}
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-8 sm:px-5",
          mobileMenuContainerClassName
        )}
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {mobileSheetBeforeNav}

        {/*
         * Premium in-place profile section. When the caller passes
         * `renderMobileSheetProfile`, we render the returned card here
         * (above the nav). This replaces the chip-with-nested-dropdown
         * pattern that was awkward inside a BottomSheet — see
         * FIX-CHROME-02 RCA "PRIORITY 2 — Profile section premium polish".
         *
         * Server Components can't pass a function across the
         * server/client boundary — they use `mobileDrawerProfile`
         * (ReactNode) instead. Either prop produces the same visual.
         */}
        {renderMobileSheetProfile ? (
          <div className="mb-4">{renderMobileSheetProfile(dismissAfterNavigation)}</div>
        ) : mobileDrawerProfile ? (
          <div className="mb-4">{mobileDrawerProfile}</div>
        ) : null}

        {/* MENU kicker — brand-quiet uppercase eyebrow above the nav list. */}
        <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
          {surfaceCopy.publicHeader.menu}
        </p>

        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const active = !item.external && isNavActive(pathname, item.href);
            const sheetClass = getNavItemClassName
              ? getNavItemClassName(item, active, "sheet")
              : cn(defaultSheetLink, active && defaultSheetLinkActive);

            return item.external ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                onClick={dismissAfterNavigation}
                className={cn(sheetClass, "min-h-[48px] flex items-center")}
              >
                {localize(item.label)}
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                onClick={dismissAfterNavigation}
                className={cn(sheetClass, "min-h-[48px] flex items-center")}
                aria-current={active ? "page" : undefined}
              >
                {localize(item.label)}
              </Link>
            );
          })}
        </div>

        {mobileSheetAfterNav}
        {renderMobileSheetAfterNav ? renderMobileSheetAfterNav(dismissAfterNavigation) : null}

        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            {surfaceCopy.publicHeader.actions}
          </p>
          <div className="flex flex-col gap-2">
            {/* Suppress the legacy chip if we already rendered a premium profile card. */}
            {showAccountInMobileSheetFooter && accountMenu && !renderMobileSheetProfile && !mobileDrawerProfile ? (
              <div className="flex justify-stretch px-0.5">{accountMenu}</div>
            ) : null}
            {auxLink ? (
              <Link
                href={auxLink.href}
                onClick={dismissAfterNavigation}
                className={cn(auxSheetClass, "min-h-[48px] flex items-center justify-center")}
              >
                {localize(auxLink.label)}
              </Link>
            ) : null}
            {secondaryCta ? (
              <Link
                href={secondaryCta.href}
                onClick={dismissAfterNavigation}
                className={cn(secondarySheetClass, "min-h-[48px] flex items-center justify-center")}
              >
                {localize(secondaryCta.label)}
              </Link>
            ) : null}
            {primaryCta ? (
              <Link
                href={primaryCta.href}
                onClick={dismissAfterNavigation}
                className={cn(primarySheetClass, "min-h-[48px] flex items-center justify-center")}
              >
                {localize(primaryCta.label)}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </BottomSheet>
  );

  const shellInner = toolbarRow;

  return (
    <>
      {/* WCAG 2.4.1 — first focusable element on every public surface that
       * mounts PublicHeader. Targets `id="henryco-main"` on the page's main
       * landmark; per-app shells should mount `<main id="henryco-main"
       * tabIndex={-1}>` so this link lands focus correctly. */}
      <SkipLink href="#henryco-main" />
    <header
      className={cn(
        "sticky top-0 z-50",
        floating
          ? "border-0 bg-transparent pt-2.5 pb-2 sm:pt-3 sm:pb-3"
          : "border-b border-black/10 bg-white/96 backdrop-blur-0 md:backdrop-blur-md supports-[backdrop-filter]:bg-white/93 dark:border-white/10 dark:bg-[#0a0f14] dark:backdrop-blur-0 md:dark:backdrop-blur-md supports-[backdrop-filter]:dark:bg-[#0a0f14]/95",
        headerClassName
      )}
    >
      {prepend ? <div className="relative z-[70]">{prepend}</div> : null}
      {/* Inline backdrop is gone — the BottomSheet primitive renders
       * its own backdrop inside a portal anchored at `document.body`,
       * so it cannot be clipped by a sticky/transformed ancestor. */}
      <div className={cn("relative z-[60] mx-auto w-full", maxWidth, floating && "px-3 sm:px-4")}>
        {floating ? (
          <div className={HenryCoPublicSurfaceTokens.floatingHeaderChrome}>{shellInner}</div>
        ) : (
          shellInner
        )}
      </div>
    </header>
    {/* Portal-rendered mobile drawer. Rendered alongside the header
     * so the JSX tree mirrors the visual stacking, but the actual DOM
     * mount point is `document.body` via BottomSheet's `createPortal`.
     * That isolates it from any sticky/transform/overflow ancestor —
     * the canonical fix behind FIX-CHROME-01. */}
    {mobileBottomSheet}
    </>
  );
}
