"use client";

/**
 * DrawerAccountSection — premium in-place expanded profile section
 * for use inside the mobile public drawer (`PublicHeader`'s mobile
 * BottomSheet) and any other large-form sheet that wants a complete
 * profile-card surface instead of a chip + nested-dropdown pattern.
 *
 * Why this exists (FIX-CHROME-02)
 * -------------------------------
 *
 * On mobile, the `PublicAccountChip` rendered inside the public drawer
 * is a chip-with-dropdown — tapping it opens a fixed-positioned
 * 320px-wide menu pinned to the chip's measured bottom-Y. Inside a
 * `BottomSheet` (portal-mounted at document.body), this:
 *
 *   1. Adds a second floating layer above the sheet. The chip's
 *      outside-click handler listens on `document` and can fire on
 *      taps INSIDE the sheet but OUTSIDE the chip, closing the
 *      dropdown before any tap can register.
 *   2. Re-anchors via a one-shot `getBoundingClientRect()` of the
 *      chip — if the user scrolls the drawer's inner scroll
 *      container, the measured Y is stale and the dropdown drifts
 *      relative to the chip.
 *   3. Asks the user to manage two mental models (sheet vs. menu)
 *      for one profile concept.
 *
 * The in-place card here removes all three problems. The drawer
 * IS the profile panel; there is no nested floating layer.
 *
 * Behaviour
 * ---------
 *
 *   - Signed-in: avatar + display name + email + grouped menu
 *     (Account, Workspace, Sign out).
 *   - Signed-out: a calm two-button row (Sign in / Get started)
 *     with the same tap-target rules.
 *   - Every link uses the `onSelect` callback the caller provides
 *     for sheet dismissal — typically `dismissAfterNavigation` from
 *     `PublicHeader` which defers `setOpen(false)` to the next
 *     paint so it can't race the App Router's async transition.
 *   - All strings route through `translateSurfaceLabel(locale, ...)`
 *     or `surfaceCopy.publicAccount.*` so V3-07 strict gate stays
 *     green — no new hardcoded JSX text.
 *
 * Visual contract
 * ---------------
 *
 *   - Tap targets ≥48px tall, ≥44px wide (iOS HIG with some buffer).
 *   - Hairline group separators only — no heavy chrome.
 *   - Two-line identity block: name (15px semibold) over email
 *     (12px medium, muted).
 *   - Optional `accent` dot to indicate the active division (caller
 *     decides whether to pass an accent — typically the division's
 *     `accentStrong` hex).
 *   - `motion-reduce:transition-none` on the sign-out spinner.
 *
 * SHIPS WITH FIX-CHROME-02; backward compatible — net-new component,
 * no existing import paths change.
 */

import { useCallback, useState, type ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard, LogIn, LogOut, Globe, Settings2, UserPlus } from "lucide-react";
import { getSurfaceCopy, translateSurfaceLabel } from "@henryco/i18n";
import { useOptionalHenryCoLocale } from "@henryco/i18n/react";
import { cn } from "../lib/cn";
import { ButtonPendingContent } from "../loading/ButtonPendingContent";
import { AvatarFallback } from "../public-shell/avatar-fallback";
import { resolvePublicAccountIdentity, type PublicAccountUser } from "./public-account-chip";

export type DrawerAccountSectionProps = {
  /** Signed-in user, or null/undefined for the guest CTA row. */
  user: PublicAccountUser | null | undefined;
  /** Where "Profile & account" links to. Required when signed-in. */
  accountHref?: string;
  /** Where the language/preferences row links to. */
  preferencesHref?: string;
  /** Where the settings row links to. */
  settingsHref?: string;
  /** Guest "Sign in" target. Required when signed-out. */
  loginHref?: string;
  /** Guest "Get started" target. */
  signupHref?: string;
  /** Optional override for the guest signup label. */
  signupLabel?: string;
  /** Show the sign-out row at the bottom. */
  showSignOut?: boolean;
  /** API endpoint to POST sign-out to. */
  signOutApiPath?: string;
  /** Where to redirect after sign-out. */
  signOutRedirectHref?: string;
  /**
   * Optional callback fired whenever a row is selected (link tap,
   * action button). Used by the PublicHeader to defer-close the
   * drawer (rAF defer beats the App Router transition race —
   * see FIX-CHROME-02 RCA).
   */
  onSelect?: () => void;
  /**
   * Optional division accent hex. When provided, renders a small dot
   * next to the display name signalling which division the user is
   * currently inside ("Henry • Property").
   */
  accent?: string | null;
  /**
   * Optional caller-provided menu items (extra rows inserted between
   * the standard "Profile" group and "Settings" / "Sign out"). Each
   * item is rendered with the same tap-target rules.
   */
  extraItems?: Array<{
    label: string;
    href: string;
    icon?: ReactNode;
    external?: boolean;
  }>;
  className?: string;
};

export function DrawerAccountSection({
  user,
  accountHref,
  preferencesHref,
  settingsHref,
  loginHref,
  signupHref,
  signupLabel = "Get started",
  showSignOut = false,
  signOutApiPath = "/api/auth/logout",
  signOutRedirectHref,
  onSelect,
  accent,
  extraItems = [],
  className,
}: DrawerAccountSectionProps) {
  const locale = useOptionalHenryCoLocale() ?? "en";
  const surfaceCopy = getSurfaceCopy(locale);
  const localize = (label: string) => translateSurfaceLabel(locale, label);
  const [signingOut, setSigningOut] = useState(false);

  const dismiss = useCallback(() => {
    if (onSelect) onSelect();
  }, [onSelect]);

  const handleSignOut = useCallback(async () => {
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
  }, [signOutApiPath, signOutRedirectHref, signingOut]);

  // ── Guest (signed-out) state ─────────────────────────────────────
  if (!user) {
    return (
      <section
        aria-label={surfaceCopy.publicAccount.accountMenu}
        className={cn(
          "rounded-2xl border border-white/10 bg-white/[0.02] p-4",
          "dark:border-white/8 dark:bg-white/[0.03]",
          className
        )}
      >
        <p className="px-1 pb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
          {surfaceCopy.publicHeader.account}
        </p>
        <div className="flex flex-col gap-2">
          {loginHref ? (
            <Link
              href={loginHref}
              onClick={dismiss}
              aria-label={surfaceCopy.publicAccount.signInAria}
              className={cn(
                "flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-zinc-200/90 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm",
                "outline-none transition active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-500/55 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                "dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-amber-400/50 dark:focus-visible:ring-offset-zinc-950"
              )}
            >
              <LogIn className="h-4 w-4 shrink-0 opacity-75" aria-hidden />
              {localize("Sign in")}
            </Link>
          ) : null}
          {signupHref ? (
            <Link
              href={signupHref}
              onClick={dismiss}
              aria-label={surfaceCopy.publicAccount.signUpAria}
              className={cn(
                "flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-amber-600/25 bg-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-sm",
                "outline-none transition active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-500/55 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                "hover:bg-amber-700 dark:border-amber-400/30 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 dark:focus-visible:ring-amber-400/55 dark:focus-visible:ring-offset-zinc-950"
              )}
            >
              <UserPlus className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {localize(signupLabel)}
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  // ── Signed-in state ──────────────────────────────────────────────
  const { primaryLabel, emailLine, initialsSource } = resolvePublicAccountIdentity(user);

  const rowClass = cn(
    "group flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
    "text-zinc-100 outline-none transition-colors active:scale-[0.995]",
    "hover:bg-white/[0.05] focus-visible:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-amber-400/55"
  );

  const iconDim = "text-zinc-400 group-hover:text-zinc-300";

  return (
    <section
      aria-label={surfaceCopy.publicAccount.accountMenu}
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.02]",
        "dark:border-white/8 dark:bg-white/[0.03]",
        className
      )}
    >
      {/* Kicker */}
      <p className="px-4 pt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
        {surfaceCopy.publicHeader.account}
      </p>

      {/* Identity row */}
      <div className="flex items-start gap-3 px-4 pb-3 pt-2">
        <AvatarFallback
          src={user.avatarUrl}
          displayName={initialsSource}
          size="md"
          className="ring-2 ring-white/10"
        />
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="flex items-center gap-1.5 truncate text-[15px] font-semibold leading-snug tracking-[-0.015em] text-white">
            {accent ? (
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full shadow-[0_0_0_2px_rgba(0,0,0,0.35)]"
                style={{ backgroundColor: accent }}
              />
            ) : null}
            <span className="truncate">{primaryLabel}</span>
          </p>
          {emailLine ? (
            <p className="mt-1 truncate text-[12px] font-medium leading-normal text-zinc-400">
              {emailLine}
            </p>
          ) : null}
        </div>
      </div>

      {/* Account group */}
      <div className="border-t border-white/8 px-1.5 py-1.5">
        {accountHref ? (
          <Link
            href={accountHref}
            onClick={dismiss}
            role="menuitem"
            tabIndex={0}
            className={rowClass}
          >
            <LayoutDashboard className={cn("h-4 w-4 shrink-0", iconDim)} aria-hidden />
            <span className="truncate">{localize("Profile & account")}</span>
          </Link>
        ) : null}
        {preferencesHref ? (
          <Link
            href={preferencesHref}
            onClick={dismiss}
            role="menuitem"
            tabIndex={0}
            className={rowClass}
          >
            <Globe className={cn("h-4 w-4 shrink-0", iconDim)} aria-hidden />
            <span className="truncate">{localize("Language & preferences")}</span>
          </Link>
        ) : null}
      </div>

      {/* Extra items (caller-provided) */}
      {extraItems.length > 0 ? (
        <div className="border-t border-white/8 px-1.5 py-1.5">
          {extraItems.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                onClick={dismiss}
                role="menuitem"
                tabIndex={0}
                className={rowClass}
              >
                {item.icon ? (
                  <span className={cn("shrink-0 [&_svg]:h-4 [&_svg]:w-4", iconDim)}>
                    {item.icon}
                  </span>
                ) : null}
                <span className="truncate">{localize(item.label)}</span>
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                onClick={dismiss}
                role="menuitem"
                tabIndex={0}
                className={rowClass}
              >
                {item.icon ? (
                  <span className={cn("shrink-0 [&_svg]:h-4 [&_svg]:w-4", iconDim)}>
                    {item.icon}
                  </span>
                ) : null}
                <span className="truncate">{localize(item.label)}</span>
              </Link>
            )
          )}
        </div>
      ) : null}

      {/* Settings + sign out */}
      {settingsHref || showSignOut ? (
        <div className="border-t border-white/8 px-1.5 py-1.5">
          {settingsHref ? (
            <Link
              href={settingsHref}
              onClick={dismiss}
              role="menuitem"
              tabIndex={0}
              className={rowClass}
            >
              <Settings2 className={cn("h-4 w-4 shrink-0", iconDim)} aria-hidden />
              <span className="truncate">{localize("Settings")}</span>
            </Link>
          ) : null}
          {showSignOut ? (
            <button
              type="button"
              role="menuitem"
              tabIndex={0}
              disabled={signingOut}
              onClick={() => {
                dismiss();
                void handleSignOut();
              }}
              className={cn(
                "flex w-full min-h-[48px] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-400",
                "outline-none transition-colors motion-reduce:transition-none",
                "hover:bg-red-500/10 focus-visible:bg-red-500/12 focus-visible:ring-2 focus-visible:ring-red-400/45",
                "disabled:cursor-wait disabled:opacity-60"
              )}
            >
              <ButtonPendingContent
                pending={signingOut}
                pendingLabel={surfaceCopy.publicAccount.signingOut}
                spinnerLabel={surfaceCopy.publicAccount.signOut}
              >
                <>
                  <LogOut className="h-4 w-4 shrink-0 opacity-85" aria-hidden />
                  <span className="truncate">{surfaceCopy.publicAccount.signOut}</span>
                </>
              </ButtonPendingContent>
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
