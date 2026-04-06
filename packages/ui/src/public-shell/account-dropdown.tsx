"use client";

/**
 * AccountDropdown — standalone dropdown panel that can be composed
 * independently of AccountChip when sites need custom trigger UI.
 * Internally this re-exports the dropdown portion of PublicAccountChip's logic.
 *
 * For most public sites, use PublicAccountChip directly (which includes both
 * the chip trigger and the dropdown). This component is for advanced composition
 * when the trigger is custom but the dropdown should match the HenryCo standard.
 */

import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import Link from "next/link";
import { ExternalLink, LayoutDashboard, Globe, LogOut, Settings2 } from "lucide-react";
import { cn } from "../lib/cn";
import { AvatarFallback } from "./avatar-fallback";
import { resolvePublicAccountIdentity } from "../public/account-identity";
import type { PublicAccountUser, PublicAccountMenuItem } from "../public/public-account-chip";

type DropdownTone = "theme" | "solidDark" | "solidLight";
const MENU_ITEM_SELECTOR = '[role="menuitem"]:not([disabled])';

function toneShell(tone: DropdownTone) {
  switch (tone) {
    case "solidDark":
      return "border border-zinc-700 bg-[#0c0e14] text-zinc-100 shadow-[0_28px_90px_-12px_rgba(0,0,0,0.85),0_12px_32px_rgba(0,0,0,0.55)]";
    case "solidLight":
      return "border border-zinc-200/90 bg-white text-zinc-900 shadow-[0_22px_56px_-14px_rgba(15,23,42,0.2),0_8px_20px_rgba(15,23,42,0.08)]";
    default:
      return "border border-zinc-200/90 bg-white text-zinc-900 shadow-[0_22px_56px_-14px_rgba(15,23,42,0.16),0_8px_20px_rgba(15,23,42,0.06)] dark:border-zinc-700 dark:bg-[#0c0e14] dark:text-zinc-100 dark:shadow-[0_28px_90px_-12px_rgba(0,0,0,0.82),0_12px_32px_rgba(0,0,0,0.5)]";
  }
}

function toneIdentity(tone: DropdownTone) {
  switch (tone) {
    case "solidDark":
      return "border-b border-zinc-800 bg-[#10131c]";
    case "solidLight":
      return "border-b border-zinc-200 bg-zinc-50";
    default:
      return "border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-[#10131c]";
  }
}

function toneRow(tone: DropdownTone) {
  switch (tone) {
    case "solidDark":
      return "text-zinc-200 hover:bg-zinc-800/90 focus-visible:bg-zinc-800/90 focus-visible:ring-2 focus-visible:ring-amber-400/30";
    case "solidLight":
      return "text-zinc-800 hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-amber-600/25";
    default:
      return "text-zinc-700 hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-amber-500/30 dark:text-zinc-200 dark:hover:bg-zinc-800/80 dark:focus-visible:bg-zinc-800/80 dark:focus-visible:ring-amber-400/28";
  }
}

function toneSep(tone: DropdownTone) {
  switch (tone) {
    case "solidDark": return "bg-zinc-700/70";
    case "solidLight": return "bg-zinc-200";
    default: return "bg-zinc-200 dark:bg-zinc-700/60";
  }
}

function tonePrimary(tone: DropdownTone) {
  switch (tone) {
    case "solidDark": return "text-white";
    case "solidLight": return "text-zinc-900";
    default: return "text-zinc-900 dark:text-white";
  }
}

function toneSecondary(tone: DropdownTone) {
  switch (tone) {
    case "solidDark": return "text-zinc-400";
    case "solidLight": return "text-zinc-600";
    default: return "text-zinc-600 dark:text-zinc-400";
  }
}

function toneFooter(tone: DropdownTone) {
  switch (tone) {
    case "solidDark":
      return "border-t border-zinc-800 bg-[#0c0e14]";
    case "solidLight":
      return "border-t border-zinc-200 bg-white";
    default:
      return "border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0c0e14]";
  }
}

function isAction(item: PublicAccountMenuItem): item is { label: string; onClick: () => void; icon?: ReactNode; badge?: ReactNode } {
  return typeof (item as { onClick?: unknown }).onClick === "function";
}

export function AccountDropdown({
  user,
  accountHref,
  preferencesHref,
  settingsHref,
  menuItems = [],
  showSignOut = false,
  signOutApiPath = "/api/auth/logout",
  signOutRedirectHref,
  tone = "theme",
  open,
  onClose,
  className,
}: {
  user: PublicAccountUser;
  accountHref: string;
  preferencesHref?: string;
  settingsHref?: string;
  menuItems?: PublicAccountMenuItem[];
  showSignOut?: boolean;
  signOutApiPath?: string;
  signOutRedirectHref?: string;
  tone?: DropdownTone;
  open: boolean;
  onClose: () => void;
  className?: string;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const { primaryLabel, emailLine, initialsSource } = resolvePublicAccountIdentity(user);

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!open || !menuRef.current) return;
    const first = menuRef.current.querySelector<HTMLElement>(MENU_ITEM_SELECTOR);
    first?.focus();
  }, [open]);

  function handleKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    const menu = menuRef.current;
    if (!menu) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const items = Array.from(menu.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR));
      if (!items.length) return;
      const current = items.indexOf(document.activeElement as HTMLElement);
      let next: number;
      if (e.key === "ArrowDown") next = current < items.length - 1 ? current + 1 : 0;
      else next = current > 0 ? current - 1 : items.length - 1;
      items[next]?.focus();
    }
    if (e.key === "Tab" || e.key === "Escape") close();
  }

  async function handleSignOut() {
    try { await fetch(signOutApiPath, { method: "POST", credentials: "include", headers: { Accept: "application/json" } }); } catch { /* still redirect */ }
    finally { window.location.assign(signOutRedirectHref || (typeof window !== "undefined" ? `${window.location.origin}/` : "/")); }
  }

  if (!open) return null;

  const rowBase = cn(
    "mx-1.5 flex min-h-[40px] items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors",
    toneRow(tone)
  );
  const iconDim = tone === "solidDark" ? "text-zinc-500" : "text-zinc-400 dark:text-zinc-500";

  function renderItem(item: PublicAccountMenuItem) {
    const content = (
      <>
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          {item.icon ? <span className="shrink-0 opacity-80 [&_svg]:h-4 [&_svg]:w-4">{item.icon}</span> : null}
          <span className="truncate">{item.label}</span>
        </span>
        {item.badge ? <span className="shrink-0 text-xs font-semibold tabular-nums">{item.badge}</span> : null}
      </>
    );
    if (isAction(item)) {
      return (
        <button key={item.label} type="button" role="menuitem" tabIndex={0} className={cn(rowBase, "w-[calc(100%-0.75rem)] justify-between text-left")} onClick={() => { close(); item.onClick(); }}>
          {content}
        </button>
      );
    }
    const link = item as { href: string; external?: boolean; label: string; icon?: ReactNode; badge?: ReactNode };
    if (link.external) {
      return (
        <a key={link.label} href={link.href} target="_blank" rel="noreferrer" role="menuitem" tabIndex={0} className={cn(rowBase, "justify-between")} onClick={close}>
          {content}
          <ExternalLink className={cn("h-3.5 w-3.5 shrink-0", tone === "solidDark" ? "text-zinc-500" : "text-zinc-300 dark:text-zinc-600")} aria-hidden />
        </a>
      );
    }
    return (
      <Link key={link.label} href={link.href} role="menuitem" tabIndex={0} className={cn(rowBase, link.badge ? "justify-between" : "")} onClick={close}>
        {content}
      </Link>
    );
  }

  return (
    <div
      ref={menuRef}
      id={menuId}
      role="menu"
      aria-label="Account menu"
      onKeyDown={handleKeyDown}
      className={cn(
        "absolute right-0 z-[60] mt-2.5 w-[min(280px,calc(100vw-1.5rem))] origin-top-right animate-[hc-dropdown-in_150ms_ease-out] overflow-hidden rounded-xl border",
        toneShell(tone),
        className
      )}
    >
      <div className={cn("px-4 py-4", toneIdentity(tone))}>
        <div className="flex items-start gap-3.5">
          <AvatarFallback
            src={user.avatarUrl}
            displayName={initialsSource}
            size="md"
            className={cn(
              tone === "solidDark" && "ring-2 ring-zinc-700 from-amber-500 to-teal-600"
            )}
          />
          <div className="min-w-0 flex-1 pt-0.5">
            <p
              className={cn(
                "truncate text-[15px] font-semibold leading-snug tracking-[-0.015em]",
                tonePrimary(tone)
              )}
            >
              {primaryLabel}
            </p>
            {emailLine ? (
              <p
                className={cn(
                  "mt-1 truncate text-[12px] font-medium leading-normal",
                  toneSecondary(tone)
                )}
              >
                {emailLine}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="py-1.5">
        <Link href={accountHref} role="menuitem" tabIndex={0} className={rowBase} onClick={close}>
          <LayoutDashboard className={cn("h-4 w-4 shrink-0", iconDim)} aria-hidden /> Profile & account
        </Link>
        {preferencesHref ? (
          <Link href={preferencesHref} role="menuitem" tabIndex={0} className={rowBase} onClick={close}>
            <Globe className={cn("h-4 w-4 shrink-0", iconDim)} aria-hidden /> Language & preferences
          </Link>
        ) : null}
        {menuItems.length > 0 ? <div role="separator" className={cn("mx-4 my-1.5 h-px", toneSep(tone))} /> : null}
        {menuItems.map(renderItem)}
      </div>
      {(settingsHref || showSignOut) ? (
        <div className={cn("py-1.5", toneFooter(tone))}>
          {settingsHref ? (
            <Link href={settingsHref} role="menuitem" tabIndex={0} className={rowBase} onClick={close}>
              <Settings2 className={cn("h-4 w-4 shrink-0", iconDim)} aria-hidden /> Settings
            </Link>
          ) : null}
          {showSignOut ? (
            <button
              type="button"
              role="menuitem"
              tabIndex={0}
              className={cn(
                "mx-1.5 flex w-[calc(100%-0.75rem)] min-h-[40px] items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 outline-none transition-colors hover:bg-red-50 focus-visible:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500/40 dark:text-red-400 dark:hover:bg-red-500/12 dark:focus-visible:bg-red-500/12 dark:focus-visible:ring-red-400/35",
                tone === "solidDark" && "text-red-400 hover:bg-red-500/12 focus-visible:bg-red-500/12"
              )}
              onClick={() => { close(); void handleSignOut(); }}
            >
              <LogOut className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              Sign out
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
