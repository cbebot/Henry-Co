"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getSurfaceCopy, translateSurfaceLabel } from "@henryco/i18n";
import { useOptionalHenryCoLocale } from "@henryco/i18n/react";
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
}: PublicHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const locale = useOptionalHenryCoLocale() ?? "en";
  const surfaceCopy = getSurfaceCopy(locale);
  const floating = variant === "floating";
  const localize = (label: string) => translateSurfaceLabel(locale, label);

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

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
          type="button"
          onClick={() => {
            setOpen((v) => {
              const next = !v;
              // When opening from the bottom of a long page, scroll
              // the viewport back to the top so the drawer + its menu
              // items are visible immediately. Skip when closing or
              // when the user is already near the top.
              if (next && typeof window !== "undefined" && window.scrollY > 80) {
                window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
              }
              return next;
            });
          }}
          className={cn(
            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200/90 bg-white text-zinc-950 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus-visible:ring-amber-400/45 dark:focus-visible:ring-offset-[#0a0f14]",
            floating && "h-10 w-10 rounded-xl",
            menuButtonClassName
          )}
          aria-expanded={open}
          aria-controls="henryco-public-mobile-nav"
          aria-label={open ? surfaceCopy.publicHeader.closeMenu : surfaceCopy.publicHeader.openMenu}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );

  const mobileDrawer = (
    <div
      id="henryco-public-mobile-nav"
      className={cn(
        "border-t border-zinc-200/80 transition-[max-height,opacity] duration-300 ease-out motion-reduce:transition-none motion-reduce:duration-0 dark:border-zinc-800/90 lg:hidden",
        mobileDrawerClassName,
        open ? "max-h-[min(72vh,560px)] opacity-100" : "pointer-events-none max-h-0 opacity-0"
      )}
    >
      <div
        className={cn(
          "flex max-h-[min(72vh,560px)] flex-col gap-2 overflow-y-auto overscroll-contain py-3",
          floating ? "px-4 sm:px-5" : "px-6 py-4 sm:px-8 lg:px-10",
          mobileMenuContainerClassName
        )}
      >
        <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
          {surfaceCopy.publicHeader.menu}
        </p>
        {mobileSheetBeforeNav}

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
              className={sheetClass}
            >
              {localize(item.label)}
            </a>
          ) : (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className={sheetClass}
              aria-current={active ? "page" : undefined}
            >
              {localize(item.label)}
            </Link>
          );
        })}

        {mobileSheetAfterNav}
        {renderMobileSheetAfterNav ? renderMobileSheetAfterNav(() => setOpen(false)) : null}

        <div className="mt-3 border-t border-zinc-200/70 pt-3 dark:border-zinc-800/80">
          <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            {surfaceCopy.publicHeader.actions}
          </p>
          <div className="flex flex-col gap-2">
            {showAccountInMobileSheetFooter ? (
              <div className="flex justify-stretch px-0.5">{accountMenu}</div>
            ) : null}
            {auxLink ? (
              <Link href={auxLink.href} onClick={() => setOpen(false)} className={auxSheetClass}>
                {localize(auxLink.label)}
              </Link>
            ) : null}
            {secondaryCta ? (
              <Link href={secondaryCta.href} onClick={() => setOpen(false)} className={secondarySheetClass}>
                {localize(secondaryCta.label)}
              </Link>
            ) : null}
            {primaryCta ? (
              <Link href={primaryCta.href} onClick={() => setOpen(false)} className={primarySheetClass}>
                {localize(primaryCta.label)}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  const shellInner = (
    <>
      {toolbarRow}
      {mobileDrawer}
    </>
  );

  return (
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
      {open ? (
        <button
          type="button"
          aria-label={surfaceCopy.publicHeader.closeMenu}
          className="fixed inset-0 z-40 bg-zinc-950/45 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div className={cn("relative z-[60] mx-auto w-full", maxWidth, floating && "px-3 sm:px-4")}>
        {floating ? (
          <div className={HenryCoPublicSurfaceTokens.floatingHeaderChrome}>{shellInner}</div>
        ) : (
          shellInner
        )}
      </div>
    </header>
  );
}
