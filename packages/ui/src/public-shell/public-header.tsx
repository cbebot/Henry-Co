"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { getSurfaceCopy, translateSurfaceLabel } from "@henryco/i18n";
import { useOptionalHenryCoLocale } from "@henryco/i18n/react";
import { BottomSheet, type BottomSheetCloseReason } from "../mobile/bottom-sheet";
import { suppressSentinelPop } from "../mobile/use-android-back-close";
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
  /**
   * Condense the sticky bar (slimmer padding + elevation) once the page scrolls
   * past the top, matching the homepage chrome. Enabled on every public surface
   * by default; pass `false` to keep a static bar.
   * @default true
   */
  condenseOnScroll?: boolean;
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
  showAccountInMobileSheetFooter = false,
  /** Most division shells use full-bleed themed headers; set `"floating"` for elevated rounded chrome. */
  variant = "default",
  groupIdentityActions = true,
  identityClusterClassName,
  condenseOnScroll = true,
}: PublicHeaderProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  // Scroll-condense: the sticky bar settles from roomy → slim once the page
  // leaves the very top, matching the homepage chrome. A passive scroll
  // listener keeps the shared header dependency-free (no animation library).
  // The height change is applied as inline `paddingBlock` (see toolbarRow) so it
  // wins deterministically over every division's `toolbarClassName` — our `cn`
  // is a plain class-join, not tailwind-merge, so a competing `py-*` utility
  // could not be relied on to win. The CSS transition is suppressed under
  // `prefers-reduced-motion` via `motion-reduce:transition-none`.
  useEffect(() => {
    if (!condenseOnScroll) {
      setScrolled(false);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [condenseOnScroll]);

  const handleSheetClose = useCallback((_reason: BottomSheetCloseReason) => {
    setOpen(false);
  }, []);

  const closeDrawer = useCallback(() => setOpen(false), []);
  // Internal (SPA) nav/CTA links defer the close one macrotask so Next's
  // router.push commits its history entry BEFORE the BottomSheet unmounts.
  // Otherwise the useAndroidBackClose cleanup's history.back() (fired on close)
  // races and reverts the navigation — the reported "tap dismisses but never
  // navigates" bug. The pathname effect above still closes on route change;
  // this deferred close also covers same-route taps. (External <a> keeps the
  // immediate close — full-page nav, no router.push race.)
  const closeDrawerAfterNav = useCallback(() => {
    // Tell the sheet's history sentinel that a navigation is consuming this
    // history entry, so its close-time back() is skipped and cannot cancel the
    // in-flight router.push (App Router commits the push later than a frame).
    suppressSentinelPop();
    setTimeout(() => setOpen(false), 0);
  }, []);

  // CHROME-64 amber retirement (2026-07-16): the header's brand marks (focus
  // rings, active underline, active sheet row, primary CTA) are accent-governed
  // — --hc-accent maps to each division's colour and flips per theme at the
  // token layer (no dark: twins needed); fallbacks reproduce brand gold. The
  // ring OFFSETS stay surface-coloured (they are canvas, not accent).
  const focusRingBar =
    "rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--hc-accent,#C9A227)_50%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0a0f14]";
  const defaultBarLink =
    `relative text-sm font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-white/70 dark:hover:text-white ${focusRingBar}`;
  const defaultBarLinkActive =
    "font-semibold text-zinc-950 after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-px after:rounded-full after:bg-gradient-to-r after:from-[color:color-mix(in_srgb,var(--hc-accent,#C9A227)_90%,transparent)] after:via-[color:color-mix(in_srgb,var(--hc-accent,#C9A227)_65%,transparent)] after:to-[color:color-mix(in_srgb,var(--hc-accent,#C9A227)_45%,transparent)] dark:text-white";
  const defaultSheetLink = HenryCoPublicSurfaceTokens.menuSheetLink;
  const defaultSheetLinkActive =
    "border-[color:color-mix(in_srgb,var(--hc-accent,#C9A227)_55%,transparent)] bg-[color:color-mix(in_srgb,var(--hc-accent,#C9A227)_12%,transparent)] font-semibold text-zinc-900 shadow-[0_12px_40px_color-mix(in_srgb,var(--hc-accent,#C9A227)_12%,transparent)] dark:text-white";

  const focusRingPill =
    "outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--hc-accent,#C9A227)_55%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0a0f14]";
  const defaultAuxClass =
    `rounded-full border border-black/8 bg-white/90 px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-white/12 dark:bg-zinc-950/55 dark:text-white/85 dark:hover:bg-zinc-900/75 ${focusRingPill}`;
  const defaultSecondaryClass =
    `rounded-full border border-black/12 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-white/12 dark:bg-zinc-900/80 dark:text-white/90 dark:hover:bg-zinc-800/90 ${focusRingPill}`;
  // Primary CTA: canonical accent fill + the AA-designed dark-on-accent ink
  // (the chip precedent) — replaces the off-palette amber-600/white pairing.
  const defaultPrimaryClass =
    `rounded-full border border-[color:color-mix(in_srgb,var(--hc-accent,#C9A227)_30%,transparent)] bg-[color:var(--hc-accent,#C9A227)] px-4 py-2.5 text-sm font-semibold text-[color:var(--hc-ink-on-accent,#1A1814)] shadow-sm transition hover:bg-[color:var(--hc-accent-strong,#A88718)] ${focusRingPill}`;

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
      style={scrolled ? { paddingBlock: floating ? "0.5rem" : "0.625rem" } : undefined}
      className={cn(
        "flex items-center justify-between gap-3 transition-[padding] duration-300 ease-out motion-reduce:transition-none",
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
          "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5",
          mobileMenuContainerClassName
        )}
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {mobileSheetBeforeNav}

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
                onClick={closeDrawer}
                className={sheetClass}
              >
                {localize(item.label)}
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeDrawerAfterNav}
                className={sheetClass}
                aria-current={active ? "page" : undefined}
              >
                {localize(item.label)}
              </Link>
            );
          })}
        </div>

        {mobileSheetAfterNav}
        {renderMobileSheetAfterNav ? renderMobileSheetAfterNav(closeDrawer) : null}

        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            {surfaceCopy.publicHeader.actions}
          </p>
          <div className="flex flex-col gap-2">
            {showAccountInMobileSheetFooter && accountMenu ? (
              <div className="flex justify-stretch px-0.5">{accountMenu}</div>
            ) : null}
            {auxLink ? (
              <Link href={auxLink.href} onClick={closeDrawerAfterNav} className={auxSheetClass}>
                {localize(auxLink.label)}
              </Link>
            ) : null}
            {secondaryCta ? (
              <Link href={secondaryCta.href} onClick={closeDrawerAfterNav} className={secondarySheetClass}>
                {localize(secondaryCta.label)}
              </Link>
            ) : null}
            {primaryCta ? (
              <Link href={primaryCta.href} onClick={closeDrawerAfterNav} className={primarySheetClass}>
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
      data-scrolled={scrolled ? "true" : undefined}
      className={cn(
        "sticky top-0 z-50 transition-shadow duration-300 ease-out motion-reduce:transition-none",
        floating
          ? "border-0 bg-transparent pt-2.5 pb-2 sm:pt-3 sm:pb-3"
          : "border-b border-black/10 bg-white/96 backdrop-blur-0 md:backdrop-blur-md supports-[backdrop-filter]:bg-white/93 dark:border-white/10 dark:bg-[#0a0f14] dark:backdrop-blur-0 md:dark:backdrop-blur-md supports-[backdrop-filter]:dark:bg-[#0a0f14]/95",
        !floating && scrolled && "shadow-[0_16px_40px_-28px_rgba(15,23,42,0.55)] dark:shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)]",
        headerClassName
      )}
    >
      {prepend ? <div className="relative z-[70]">{prepend}</div> : null}
      {/* Inline backdrop is gone — the BottomSheet primitive renders
       * its own backdrop inside a portal anchored at `document.body`,
       * so it cannot be clipped by a sticky/transformed ancestor. */}
      <div className={cn("relative z-[60] mx-auto w-full", maxWidth, floating && "px-3 sm:px-4")}>
        {floating ? (
          <div
            style={
              scrolled
                ? { boxShadow: "0 22px 60px -28px rgba(15,23,42,0.45), 0 8px 22px rgba(15,23,42,0.10)" }
                : undefined
            }
            className={cn(
              HenryCoPublicSurfaceTokens.floatingHeaderChrome,
              "transition-shadow duration-300 ease-out motion-reduce:transition-none"
            )}
          >
            {shellInner}
          </div>
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
