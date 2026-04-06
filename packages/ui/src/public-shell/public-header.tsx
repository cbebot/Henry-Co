"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "../lib/cn";
import { ThemeToggle } from "../public/theme-toggle";
import { HenryCoPublicSurfaceTokens } from "./surface-tokens";

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
  /** Optional brand mark element (logo icon, SVG, etc.) */
  mark?: ReactNode;
  /** When set, replaces the default name + subtitle block (after `mark`, inside the brand link). */
  text?: ReactNode;
};

export type PublicHeaderProps = {
  brand: PublicHeaderBrand;
  items: readonly PublicNavItem[];
  primaryCta?: PublicNavItem;
  secondaryCta?: PublicNavItem;
  auxLink?: PublicNavItem;
  accountMenu?: ReactNode;
  /** Slot for search bar, cart button, or other actions between nav and account */
  actions?: ReactNode;
  /** Rendered after the brand link (e.g. tagline pill) before desktop nav */
  afterBrand?: ReactNode;
  /** When true, account menu and theme toggle render before CTAs on large screens */
  accountMenuFirst?: boolean;
  /** App-specific header styling tokens */
  headerClassName?: string;
  /** Rendered inside `<header>`, above the main toolbar row (e.g. division tagline strip). */
  prepend?: ReactNode;
  /** Show/hide the built-in theme toggle (default: true) */
  showThemeToggle?: boolean;
  /** When true, theme toggle renders before the account menu (toolbar + mobile row). */
  themeToggleBeforeAccount?: boolean;
  /** Passed to `ThemeToggle` when `showThemeToggle` is true. */
  themeToggleClassName?: string;
  /** Replaces the default theme toggle when `showThemeToggle` is true */
  themeToggle?: ReactNode;
  /** Override the nav container max-width */
  maxWidth?: string;
  /** Extra classes for the main toolbar row (padding, gaps, etc.). */
  toolbarClassName?: string;
  /** Classes for the mobile menu inner container (padding should match the toolbar row). */
  mobileMenuContainerClassName?: string;
  /** Classes for the collapsible mobile drawer wrapper (e.g. border color). */
  mobileDrawerClassName?: string;
  /** Extra classes on the mobile menu button */
  menuButtonClassName?: string;
  /** Merged into default classes for the aux link (desktop bar + mobile sheet) */
  auxLinkClassName?: string;
  /** Merged into the aux link on the desktop bar only (e.g. `hidden xl:inline-flex`). */
  auxLinkDesktopClassName?: string;
  secondaryCtaClassName?: string;
  secondaryCtaDesktopClassName?: string;
  primaryCtaClassName?: string;
  primaryCtaDesktopClassName?: string;
  /** Per-item classes for desktop nav (`bar`) and mobile sheet (`sheet`). When omitted, default shell styles apply. */
  getNavItemClassName?: (
    item: PublicNavItem,
    active: boolean,
    placement: "bar" | "sheet"
  ) => string;
  /** Desktop primary nav row (default: spaced links for shared shells). */
  navClassName?: string;
  /** Inserted after primary nav links in the mobile sheet (e.g. account shortcut). */
  mobileSheetAfterNav?: ReactNode;
  /** Like `mobileSheetAfterNav` but receives `close` to dismiss the sheet (e.g. before navigation). */
  renderMobileSheetAfterNav?: (close: () => void) => ReactNode;
  /** Inserted before primary nav links in the mobile sheet (e.g. account block). */
  mobileSheetBeforeNav?: ReactNode;
  /** When false, the account menu is not repeated in the mobile sheet footer row (default: true). */
  showAccountInMobileSheetFooter?: boolean;
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
  /** Top mobile toolbar already includes the account chip; duplicating it in the sheet feels cluttered. */
  showAccountInMobileSheetFooter = false,
}: PublicHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const defaultBarLink =
    "text-sm font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-white/70 dark:hover:text-white";
  const defaultSheetLink = HenryCoPublicSurfaceTokens.menuSheetLink;

  const defaultAuxClass =
    "rounded-full border border-black/8 bg-white/90 px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-white/12 dark:bg-zinc-950/55 dark:text-white/85 dark:hover:bg-zinc-900/75";
  const defaultSecondaryClass =
    "rounded-full border border-black/12 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-white/12 dark:bg-zinc-900/80 dark:text-white/90 dark:hover:bg-zinc-800/90";
  const defaultPrimaryClass =
    "rounded-full border border-amber-600/20 bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 dark:border-amber-400/30 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400";

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
    "rounded-full border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-medium text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200";
  const defaultSecondarySheet =
    "rounded-full border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-semibold text-zinc-800 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
  const defaultPrimarySheet =
    "rounded-full bg-amber-600 px-4 py-3 text-center text-sm font-semibold text-white dark:bg-amber-500 dark:text-zinc-950";

  const auxSheetClass = cn(defaultAuxSheet, auxLinkClassName);
  const secondarySheetClass = cn(defaultSecondarySheet, secondaryCtaClassName);
  const primarySheetClass = cn(defaultPrimarySheet, primaryCtaClassName);

  const themeToggleNode: ReactNode = showThemeToggle
    ? (themeToggle ?? <ThemeToggle className={themeToggleClassName} />)
    : null;

  const desktopCtas = (
    <>
      {auxLink ? (
        <Link href={auxLink.href} className={auxDesktopClass}>
          {auxLink.label}
        </Link>
      ) : null}
      {secondaryCta ? (
        <Link href={secondaryCta.href} className={secondaryDesktopClass}>
          {secondaryCta.label}
        </Link>
      ) : null}
      {primaryCta ? (
        <Link href={primaryCta.href} className={primaryDesktopClass}>
          {primaryCta.label}
        </Link>
      ) : null}
    </>
  );

  const desktopToolbarDefault = (
    <>
      {actions}
      {desktopCtas}
      {themeToggleBeforeAccount && themeToggleNode ? (
        <>
          {themeToggleNode}
          {accountMenu}
        </>
      ) : (
        <>
          {accountMenu}
          {themeToggleNode}
        </>
      )}
    </>
  );

  const desktopToolbarAccountFirst = (
    <>
      {actions}
      {themeToggleBeforeAccount && themeToggleNode ? (
        <>
          {themeToggleNode}
          {accountMenu}
        </>
      ) : (
        <>
          {accountMenu}
          {themeToggleNode}
        </>
      )}
      {desktopCtas}
    </>
  );

  const mobileAccountAndTheme = (
    <>
      {themeToggleBeforeAccount && themeToggleNode ? (
        <>
          {themeToggleNode}
          {accountMenu}
        </>
      ) : (
        <>
          {accountMenu}
          {themeToggleNode}
        </>
      )}
    </>
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-black/10 bg-white/96 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 dark:border-white/10 dark:bg-[#0a0f14] dark:backdrop-blur-md supports-[backdrop-filter]:dark:bg-[#0a0f14]/95",
        headerClassName
      )}
    >
      {prepend}
      <div
        className={cn(
          "mx-auto flex items-center justify-between gap-4 px-6 py-4 sm:px-8 lg:px-10",
          maxWidth,
          toolbarClassName
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Link href={brand.href || "/"} className="flex min-w-0 items-center gap-3">
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
              : defaultBarLink;

            return item.external ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className={barClass}
              >
                {item.label}
              </a>
            ) : (
              <Link key={item.label} href={item.href} className={barClass}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          {accountMenuFirst ? desktopToolbarAccountFirst : desktopToolbarDefault}
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          {actions}
          {mobileAccountAndTheme}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white/90 text-zinc-950 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/12 dark:bg-zinc-950/75 dark:text-white dark:shadow-[0_12px_32px_rgba(0,0,0,0.4)]",
              menuButtonClassName
            )}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-black/10 transition-[max-height,opacity] duration-300 ease-out dark:border-white/10 lg:hidden",
          mobileDrawerClassName,
          open
            ? "max-h-[min(72vh,560px)] opacity-100"
            : "pointer-events-none max-h-0 opacity-0"
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-h-[min(72vh,560px)] flex-col gap-3 overflow-y-auto overscroll-contain px-6 py-4 sm:px-8 lg:px-10",
            maxWidth,
            mobileMenuContainerClassName
          )}
        >
          {mobileSheetBeforeNav}

          {items.map((item) => {
            const active = !item.external && isNavActive(pathname, item.href);
            const sheetClass = getNavItemClassName
              ? getNavItemClassName(item, active, "sheet")
              : defaultSheetLink;

            return item.external ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className={sheetClass}
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className={sheetClass}
              >
                {item.label}
              </Link>
            );
          })}

          {mobileSheetAfterNav}
          {renderMobileSheetAfterNav ? renderMobileSheetAfterNav(() => setOpen(false)) : null}

          <div className="mt-2 flex flex-col gap-3">
            {showAccountInMobileSheetFooter ? (
              <div className="flex justify-end px-1">{accountMenu}</div>
            ) : null}
            {auxLink ? (
              <Link href={auxLink.href} onClick={() => setOpen(false)} className={auxSheetClass}>
                {auxLink.label}
              </Link>
            ) : null}
            {secondaryCta ? (
              <Link
                href={secondaryCta.href}
                onClick={() => setOpen(false)}
                className={secondarySheetClass}
              >
                {secondaryCta.label}
              </Link>
            ) : null}
            {primaryCta ? (
              <Link href={primaryCta.href} onClick={() => setOpen(false)} className={primarySheetClass}>
                {primaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
