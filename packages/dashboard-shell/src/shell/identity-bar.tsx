"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Search, LogOut } from "lucide-react";
import type { DashboardOption, DashboardRole, UnifiedViewer } from "@henryco/auth";

import { useHenryCoLocale } from "@henryco/i18n/react";
import { getDashboardShellCopy, type DashboardShellCopy } from "@henryco/i18n";
import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";
import { RADIUS, SPACING } from "../tokens/spacing";
import { focusVisibleStyle } from "../tokens/focus";
import { Chip } from "../components/chip";
import { Badge } from "../components/badge";

/**
 * IdentityBar — top-of-shell chrome row.
 *
 * Shows: avatar + name + role pill, role switcher (when the viewer has
 * multiple lanes), search trigger (UI only in DASH-1; DASH-5 wires
 * Cmd+K), theme toggle slot (host-app provided), sign-out menu.
 *
 * The role switcher is the canonical contract test for V2-AUTH-RT-01:
 * it consumes `DashboardOption[]` from `loadDashboardOptions(user)` —
 * the SAME function the chooser POST handler uses for defense-in-depth
 * validation. Diverging the role logic would recreate the
 * fragmentation V2-AUTH-RT-01 fixed; this client component simply
 * presents the options the server prepared.
 *
 * Cookie write goes through `setDashboardPreference()` from
 * `@henryco/auth/cookies` (server action), invoked via the role-switcher
 * form's `action` prop. DASH-1 ships the form scaffolding; the actual
 * preference-then-redirect cycle is wired in via the `onSelectOption`
 * server action that the parent supplies.
 */
export type IdentityBarProps = {
  viewer: UnifiedViewer;
  /**
   * Options for the role switcher. Pass an empty array (or omit) to
   * disable the switcher entirely (single-lane users).
   */
  options?: ReadonlyArray<DashboardOption>;
  /**
   * Server action invoked when the user picks a lane. The server
   * action should call `setDashboardPreference(option.key)` and then
   * `redirect(option.href)`.
   */
  onSelectOption?: (key: DashboardOption["key"]) => void;
  /**
   * Optional search trigger handler. DASH-1 leaves this empty so the
   * button renders without a working palette; DASH-5 wires the
   * Cmd+K palette here.
   */
  onSearchClick?: () => void;
  /**
   * Server action invoked when the user signs out. The signout
   * action should clear the session + the preference cookie, then
   * redirect.
   */
  onSignOut?: () => void;
  /**
   * Trailing slot — host apps pass their existing ThemeToggle here
   * so the shell doesn't introduce a second theme provider.
   */
  trailing?: ReactNode;
  /**
   * Notifications trigger slot — DASH-6 mount point. Host apps pass the
   * shell-wide `<NotificationsBell>` (or `<ContextDrawer>` button) here.
   * The trigger owns its own badge; IdentityBar no longer renders the
   * unread count inline when this slot is set.
   */
  notificationsTrigger?: ReactNode;
  /**
   * Legacy unread notification count — kept for back-compat with DASH-1
   * callers. New callers (DASH-6+) pass `notificationsTrigger` with a
   * self-managed bell. When both are set, the trigger wins.
   */
  unreadCount?: number;
};

export function IdentityBar({
  viewer,
  options,
  onSelectOption,
  onSearchClick,
  onSignOut,
  trailing,
  notificationsTrigger,
  unreadCount,
}: IdentityBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const copy = getDashboardShellCopy(useHenryCoLocale());
  const showSwitcher = (options?.length ?? 0) > 1;

  const initials = (viewer.user.fullName ?? viewer.user.email ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <header
      style={{
        height: SPACING.chrome.identityBarHeight,
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0 1rem",
        borderBottom: `1px solid var(${CSS_VARS.hairline})`,
        backgroundColor: `var(${CSS_VARS.surface})`,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Avatar + identity */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
        <div
          aria-hidden
          style={{
            width: "2.25rem",
            height: "2.25rem",
            borderRadius: RADIUS.pill,
            backgroundColor: `var(${CSS_VARS.accentSoft})`,
            color: `var(${CSS_VARS.accentText})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...typeStyle("bodyStrong"),
            flexShrink: 0,
          }}
        >
          {viewer.user.avatarUrl ? (
            // Use the avatarUrl as a CSS background so the IdentityBar
            // doesn't pull in next/image client-side. The host app's
            // existing avatar URL pattern (Cloudinary / Supabase
            // Storage) renders fine via background-image.
            <span
              style={{
                width: "100%",
                height: "100%",
                borderRadius: RADIUS.pill,
                backgroundImage: `url(${viewer.user.avatarUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          ) : (
            initials || "·"
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              ...typeStyle("bodyStrong"),
              color: `var(${CSS_VARS.ink})`,
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {viewer.user.fullName || viewer.user.email || copy.identityBar.viewerFallback}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.15rem" }}>
            <Chip tone={chipToneForRole(viewer.role)}>{labelForRole(viewer.role, copy)}</Chip>
          </div>
        </div>
      </div>

      {/* Search trigger */}
      <button
        type="button"
        onClick={onSearchClick}
        aria-label={copy.identityBar.searchAria}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.45rem 0.85rem",
          borderRadius: RADIUS.pill,
          border: `1px solid var(${CSS_VARS.hairline})`,
          backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
          color: `var(${CSS_VARS.inkSoft})`,
          cursor: "pointer",
          ...typeStyle("small"),
          ...focusVisibleStyle(),
        }}
      >
        <Search size={14} aria-hidden />
        <span>{copy.identityBar.searchLabel}</span>
        {/* TODO V2-COPY-01: review search prompt */}
      </button>

      {/* Notifications trigger — DASH-6 mount point.
          Host passes <NotificationsBell> or <ContextDrawer>;
          legacy `unreadCount` falls through if no trigger supplied. */}
      {notificationsTrigger ?? (
        typeof unreadCount === "number" && unreadCount > 0 ? (
          <Badge value={unreadCount} tone="urgent" />
        ) : null
      )}

      {/* Role switcher */}
      {showSwitcher && options ? (
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.4rem 0.7rem",
              borderRadius: RADIUS.pill,
              border: `1px solid var(${CSS_VARS.hairline})`,
              backgroundColor: `var(${CSS_VARS.surface})`,
              color: `var(${CSS_VARS.ink})`,
              cursor: "pointer",
              ...typeStyle("small"),
              ...focusVisibleStyle(),
            }}
          >
            {copy.identityBar.switchLane} <ChevronDown size={14} aria-hidden />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              style={{
                position: "absolute",
                top: "calc(100% + 0.5rem)",
                right: 0,
                minWidth: "16rem",
                backgroundColor: `var(${CSS_VARS.surface})`,
                border: `1px solid var(${CSS_VARS.hairline})`,
                borderRadius: RADIUS.lg,
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                padding: "0.5rem",
                zIndex: 200,
              }}
            >
              {options.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onSelectOption?.(opt.key);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "0.65rem 0.75rem",
                    background: "transparent",
                    border: "none",
                    borderRadius: RADIUS.md,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <p style={{ ...typeStyle("bodyStrong"), color: `var(${CSS_VARS.ink})`, margin: 0 }}>
                    {opt.title}
                  </p>
                  <p style={{ ...typeStyle("small"), color: `var(${CSS_VARS.inkSoft})`, margin: 0 }}>
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {trailing}

      {/* Sign out — DASH-7 G7: promoted to ≥ 44 × 44 px tap target so
          shell chrome reads premium uniformly with BottomActionBar. */}
      {onSignOut ? (
        <button
          type="button"
          onClick={onSignOut}
          aria-label={copy.identityBar.signOut}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: `var(${CSS_VARS.inkSoft})`,
            minWidth: "44px",
            minHeight: "44px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: RADIUS.pill,
            ...focusVisibleStyle(),
          }}
        >
          <LogOut size={18} aria-hidden />
        </button>
      ) : null}
    </header>
  );
}

function labelForRole(role: DashboardRole, copy: DashboardShellCopy): string {
  switch (role) {
    case "customer":
      return copy.identityBar.roleCustomer;
    case "staff":
      return copy.identityBar.roleStaff;
    case "division_operator":
      return copy.identityBar.roleOperator;
    case "super_admin":
      return copy.identityBar.roleOwner;
  }
}

function chipToneForRole(role: DashboardRole): "accent" | "neutral" {
  return role === "super_admin" || role === "staff" || role === "division_operator"
    ? "accent"
    : "neutral";
}
