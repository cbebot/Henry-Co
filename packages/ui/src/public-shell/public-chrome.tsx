"use client";

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Search, Moon, SunMedium, ArrowUpRight, LogIn, UserPlus } from "lucide-react";
import { useTheme } from "next-themes";
import { getSurfaceCopy, translateSurfaceLabel } from "@henryco/i18n";
import { useOptionalHenryCoLocale } from "@henryco/i18n/react";
import { BottomSheet, type BottomSheetCloseReason } from "../mobile/bottom-sheet";
import { suppressSentinelPop } from "../mobile/use-android-back-close";
import { SkipLink } from "../a11y/skip-link";
import { shortNameForChip } from "../public/account-identity";
import { cn } from "../lib/cn";

/**
 * PublicChrome — the single, theme-aware public top chrome for every Henry Onyx
 * public site (V3-PUBLIC-CHROME).
 *
 * Built ENTIRELY on the shared `--home-*` design-system tokens, so — rendered
 * inside the page's `.home-accent-scope` wrapper — it inherits the exact same
 * canvas, ink, hairline, glass and division accent the page uses, and therefore
 * flips WITH the page on every theme change (device or toggle). No hardcoded
 * zinc/amber/white, no `dark:` forks, no per-division `headerClassName` hacks,
 * and — critically — it OWNS the identity cluster (Sign in / Get started /
 * account) instead of slotting an external chip, so the login/signup actions
 * are theme-aware and wear the division copper accent (not a generic orange).
 *
 * Behaviour preserved from the old engine (the parts that fixed real bugs):
 * pre-paint-safe theme toggle, BottomSheet mobile drawer (portal-mounted at
 * <body>), route-change auto-close, suppressSentinelPop() so an in-drawer tap
 * navigates instead of being eaten by the Android-back race, scroll-condense,
 * and the WCAG skip link.
 */

export type PublicChromeNavItem = {
  label: string;
  href: string;
  external?: boolean;
};

export type PublicChromeBrand = {
  name: string;
  /** Division sub-label rendered below the brand name (e.g. "Studio", "Care").
   *  Henry Onyx is always the primary name; the division is context beneath it. */
  eyebrow?: string;
  href?: string;
  /** Brand monogram / logo mark. Rendered in a tokenised tile. */
  mark?: ReactNode;
};

export type PublicChromeAccount = {
  /** When set, the visitor is signed in; otherwise Sign in / Get started show. */
  user?: { displayName?: string | null; email?: string | null; avatarUrl?: string | null } | null;
  loginHref: string;
  signupHref: string;
  accountHref?: string;
  loginLabel?: string;
  signupLabel?: string;
  accountLabel?: string;
};

export type PublicChromeProps = {
  brand: PublicChromeBrand;
  items: readonly PublicChromeNavItem[];
  /** Identity data — PublicChrome renders the theme-aware Sign in / Get started
   *  cluster itself when the visitor is signed OUT. */
  account?: PublicChromeAccount;
  /** Signed-IN account control (avatar + dropdown: account / preferences /
   *  settings / sign-out). Slot the existing PublicAccountChip here so the
   *  account menu + sign-out are PRESERVED; PublicChrome renders it only when
   *  `account.user` is set, and shows Sign in / Get started otherwise. */
  accountMenu?: ReactNode;
  /** Extra toolbar actions (desktop + mobile) — e.g. a cart trigger,
   *  notifications bell, vendor link. PublicChrome stays commerce-agnostic;
   *  sites slot live-runtime controls here so a swap never drops them. */
  extras?: ReactNode;
  /** Optional ghost CTA (e.g. "Speak to Studio" / "Contact"). */
  auxLink?: PublicChromeNavItem;
  /** Optional emphasis CTA in the division accent — a product action like
   *  "Start a project". When set, the signed-out identity cluster shows Sign in
   *  ONLY (no duplicate signup "Get started"); when absent, it shows Sign in +
   *  Get started. */
  primaryCta?: PublicChromeNavItem;
  /** Built-in search pill (pass an href) or a fully custom node. */
  search?: { href: string; label?: string } | ReactNode;
  /** Optional thin announcement strip above the toolbar. */
  prepend?: ReactNode;
  /** Redesign 2026-07-08: the ≤64px chrome budget. When set, the toolbar
   *  RESTS at the scroll-condensed padding (0.55rem) and the brand tile
   *  drops to 36px, putting the whole bar at ~63px + hairline. Opt-in per
   *  division so unadopted sites render pixel-identically. */
  dense?: boolean;
  showThemeToggle?: boolean;
  maxWidth?: string;
  /** Accent/theme CSS vars to re-establish inside the portaled mobile drawer
   *  (BottomSheet mounts at <body>, OUTSIDE the page's .home-accent-scope, so
   *  --home-accent would otherwise fall back to the gold :root default). Pass
   *  the same style object the page wrapper uses so the drawer wears the
   *  division accent. */
  accentStyle?: CSSProperties;
};

function isNavActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

function isSearchConfig(
  value: PublicChromeProps["search"],
): value is { href: string; label?: string } {
  return Boolean(value) && typeof value === "object" && "href" in (value as object);
}

function initialsOf(account: PublicChromeAccount): string {
  const source = account.user?.displayName || account.user?.email || "";
  const parts = source.trim().split(/[\s@.]+/).filter(Boolean);
  if (parts.length === 0) return "•";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

/** Theme toggle on --home-* tokens — binary light⇄dark off resolvedTheme. The
 *  device-resync (DeviceThemeSync in ThemeProvider) means an OS change still
 *  re-takes control; this button just flips + persists an explicit choice. */
function ChromeThemeToggle({ t }: { t: (s: string) => string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const next = isDark ? "light" : "dark";
  const label = mounted ? t(`Switch to ${next} theme`) : t("Switch theme");
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[color:var(--home-ink-65)] outline-none transition hover:bg-[color:var(--home-surface-07)] hover:text-[color:var(--home-ink)] focus-visible:ring-2 focus-visible:ring-[color:var(--home-accent)]/45"
    >
      {isDark ? (
        <SunMedium className="h-[18px] w-[18px]" aria-hidden />
      ) : (
        <Moon className="h-[18px] w-[18px]" aria-hidden />
      )}
    </button>
  );
}

/** Theme-aware identity cluster. layout "bar" = desktop inline; "sheet" = full
 *  width in the mobile drawer. Signed-out → Sign in (ghost) + Get started
 *  (copper). Signed-in → avatar + name → account. */
function IdentityActions({
  account,
  accountMenu,
  showSignup = true,
  t,
  layout,
}: {
  account: PublicChromeAccount;
  accountMenu?: ReactNode;
  showSignup?: boolean;
  t: (s: string) => string;
  layout: "bar" | "sheet";
}) {
  const sheet = layout === "sheet";
  // Signed-in + a slotted account control (PublicAccountChip) → render it so the
  // account dropdown + sign-out are preserved. Falls back to an avatar→account
  // link if no menu was provided.
  if (account.user && accountMenu) {
    return <>{accountMenu}</>;
  }
  if (account.user) {
    // Single name part only — a full name overflows the ≤64px mobile chrome.
    const name = shortNameForChip(
      account.user.displayName || account.user.email || t(account.accountLabel || "Account"),
    );
    return (
      <Link
        href={account.accountHref || "/"}
        className={cn(
          "inline-flex items-center gap-2.5 rounded-full border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] text-[color:var(--home-ink)] outline-none transition hover:bg-[color:var(--home-surface-07)] focus-visible:ring-2 focus-visible:ring-[color:var(--home-accent)]/45",
          sheet ? "justify-center px-4 py-3 text-sm font-semibold" : "py-1 pl-1 pr-3.5 text-sm font-medium",
        )}
      >
        {account.user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={account.user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--home-accent-soft)] text-[11px] font-semibold text-[color:var(--home-accent-text)]">
            {initialsOf(account)}
          </span>
        )}
        <span className="max-w-[12ch] truncate">{name}</span>
      </Link>
    );
  }
  return (
    <>
      <Link
        href={account.loginHref}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] font-semibold text-[color:var(--home-ink)] outline-none transition hover:bg-[color:var(--home-surface-07)] focus-visible:ring-2 focus-visible:ring-[color:var(--home-accent)]/45",
          sheet ? "px-4 py-3 text-sm" : "px-3.5 py-2 text-sm",
        )}
      >
        <LogIn className="h-4 w-4" aria-hidden />
        {t(account.loginLabel || "Sign in")}
      </Link>
      {showSignup ? (
        <Link
          href={account.signupHref}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[color:var(--home-accent)] font-semibold text-[color:var(--home-accent-ink)] outline-none transition hover:bg-[color:var(--home-accent-strong)] focus-visible:ring-2 focus-visible:ring-[color:var(--home-accent)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--home-canvas)]",
            sheet ? "px-4 py-3 text-sm" : "px-4 py-2 text-sm",
          )}
        >
          <UserPlus className="h-4 w-4" aria-hidden />
          {t(account.signupLabel || "Get started")}
        </Link>
      ) : null}
    </>
  );
}

export function PublicChrome({
  brand,
  items,
  account,
  accountMenu,
  extras,
  auxLink,
  primaryCta,
  search,
  prepend,
  dense = false,
  showThemeToggle = true,
  maxWidth = "max-w-7xl",
  accentStyle,
}: PublicChromeProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const locale = useOptionalHenryCoLocale() ?? "en";
  const surfaceCopy = getSurfaceCopy(locale);
  const t = (label: string) => translateSurfaceLabel(locale, label);

  const idBase = useId();
  const drawerId = `henryco-public-chrome-nav-${idBase}`;
  const drawerTitleId = `${drawerId}-title`;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSheetClose = useCallback((_reason: BottomSheetCloseReason) => {
    setOpen(false);
  }, []);
  const closeDrawer = useCallback(() => setOpen(false), []);
  const closeDrawerAfterNav = useCallback(() => {
    suppressSentinelPop();
    setTimeout(() => setOpen(false), 0);
  }, []);

  const brandLockup = (
    <Link
      href={brand.href || "/"}
      className="group/brand flex shrink-0 items-center gap-3 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--home-accent)]/45"
    >
      {brand.mark ? (
        <span
          className={cn(
            "grid shrink-0 place-items-center overflow-hidden border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-07)] text-[color:var(--home-accent-text)] transition group-hover/brand:border-[color:var(--home-line-15)]",
            dense ? "h-9 w-9 rounded-xl" : "h-11 w-11 rounded-2xl",
          )}
        >
          {brand.mark}
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-semibold tracking-tight text-[color:var(--home-ink)]">
          {t(brand.name)}
        </span>
        {brand.eyebrow ? (
          <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-ink-65)]">
            {t(brand.eyebrow)}
          </span>
        ) : null}
      </span>
    </Link>
  );

  const desktopNav = (
    <nav className="hidden min-w-0 items-center gap-1 lg:flex">
      {items.map((item) => {
        const active = !item.external && isNavActive(pathname, item.href);
        const className = cn(
          "relative rounded-full px-3.5 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-[color:var(--home-accent)]/45",
          active
            ? "text-[color:var(--home-ink)] after:absolute after:inset-x-3.5 after:-bottom-0.5 after:h-px after:rounded-full after:bg-[color:var(--home-accent-text)]"
            : "text-[color:var(--home-ink-65)] hover:bg-[color:var(--home-surface-04)] hover:text-[color:var(--home-ink)]",
        );
        return item.external ? (
          <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className={className}>
            {t(item.label)}
          </a>
        ) : (
          <Link key={item.label} href={item.href} className={className} aria-current={active ? "page" : undefined}>
            {t(item.label)}
          </Link>
        );
      })}
    </nav>
  );

  const searchNode = isSearchConfig(search) ? (
    <>
      {/* Compact icon — desktop nav row from lg up to <2xl, where the full
          labelled pill would crowd dense navs (e.g. studio's 7 items) and force
          the brand to truncate. Identity stays inviolable; search stays one tap. */}
      <Link
        href={search.href}
        aria-label={t(search.label || "Search Henry Onyx")}
        title={t(search.label || "Search Henry Onyx")}
        className="hidden h-10 w-10 items-center justify-center rounded-full border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] text-[color:var(--home-ink-65)] outline-none transition hover:bg-[color:var(--home-surface-07)] hover:text-[color:var(--home-ink)] focus-visible:ring-2 focus-visible:ring-[color:var(--home-accent)]/45 lg:inline-flex 2xl:hidden"
      >
        <Search className="h-4 w-4" aria-hidden />
      </Link>
      {/* Full labelled pill — only where there's comfortable room (2xl+). */}
      <Link
        href={search.href}
        className="hidden items-center gap-2 rounded-full border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] px-3.5 py-2 text-sm text-[color:var(--home-ink-65)] outline-none transition hover:bg-[color:var(--home-surface-07)] hover:text-[color:var(--home-ink)] focus-visible:ring-2 focus-visible:ring-[color:var(--home-accent)]/45 2xl:inline-flex"
      >
        <Search className="h-4 w-4" aria-hidden />
        <span className="truncate">{t(search.label || "Search Henry Onyx")}</span>
        <kbd className="ml-1 rounded border border-[color:var(--home-line-12)] px-1.5 text-[10px] font-medium text-[color:var(--home-ink-50)]">
          /
        </kbd>
      </Link>
    </>
  ) : (
    (search as ReactNode) ?? null
  );

  const auxNode = auxLink ? (
    <Link
      href={auxLink.href}
      className="hidden items-center whitespace-nowrap rounded-full border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] px-3.5 py-2 text-sm font-semibold text-[color:var(--home-ink-65)] outline-none transition hover:bg-[color:var(--home-surface-07)] hover:text-[color:var(--home-ink)] focus-visible:ring-2 focus-visible:ring-[color:var(--home-accent)]/45 2xl:inline-flex"
    >
      {t(auxLink.label)}
    </Link>
  ) : null;

  const primaryCtaNode = primaryCta ? (
    <Link
      href={primaryCta.href}
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[color:var(--home-accent)] px-4 py-2 text-sm font-semibold text-[color:var(--home-accent-ink)] outline-none transition hover:bg-[color:var(--home-accent-strong)] focus-visible:ring-2 focus-visible:ring-[color:var(--home-accent)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--home-canvas)]"
    >
      {t(primaryCta.label)}
    </Link>
  ) : null;

  const toolbar = (
    <div
      style={dense ? { paddingBlock: "0.4rem" } : scrolled ? { paddingBlock: "0.55rem" } : undefined}
      className="flex items-center justify-between gap-3 px-4 py-3.5 transition-[padding] duration-300 ease-out motion-reduce:transition-none sm:px-6 lg:px-8"
    >
      {brandLockup}

      <div className="flex items-center gap-1.5">{desktopNav}</div>

      <div className="hidden items-center gap-2 lg:flex">
        {searchNode}
        {extras}
        {showThemeToggle ? (
          <div className="flex items-center rounded-full border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-02)] p-1">
            <ChromeThemeToggle t={t} />
          </div>
        ) : null}
        {account ? (
          <IdentityActions
            account={account}
            accountMenu={accountMenu}
            showSignup={!primaryCta}
            t={t}
            layout="bar"
          />
        ) : null}
        {auxNode}
        {primaryCtaNode}
      </div>

      {/* Mobile cluster */}
      <div className="flex items-center gap-1.5 lg:hidden">
        {/* MOBILE IDENTITY (redesign 2026-07-08): identity and navigation
            are different jobs — signed-in identity lives HERE in the bar
            as the avatar chip (its own menu carries account / workspace /
            settings / SIGN OUT), never inside the nav sheet, where the
            sheet's close-on-tap wrapper made the menu — and logout —
            unreachable. */}
        {account?.user && accountMenu ? accountMenu : null}
        {extras}
        {showThemeToggle ? <ChromeThemeToggle t={t} /> : null}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] text-[color:var(--home-ink)] outline-none transition hover:bg-[color:var(--home-surface-07)] focus-visible:ring-2 focus-visible:ring-[color:var(--home-accent)]/45"
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

  const drawer = (
    <BottomSheet
      open={open}
      onClose={handleSheetClose}
      id={drawerId}
      labelledBy={drawerTitleId}
      surface="henryco.public_chrome_drawer"
      triggerRef={triggerRef}
      initialFocusRef={closeRef}
    >
      <div className="home-accent-scope flex min-h-0 flex-1 flex-col text-[color:var(--home-ink)]" style={accentStyle}>
      <header className="flex items-start justify-between gap-3 border-b border-[color:var(--home-line)] px-5 pb-4 pt-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--home-accent-text)]">
            {surfaceCopy.publicHeader.menu}
          </p>
          <p id={drawerTitleId} className="mt-1 line-clamp-2 text-base font-semibold tracking-tight text-[color:var(--home-ink)]">
            {t(brand.name)}
          </p>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={closeDrawer}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color:var(--home-line-12)] text-[color:var(--home-ink-65)] outline-none transition hover:bg-[color:var(--home-surface-07)] hover:text-[color:var(--home-ink)] focus-visible:ring-2 focus-visible:ring-[color:var(--home-accent)]/45"
          aria-label={surfaceCopy.publicHeader.closeMenu}
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
        {isSearchConfig(search) ? (
          <Link
            href={search.href}
            onClick={closeDrawerAfterNav}
            className="mb-3 flex items-center gap-2 rounded-2xl border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] px-4 py-3 text-sm text-[color:var(--home-ink-65)]"
          >
            <Search className="h-4 w-4" aria-hidden />
            {t(search.label || "Search Henry Onyx")}
          </Link>
        ) : null}

        <div className="flex flex-col gap-1.5">
          {items.map((item) => {
            const active = !item.external && isNavActive(pathname, item.href);
            const className = cn(
              "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition",
              active
                ? "border-[color:var(--home-line-15)] bg-[color:var(--home-surface-07)] text-[color:var(--home-ink)]"
                : "border-[color:var(--home-line-12)] bg-[color:var(--home-surface-02)] text-[color:var(--home-ink-65)] hover:text-[color:var(--home-ink)]",
            );
            return item.external ? (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer" onClick={closeDrawer} className={className}>
                {t(item.label)}
                <ArrowUpRight className="h-4 w-4 opacity-60" aria-hidden />
              </a>
            ) : (
              <Link key={item.label} href={item.href} onClick={closeDrawerAfterNav} className={className} aria-current={active ? "page" : undefined}>
                {t(item.label)}
              </Link>
            );
          })}
        </div>

        {account || auxLink || primaryCta ? (
          <div className="mt-4 flex flex-col gap-2 border-t border-[color:var(--home-line)] pt-4" onClick={closeDrawerAfterNav}>
            {/* Signed-in identity lives in the BAR (avatar chip), not here —
                this wrapper closes the sheet on any tap, which swallowed the
                chip's menu (and made sign-out unreachable). The sheet keeps
                only signed-OUT identity links, which SHOULD close it. */}
            {account && !account.user ? (
              <IdentityActions
                account={account}
                accountMenu={accountMenu}
                showSignup={!primaryCta}
                t={t}
                layout="sheet"
              />
            ) : null}
            {auxLink ? (
              <Link
                href={auxLink.href}
                className="flex items-center justify-center rounded-full border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] px-4 py-3 text-sm font-semibold text-[color:var(--home-ink)]"
              >
                {t(auxLink.label)}
              </Link>
            ) : null}
            {primaryCta ? (
              <Link
                href={primaryCta.href}
                className="flex items-center justify-center rounded-full bg-[color:var(--home-accent)] px-4 py-3 text-sm font-semibold text-[color:var(--home-accent-ink)]"
              >
                {t(primaryCta.label)}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
      </div>
    </BottomSheet>
  );

  return (
    <>
      <SkipLink href="#henryco-main" />
      <header
        data-scrolled={scrolled ? "true" : undefined}
        className={cn(
          "sticky top-0 z-50 border-b backdrop-blur-2xl transition-shadow duration-300 ease-out motion-reduce:transition-none",
          "border-[color:var(--home-line)] bg-[color:var(--home-glass)] supports-[backdrop-filter]:bg-[color:var(--home-glass)]",
          scrolled && "bg-[color:var(--home-glass-strong)] supports-[backdrop-filter]:bg-[color:var(--home-glass-strong)] shadow-[0_18px_50px_-32px_rgb(var(--home-ink-rgb)/0.45)]",
        )}
      >
        {prepend ? <div className="relative z-[70] border-b border-[color:var(--home-line-08)]">{prepend}</div> : null}
        <div className={cn("relative z-[60] mx-auto w-full", maxWidth)}>{toolbar}</div>
      </header>
      {drawer}
    </>
  );
}
