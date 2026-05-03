"use client";

import Link from "next/link";
import { formatSurfaceTemplate, getSurfaceCopy, translateSurfaceLabel } from "@henryco/i18n";
import { useOptionalHenryCoLocale } from "@henryco/i18n/react";
import {
  ChevronDown,
  ExternalLink,
  Globe,
  LayoutDashboard,
  LogIn,
  LogOut,
  Settings2,
  UserPlus,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { AvatarFallback } from "../public-shell/avatar-fallback";
import { cn } from "../lib/cn";
import { ButtonPendingContent } from "../loading/ButtonPendingContent";
import { resolvePublicAccountIdentity } from "./account-identity";

export { resolvePublicAccountIdentity, humanizeEmailLocalPart } from "./account-identity";

export type PublicAccountUser = {
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
};

export type PublicAccountMenuLink = {
  label: string;
  href: string;
  external?: boolean;
  icon?: ReactNode;
  badge?: ReactNode;
};

export type PublicAccountMenuAction = {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  badge?: ReactNode;
};

export type PublicAccountMenuItem = PublicAccountMenuLink | PublicAccountMenuAction;

function isMenuAction(item: PublicAccountMenuItem): item is PublicAccountMenuAction {
  return typeof (item as PublicAccountMenuAction).onClick === "function";
}

const MENU_ITEM_SELECTOR = '[role="menuitem"]:not([disabled])';

type DropdownTone = "theme" | "solidDark" | "solidLight";
type ChipSurface = "theme" | "onDark";

function dropdownShellClass(tone: DropdownTone) {
  switch (tone) {
    case "solidDark":
      return "border border-zinc-700 bg-[#0c0e14] text-zinc-100 shadow-[0_28px_90px_-12px_rgba(0,0,0,0.85),0_12px_32px_rgba(0,0,0,0.55)]";
    case "solidLight":
      return "border border-zinc-200/90 bg-white text-zinc-900 shadow-[0_22px_56px_-14px_rgba(15,23,42,0.2),0_8px_20px_rgba(15,23,42,0.08)]";
    default:
      return "border border-zinc-200/90 bg-white text-zinc-900 shadow-[0_22px_56px_-14px_rgba(15,23,42,0.16),0_8px_20px_rgba(15,23,42,0.06)] dark:border-zinc-700 dark:bg-[#0c0e14] dark:text-zinc-100 dark:shadow-[0_28px_90px_-12px_rgba(0,0,0,0.82),0_12px_32px_rgba(0,0,0,0.5)]";
  }
}

function identityBlockClass(tone: DropdownTone) {
  switch (tone) {
    case "solidDark":
      return "border-b border-zinc-800 bg-[#10131c]";
    case "solidLight":
      return "border-b border-zinc-200 bg-zinc-50";
    default:
      return "border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-[#10131c]";
  }
}

function menuRowClass(tone: DropdownTone) {
  switch (tone) {
    case "solidDark":
      return "text-zinc-200 hover:bg-zinc-800/90 focus-visible:bg-zinc-800/90 focus-visible:ring-2 focus-visible:ring-amber-400/30";
    case "solidLight":
      return "text-zinc-800 hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-amber-600/25";
    default:
      return "text-zinc-700 hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-amber-500/30 dark:text-zinc-200 dark:hover:bg-zinc-800/80 dark:focus-visible:bg-zinc-800/80 dark:focus-visible:ring-amber-400/28";
  }
}

function separatorClass(tone: DropdownTone) {
  switch (tone) {
    case "solidDark":
      return "bg-zinc-700/70";
    case "solidLight":
      return "bg-zinc-200";
    default:
      return "bg-zinc-200 dark:bg-zinc-700/60";
  }
}

function identityPrimaryClass(tone: DropdownTone) {
  switch (tone) {
    case "solidDark":
      return "text-white";
    case "solidLight":
      return "text-zinc-900";
    default:
      return "text-zinc-900 dark:text-white";
  }
}

function identitySecondaryClass(tone: DropdownTone) {
  switch (tone) {
    case "solidDark":
      return "text-zinc-400";
    case "solidLight":
      return "text-zinc-600";
    default:
      return "text-zinc-600 dark:text-zinc-400";
  }
}

function signOutBarClass(tone: DropdownTone) {
  switch (tone) {
    case "solidDark":
      return "border-t border-zinc-800 bg-[#0c0e14]";
    case "solidLight":
      return "border-t border-zinc-200 bg-white";
    default:
      return "border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0c0e14]";
  }
}

export function PublicAccountChip({
  user,
  loginHref,
  accountHref,
  signupHref,
  signupLabel = "Get started",
  menuItems = [],
  preferencesHref,
  settingsHref,
  showSignOut = false,
  signOutApiPath = "/api/auth/logout",
  signOutRedirectHref,
  dropdownTone = "theme",
  chipSurface = "theme",
  className,
  buttonClassName,
  dropdownClassName,
  chipLabelClassName,
}: {
  user: PublicAccountUser | null;
  loginHref: string;
  accountHref: string;
  signupHref?: string;
  signupLabel?: string;
  menuItems?: PublicAccountMenuItem[];
  preferencesHref?: string;
  /** Security / account settings (typically shared HenryCo account). */
  settingsHref?: string;
  showSignOut?: boolean;
  signOutApiPath?: string;
  signOutRedirectHref?: string;
  /** Menu panel colors: follow site theme, or force solid dark/light surfaces. */
  dropdownTone?: DropdownTone;
  /** Chip (signed-in and signed-out controls) for dark headers vs standard adaptive styling. */
  chipSurface?: ChipSurface;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  chipLabelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const locale = useOptionalHenryCoLocale() ?? "en";
  const surfaceCopy = getSurfaceCopy(locale);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const resolvedTone: DropdownTone = dropdownTone;
  const localize = (label: string) => translateSurfaceLabel(locale, label);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open || !menuRef.current) return;
    const first = menuRef.current.querySelector<HTMLElement>(MENU_ITEM_SELECTOR);
    first?.focus();
  }, [open]);

  function handleMenuKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    const menu = menuRef.current;
    if (!menu) return;

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const items = Array.from(
        menu.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR)
      );
      if (!items.length) return;
      const current = items.indexOf(document.activeElement as HTMLElement);
      let next: number;
      if (e.key === "ArrowDown") {
        next = current < items.length - 1 ? current + 1 : 0;
      } else {
        next = current > 0 ? current - 1 : items.length - 1;
      }
      items[next]?.focus();
    }

    if (e.key === "Tab") {
      close();
    }
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch(signOutApiPath, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
    } catch {
      /* still redirect */
    } finally {
      const next =
        signOutRedirectHref ||
        (typeof window !== "undefined" ? `${window.location.origin}/` : "/");
      window.location.assign(next);
    }
  }

  const chipSignedOut = cn(
    "inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold shadow-sm transition active:scale-[0.97]",
    chipSurface === "onDark"
      ? "border-zinc-600/80 bg-zinc-900 text-[var(--market-paper-white,white)] hover:border-zinc-500 hover:bg-zinc-800"
      : "border-black/12 bg-white text-zinc-800 shadow-sm hover:border-black/20 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
  );

  const chipCta = cn(
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold shadow-sm transition active:scale-[0.97]",
    chipSurface === "onDark"
      ? "border-transparent bg-[var(--market-brass,#d4a853)] font-bold text-[var(--market-noir,#0a0a0a)] shadow-[0_10px_36px_rgba(201,162,39,0.42)] ring-2 ring-[rgba(255,255,255,0.18)] hover:brightness-105"
      : "border-amber-600/20 bg-amber-600 text-white hover:bg-amber-700 dark:border-amber-400/30 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
  );

  /* ── Signed-out state ── */
  if (!user) {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-end gap-2",
          className
        )}
      >
        <Link
          href={loginHref}
          aria-label={surfaceCopy.publicAccount.signInAria}
          title={surfaceCopy.publicAccount.signInTitle}
          className={cn(chipSignedOut, buttonClassName)}
        >
          <LogIn className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          {localize("Sign in")}
        </Link>
        {signupHref ? (
          <Link
            href={signupHref}
            className={cn(chipCta, buttonClassName)}
            aria-label={surfaceCopy.publicAccount.signUpAria}
          >
            <UserPlus className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            {localize(signupLabel)}
          </Link>
        ) : null}
      </div>
    );
  }

  /* ── Signed-in state ── */
  const { primaryLabel, emailLine, initialsSource } = resolvePublicAccountIdentity(user);

  const triggerClass = cn(
    "flex max-w-[min(200px,calc(100vw-8rem))] min-h-[40px] items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 text-left shadow-sm transition active:scale-[0.98]",
    chipSurface === "onDark"
      ? "border-zinc-600/85 bg-zinc-900 text-[var(--market-paper-white,white)] hover:border-zinc-500 hover:bg-zinc-800 hover:shadow-md"
      : "border-zinc-200/90 bg-white hover:border-zinc-300 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
  );

  const chevronClass =
    chipSurface === "onDark"
      ? "h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform duration-200"
      : "h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-200 dark:text-zinc-500";

  const labelClass = cn(
    "min-w-0 flex-1 truncate text-[13px] font-semibold leading-tight tracking-[-0.01em]",
    chipSurface === "onDark"
      ? "text-[var(--market-paper-white,white)]"
      : "text-zinc-900 dark:text-zinc-100",
    chipLabelClassName
  );

  const rowBase = cn(
    "mx-1.5 flex min-h-[40px] items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors",
    menuRowClass(resolvedTone)
  );

  const showMidSeparator = menuItems.length > 0;

  function renderMenuItem(item: PublicAccountMenuItem) {
    const content = (
      <>
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          {item.icon ? (
            <span className="shrink-0 opacity-80 [&_svg]:h-4 [&_svg]:w-4">{item.icon}</span>
          ) : null}
          <span className="truncate">{localize(item.label)}</span>
        </span>
        {item.badge ? (
          <span className="shrink-0 text-xs font-semibold tabular-nums">{item.badge}</span>
        ) : null}
      </>
    );

    if (isMenuAction(item)) {
      return (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          tabIndex={0}
          className={cn(rowBase, "w-[calc(100%-0.75rem)] justify-between text-left")}
          onClick={() => {
            close();
            item.onClick();
          }}
        >
          {content}
        </button>
      );
    }

    if (item.external) {
      return (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          role="menuitem"
          tabIndex={0}
          className={cn(rowBase, "justify-between")}
          onClick={close}
        >
          {content}
          <ExternalLink
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              resolvedTone === "solidDark" ? "text-zinc-500" : "text-zinc-300 dark:text-zinc-600"
            )}
            aria-hidden
          />
        </a>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href}
        role="menuitem"
        tabIndex={0}
        className={cn(rowBase, item.badge ? "justify-between" : "")}
        onClick={close}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={formatSurfaceTemplate(surfaceCopy.publicAccount.accountMenuFor, {
          name: primaryLabel,
        })}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        className={cn(triggerClass, buttonClassName)}
      >
        <AvatarFallback
          src={user.avatarUrl}
          displayName={initialsSource}
          size="sm"
          className={cn(
            chipSurface === "onDark" &&
              "ring-2 ring-zinc-600/90 dark:from-amber-500 dark:to-teal-600"
          )}
        />
        <span className={labelClass}>{primaryLabel}</span>
        <ChevronDown
          className={cn(chevronClass, open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={surfaceCopy.publicAccount.accountMenu}
          onKeyDown={handleMenuKeyDown}
          className={cn(
            "absolute right-0 z-[60] mt-2.5 w-[min(320px,calc(100vw-1rem))] origin-top-right animate-[hc-dropdown-in_150ms_ease-out] overflow-hidden rounded-xl border",
            dropdownShellClass(resolvedTone),
            dropdownClassName
          )}
        >
          <div className={cn("px-4 py-4", identityBlockClass(resolvedTone))}>
            <div className="flex items-start gap-3.5">
              <AvatarFallback
                src={user.avatarUrl}
                displayName={initialsSource}
                size="md"
                className={cn(
                  resolvedTone === "solidDark" &&
                    "ring-2 ring-zinc-700 from-amber-500 to-teal-600"
                )}
              />
              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className={cn(
                    "truncate text-[15px] font-semibold leading-snug tracking-[-0.015em]",
                    identityPrimaryClass(resolvedTone)
                  )}
                >
                  {primaryLabel}
                </p>
                {emailLine ? (
                  <p
                    className={cn(
                      "mt-1 truncate text-[12px] font-medium leading-normal",
                      identitySecondaryClass(resolvedTone)
                    )}
                  >
                    {emailLine}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="py-1.5">
            <Link
              href={accountHref}
              role="menuitem"
              tabIndex={0}
              className={rowBase}
              onClick={close}
            >
              <LayoutDashboard
                className={cn(
                  "h-4 w-4 shrink-0",
                  resolvedTone === "solidDark" ? "text-zinc-500" : "text-zinc-400 dark:text-zinc-500"
                )}
                aria-hidden
              />
              {localize("Profile & account")}
            </Link>

            {preferencesHref ? (
              <Link
                href={preferencesHref}
                role="menuitem"
                tabIndex={0}
                className={rowBase}
                onClick={close}
              >
                <Globe
                  className={cn(
                    "h-4 w-4 shrink-0",
                    resolvedTone === "solidDark" ? "text-zinc-500" : "text-zinc-400 dark:text-zinc-500"
                  )}
                  aria-hidden
                />
                {localize("Language & preferences")}
              </Link>
            ) : null}

            {showMidSeparator ? (
              <div
                role="separator"
                className={cn("mx-4 my-1.5 h-px", separatorClass(resolvedTone))}
              />
            ) : null}

            {menuItems.map((item) => renderMenuItem(item))}
          </div>

          {settingsHref || showSignOut ? (
            <div className={cn("py-1.5", signOutBarClass(resolvedTone))}>
              {settingsHref ? (
                <Link
                  href={settingsHref}
                  role="menuitem"
                  tabIndex={0}
                  className={rowBase}
                  onClick={close}
                >
                  <Settings2
                    className={cn(
                      "h-4 w-4 shrink-0",
                      resolvedTone === "solidDark" ? "text-zinc-500" : "text-zinc-400 dark:text-zinc-500"
                    )}
                    aria-hidden
                  />
                  {localize("Settings")}
                </Link>
              ) : null}

              {showSignOut ? (
                <button
                  type="button"
                  role="menuitem"
                  tabIndex={0}
                  disabled={signingOut}
                  className={cn(
                    "mx-1.5 flex w-[calc(100%-0.75rem)] min-h-[40px] items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 outline-none transition-colors hover:bg-red-50 focus-visible:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500/40 disabled:cursor-wait disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/12 dark:focus-visible:bg-red-500/12 dark:focus-visible:ring-red-400/35",
                    resolvedTone === "solidDark" &&
                      "text-red-400 hover:bg-red-500/12 focus-visible:bg-red-500/12"
                  )}
                  onClick={() => {
                    close();
                    void handleSignOut();
                  }}
                >
                  <ButtonPendingContent
                    pending={signingOut}
                    pendingLabel={surfaceCopy.publicAccount.signingOut}
                    spinnerLabel={surfaceCopy.publicAccount.signOut}
                  >
                    <>
                      <LogOut className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                      {surfaceCopy.publicAccount.signOut}
                    </>
                  </ButtonPendingContent>
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
