"use client";

import Image from "next/image";
import Link from "next/link";
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
import { cn } from "../lib/cn";

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

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

const MENU_ITEM_SELECTOR = '[role="menuitem"]:not([disabled])';

type DropdownTone = "theme" | "solidDark" | "solidLight";
type ChipSurface = "theme" | "onDark";

function dropdownShellClass(tone: DropdownTone) {
  switch (tone) {
    case "solidDark":
      return "border-zinc-600/90 bg-zinc-950 text-zinc-100 shadow-[0_24px_80px_-10px_rgba(0,0,0,0.72),0_8px_24px_rgba(0,0,0,0.45)]";
    case "solidLight":
      return "border-zinc-200 bg-white text-zinc-900 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.18)]";
    default:
      return "border-zinc-200 bg-white text-zinc-900 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.14)] dark:border-zinc-600/90 dark:bg-zinc-950 dark:text-zinc-100 dark:shadow-[0_24px_80px_-10px_rgba(0,0,0,0.65)]";
  }
}

function identityBlockClass(tone: DropdownTone) {
  switch (tone) {
    case "solidDark":
      return "border-b border-zinc-700/80 bg-zinc-900";
    case "solidLight":
      return "border-b border-zinc-200 bg-zinc-100";
    default:
      return "border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700/70 dark:bg-zinc-900";
  }
}

function menuRowClass(tone: DropdownTone) {
  switch (tone) {
    case "solidDark":
      return "text-zinc-200 hover:bg-white/[0.07] focus-visible:bg-white/[0.07] focus-visible:ring-amber-400/35";
    case "solidLight":
      return "text-zinc-800 hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:ring-amber-600/30";
    default:
      return "text-zinc-700 hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:ring-amber-500/40 dark:text-zinc-200 dark:hover:bg-white/[0.08] dark:focus-visible:bg-white/[0.08] dark:focus-visible:ring-amber-400/35";
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
      return "border-t border-zinc-700/80";
    case "solidLight":
      return "border-t border-zinc-200";
    default:
      return "border-t border-zinc-200 dark:border-zinc-700/70";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const resolvedTone: DropdownTone = dropdownTone;

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
      ? "border-[var(--market-line,white/12)] bg-[rgba(255,255,255,0.06)] text-[var(--market-paper-white,white)] hover:bg-[rgba(255,255,255,0.1)]"
      : "border-black/12 bg-white text-zinc-800 shadow-sm hover:border-black/20 hover:bg-zinc-50 dark:border-white/12 dark:bg-white/8 dark:text-white/90 dark:hover:border-white/20 dark:hover:bg-white/12"
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
          aria-label="Sign in to your HenryCo account"
          title="Sign in to save progress and access your account"
          className={cn(chipSignedOut, buttonClassName)}
        >
          <LogIn className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          Sign in
        </Link>
        {signupHref ? (
          <Link
            href={signupHref}
            className={cn(chipCta, buttonClassName)}
            aria-label="Create a HenryCo account"
          >
            <UserPlus className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            {signupLabel}
          </Link>
        ) : null}
      </div>
    );
  }

  /* ── Signed-in state ── */
  const label = user.displayName || user.email || "Account";

  const triggerClass = cn(
    "flex max-w-[min(220px,calc(100vw-8rem))] min-h-[44px] items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-left shadow-sm transition active:scale-[0.97]",
    chipSurface === "onDark"
      ? "border-[var(--market-line,white/12)] bg-[rgba(255,255,255,0.1)] text-[var(--market-paper-white,white)] hover:bg-[rgba(255,255,255,0.14)] hover:shadow-md"
      : "border-black/12 bg-white hover:border-black/22 hover:shadow-md dark:border-white/14 dark:bg-zinc-900 dark:hover:border-white/24 dark:hover:shadow-lg"
  );

  const avatarShell = cn(
    "relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-400 to-teal-600 text-[11px] font-bold text-white",
    chipSurface === "onDark"
      ? "ring-2 ring-[rgba(255,255,255,0.2)] dark:from-amber-500 dark:to-teal-500"
      : "ring-2 ring-white/80 dark:from-amber-500 dark:to-teal-500 dark:ring-zinc-800"
  );

  const chevronClass =
    chipSurface === "onDark"
      ? "h-3.5 w-3.5 shrink-0 text-[var(--market-muted,zinc-400)] transition-transform duration-200"
      : "h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-200 dark:text-zinc-500";

  const labelClass = cn(
    "min-w-0 flex-1 truncate text-sm font-semibold",
    chipSurface === "onDark"
      ? "text-[var(--market-paper-white,white)]"
      : "text-zinc-900 dark:text-white",
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
          <span className="truncate">{item.label}</span>
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
        aria-label={`Account menu for ${label}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        className={cn(triggerClass, buttonClassName)}
      >
        <span className={avatarShell}>
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt=""
              fill
              className="object-cover"
              sizes="32px"
              unoptimized
            />
          ) : (
            initials(label)
          )}
        </span>
        <span className={labelClass}>{label}</span>
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
          aria-label="Account menu"
          onKeyDown={handleMenuKeyDown}
          className={cn(
            "absolute right-0 z-[60] mt-2.5 w-[min(280px,calc(100vw-1.5rem))] origin-top-right animate-[hc-dropdown-in_150ms_ease-out] overflow-hidden rounded-xl border",
            dropdownShellClass(resolvedTone),
            dropdownClassName
          )}
        >
          <div className={cn("px-4 py-3.5", identityBlockClass(resolvedTone))}>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-400 to-teal-600 text-xs font-bold text-white",
                  resolvedTone === "solidDark" && "from-amber-500 to-teal-500"
                )}
              >
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                    unoptimized
                  />
                ) : (
                  initials(label)
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-semibold", identityPrimaryClass(resolvedTone))}>
                  {label}
                </p>
                {user.email ? (
                  <p className={cn("truncate text-xs", identitySecondaryClass(resolvedTone))}>
                    {user.email}
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
              Profile & account
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
                Language & preferences
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
                  Settings
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
                  <LogOut className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  {signingOut ? "Signing out\u2026" : "Sign out"}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
