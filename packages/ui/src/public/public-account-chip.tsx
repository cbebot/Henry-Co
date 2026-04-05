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
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { cn } from "../lib/cn";

export type PublicAccountUser = {
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

const MENU_ITEM_SELECTOR = '[role="menuitem"]:not([disabled])';

export function PublicAccountChip({
  user,
  loginHref,
  accountHref,
  signupHref,
  signupLabel = "Get started",
  menuItems = [],
  preferencesHref,
  showSignOut = false,
  signOutApiPath = "/api/auth/logout",
  signOutRedirectHref,
  className,
  buttonClassName,
  dropdownClassName,
}: {
  user: PublicAccountUser | null;
  loginHref: string;
  accountHref: string;
  signupHref?: string;
  signupLabel?: string;
  menuItems?: { label: string; href: string; external?: boolean }[];
  /** Link to the central preferences page. Renders a "Preferences" item in the dropdown. */
  preferencesHref?: string;
  showSignOut?: boolean;
  signOutApiPath?: string;
  signOutRedirectHref?: string;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
          className={cn(
            "inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-full border border-black/12 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-black/20 hover:bg-zinc-50 active:scale-[0.97] dark:border-white/12 dark:bg-white/8 dark:text-white/90 dark:hover:border-white/20 dark:hover:bg-white/12",
            buttonClassName
          )}
        >
          <LogIn className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          Sign in
        </Link>
        {signupHref ? (
          <Link
            href={signupHref}
            className={cn(
              "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-amber-600/20 bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 active:scale-[0.97] dark:border-amber-400/30 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400",
              buttonClassName
            )}
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

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Account menu for ${label}`}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex max-w-[220px] min-h-[44px] items-center gap-2 rounded-full border border-black/12 bg-white py-1.5 pl-1.5 pr-3 text-left shadow-sm transition hover:border-black/22 hover:shadow-md active:scale-[0.97] dark:border-white/14 dark:bg-zinc-900 dark:hover:border-white/24 dark:hover:shadow-lg",
          buttonClassName
        )}
      >
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-400 to-teal-600 text-[11px] font-bold text-white ring-2 ring-white/80 dark:from-amber-500 dark:to-teal-500 dark:ring-zinc-800">
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
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900 dark:text-white">
          {label}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-200 dark:text-zinc-500",
            open && "rotate-180"
          )}
        />
      </button>

      {open ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Account menu"
          onKeyDown={handleMenuKeyDown}
          className={cn(
            "absolute right-0 z-[60] mt-2.5 w-[280px] origin-top-right animate-[hc-dropdown-in_150ms_ease-out] overflow-hidden rounded-xl border bg-white shadow-xl dark:bg-zinc-900",
            "border-zinc-200 shadow-zinc-900/10 dark:border-zinc-700/80 dark:shadow-black/40",
            dropdownClassName
          )}
        >
          {/* ── Identity row ── */}
          <div className="border-b border-zinc-100 px-4 py-3.5 dark:border-zinc-700/60">
            <div className="flex items-center gap-3">
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-400 to-teal-600 text-xs font-bold text-white dark:from-amber-500 dark:to-teal-500">
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
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                  {label}
                </p>
                {user.email ? (
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {user.email}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* ── Menu items ── */}
          <div className="py-1.5">
            <Link
              href={accountHref}
              role="menuitem"
              tabIndex={0}
              className="mx-1.5 flex min-h-[40px] items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 outline-none transition-colors hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-amber-500/40 dark:text-zinc-200 dark:hover:bg-white/8 dark:focus-visible:bg-white/8"
              onClick={close}
            >
              <LayoutDashboard
                className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500"
                aria-hidden
              />
              Profile & account
            </Link>

            {preferencesHref ? (
              <Link
                href={preferencesHref}
                role="menuitem"
                tabIndex={0}
                className="mx-1.5 flex min-h-[40px] items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 outline-none transition-colors hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-amber-500/40 dark:text-zinc-200 dark:hover:bg-white/8 dark:focus-visible:bg-white/8"
                onClick={close}
              >
                <Globe
                  className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500"
                  aria-hidden
                />
                Language & preferences
              </Link>
            ) : null}

            {menuItems.length > 0 ? (
              <div
                role="separator"
                className="mx-4 my-1.5 h-px bg-zinc-100 dark:bg-zinc-700/50"
              />
            ) : null}

            {menuItems.map((item) =>
              item.external ? (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  role="menuitem"
                  tabIndex={0}
                  className="mx-1.5 flex min-h-[40px] items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 outline-none transition-colors hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-amber-500/40 dark:text-zinc-200 dark:hover:bg-white/8 dark:focus-visible:bg-white/8"
                  onClick={close}
                >
                  {item.label}
                  <ExternalLink
                    className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600"
                    aria-hidden
                  />
                </a>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  role="menuitem"
                  tabIndex={0}
                  className="mx-1.5 flex min-h-[40px] items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 outline-none transition-colors hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-amber-500/40 dark:text-zinc-200 dark:hover:bg-white/8 dark:focus-visible:bg-white/8"
                  onClick={close}
                >
                  {item.label}
                </Link>
              )
            )}
          </div>

          {/* ── Sign out ── */}
          {showSignOut ? (
            <div className="border-t border-zinc-100 py-1.5 dark:border-zinc-700/60">
              <button
                type="button"
                role="menuitem"
                tabIndex={0}
                disabled={signingOut}
                className="mx-1.5 flex w-[calc(100%-0.75rem)] min-h-[40px] items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 outline-none transition-colors hover:bg-red-50 focus-visible:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500/40 disabled:cursor-wait disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10 dark:focus-visible:bg-red-500/10"
                onClick={() => {
                  close();
                  void handleSignOut();
                }}
              >
                <LogOut
                  className="h-4 w-4 shrink-0 opacity-70"
                  aria-hidden
                />
                {signingOut ? "Signing out\u2026" : "Sign out"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
