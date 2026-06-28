"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Search, LogOut } from "lucide-react";
import type { DashboardOption, DashboardRole, UnifiedViewer } from "@henryco/auth";

import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";
import { RADIUS, SPACING } from "../tokens/spacing";
import { EASE_OUT } from "../tokens/motion";
import { focusVisibleStyle } from "../tokens/focus";
import { Chip } from "../components/chip";
import { Badge } from "../components/badge";

/**
 * IdentityBar — top-of-shell chrome row.
 *
 * V3-IDENTITY-CHROME — reworked from a single fragile flex row (which
 * overflowed horizontally on ~390px phones, clipping the avatar and
 * collapsing the name) into a breakpoint-aware composition:
 *
 *   • Mobile (< 768px): two tiers. Tier 1 is the avatar (the identity
 *     anchor + tap target) and the always-on controls (notifications +
 *     the host's trailing slot, e.g. theme toggle). Tier 2 is a
 *     full-width search that opens the command palette. Lane-switching
 *     and sign-out fold into the avatar "peek" so the top row breathes.
 *   • Desktop (≥ 768px): one refined row — avatar + name/role, a
 *     flexible search, then the control cluster (notifications, lane
 *     switcher, trailing, sign-out).
 *
 * The avatar is a peek trigger on every breakpoint: tapping it opens a
 * compact account menu that springs from the avatar's origin with a
 * one-shot accent-ring pulse. Motion honours the shell standard
 * (`tokens/motion.ts`): a calm `EASE_OUT` fade + soft-scale — never a
 * bouncy spring on chrome — and collapses to opacity-only under
 * `prefers-reduced-motion`.
 *
 * Shared by BOTH the customer account shell (`apps/account`, via
 * `IdentityBarPaletteBridge`) and the staff shell (`StaffShell`), so
 * every surface here reads `--hc-*` tokens and never hardcodes a theme
 * or a brand string.
 *
 * The role switcher is the canonical contract test for V2-AUTH-RT-01:
 * it consumes `DashboardOption[]` from `loadDashboardOptions(user)` —
 * the SAME function the chooser POST handler uses for defense-in-depth
 * validation.
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
   * Optional search trigger handler. When omitted the search affordance
   * is hidden entirely (e.g. the staff shell, which wires no palette),
   * so the bar never shows a dead control.
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
   */
  notificationsTrigger?: ReactNode;
  /**
   * Legacy unread notification count — kept for back-compat with DASH-1
   * callers. When both are set, the trigger wins.
   */
  unreadCount?: number;
};

/**
 * Self-contained chrome CSS. Inline styles can't express media queries,
 * pseudo-classes, or keyframes, so the bar ships its own `<style>` and
 * never relies on the host injecting anything. Class hooks (`hc-idbar*`)
 * are namespaced so they can't collide with division-local rules.
 *
 * The flex-wrap trick is what makes the search drop to its own full-
 * width tier on phones (`flex:0 0 100%` forces a wrap) and sit inline
 * on desktop (`flex:1 1 auto`), all from a single rendered button.
 */
const IDENTITY_BAR_CSS = `
.hc-idbar{
  position:sticky; top:0; z-index:100;
  display:grid; grid-template-columns:auto minmax(0, 1fr);
  grid-template-areas:"profile controls" "search search";
  align-items:center; gap:0.55rem 0.65rem; padding:0.55rem 0.75rem 0.65rem;
  border-bottom:1px solid var(${CSS_VARS.hairline});
  background:
    linear-gradient(180deg, color-mix(in oklab, var(${CSS_VARS.surface}) 96%, transparent), var(${CSS_VARS.surface})),
    var(${CSS_VARS.surface});
  box-shadow:0 8px 26px color-mix(in oklab, var(${CSS_VARS.ink}) 8%, transparent);
  backdrop-filter:blur(18px);
}
.hc-idbar__avatarwrap{
  grid-area:profile; position:relative; display:inline-flex; flex-shrink:0;
  width:max-content; padding:0.16rem; border-radius:9999px;
  border:1px solid color-mix(in oklab, var(${CSS_VARS.accent}) 34%, var(${CSS_VARS.hairline}));
  background:
    radial-gradient(circle at 30% 20%, color-mix(in oklab, var(${CSS_VARS.accent}) 30%, transparent), transparent 58%),
    color-mix(in oklab, var(${CSS_VARS.surfaceElevated}) 88%, transparent);
  box-shadow:0 12px 30px color-mix(in oklab, var(${CSS_VARS.ink}) 14%, transparent);
}
.hc-idbar__name{ display:none; min-width:0; }
.hc-idbar__controls{
  grid-area:controls; justify-self:end; min-width:0;
  display:inline-flex; align-items:center; gap:0.35rem;
}
.hc-idbar__search{ grid-area:search; display:flex; min-width:0; }
.hc-idbar__searchbtn{ width:100%; }
.hc-idbar__deskonly{ display:none !important; }
@media (min-width:768px){
  .hc-idbar{
    display:flex; flex-wrap:nowrap; gap:0.75rem; padding:0 1rem;
    min-height:${SPACING.chrome.identityBarHeight}; box-shadow:none; backdrop-filter:none;
  }
  .hc-idbar__avatarwrap{
    order:1; padding:0; border:none; background:transparent; box-shadow:none;
  }
  .hc-idbar__name{ display:block; }
  .hc-idbar__search{ order:3; flex:1 1 auto; justify-content:flex-end; }
  .hc-idbar__searchbtn{ width:auto; min-width:13rem; max-width:24rem; }
  .hc-idbar__controls{ order:4; margin-left:0; }
  .hc-idbar__deskonly{ display:inline-flex !important; }
}

/* Lively, calm avatar interaction. */
.hc-idbar__avatar{
  display:inline-flex; padding:0; border:none; background:transparent; cursor:pointer;
  border-radius:9999px;
  transition: transform 150ms ${EASE_OUT}, filter 200ms ${EASE_OUT};
  will-change: transform;
}
.hc-idbar__avatar:hover{ filter: brightness(1.03); }
.hc-idbar__avatar:active{ transform: scale(0.94); }
.hc-idbar__avatar[data-open="true"]{ transform: scale(1.05); }
.hc-idbar__pulse{
  position:absolute; inset:0; border-radius:9999px; pointer-events:none;
  border:2px solid var(${CSS_VARS.accent}); opacity:0;
}
.hc-idbar__avatar[data-open="true"] ~ .hc-idbar__pulse{ animation: hcIdAvatarPulse 560ms ${EASE_OUT}; }
@keyframes hcIdAvatarPulse{
  0%{ opacity:0.5; transform:scale(1); }
  100%{ opacity:0; transform:scale(1.55); }
}

/* Peek panel springs from the avatar's top-left origin. */
.hc-idbar__peek{ transform-origin: top left; animation: hcIdPeekIn 200ms ${EASE_OUT}; }
@keyframes hcIdPeekIn{
  0%{ opacity:0; transform: translateY(-6px) scale(0.94); }
  100%{ opacity:1; transform: translateY(0) scale(1); }
}

@media (prefers-reduced-motion: reduce){
  .hc-idbar__avatar, .hc-idbar__avatar:active, .hc-idbar__avatar[data-open="true"]{ transition:none; transform:none; }
  .hc-idbar__avatar[data-open="true"] ~ .hc-idbar__pulse{ animation:none; }
  .hc-idbar__peek{ animation: hcIdPeekFade 120ms linear; }
  @keyframes hcIdPeekIn{ 0%{opacity:0;transform:none;} 100%{opacity:1;transform:none;} }
  @keyframes hcIdPeekFade{ from{opacity:0;} to{opacity:1;} }
  @keyframes hcIdAvatarPulse{ from{opacity:0;} to{opacity:0;} }
}
`;

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
  const [peekOpen, setPeekOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const avatarWrapRef = useRef<HTMLDivElement>(null);
  const switcherRef = useRef<HTMLDivElement>(null);
  const showSwitcher = (options?.length ?? 0) > 1;

  const displayName = viewer.user.fullName || viewer.user.email || "Your account";
  const email =
    viewer.user.email && viewer.user.email !== displayName ? viewer.user.email : null;

  const initials = (viewer.user.fullName ?? viewer.user.email ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  // Dismiss the avatar peek on outside-click / Escape.
  useEffect(() => {
    if (!peekOpen) return;
    function onDown(e: MouseEvent) {
      if (!avatarWrapRef.current?.contains(e.target as Node)) setPeekOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPeekOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [peekOpen]);

  // Dismiss the desktop lane switcher on outside-click / Escape.
  useEffect(() => {
    if (!switcherOpen) return;
    function onDown(e: MouseEvent) {
      if (!switcherRef.current?.contains(e.target as Node)) setSwitcherOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSwitcherOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [switcherOpen]);

  function avatarFace(size: string) {
    return (
      <span
        aria-hidden
        style={{
          width: size,
          height: size,
          borderRadius: RADIUS.pill,
          backgroundColor: `var(${CSS_VARS.accentSoft})`,
          color: `var(${CSS_VARS.accentText})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          flexShrink: 0,
          ...typeStyle("bodyStrong"),
          // Subtle accent ring so the avatar always reads as interactive.
          boxShadow: `inset 0 0 0 1.5px color-mix(in oklab, var(${CSS_VARS.accent}) 28%, transparent)`,
        }}
      >
        {viewer.user.avatarUrl ? (
          <span
            style={{
              width: "100%",
              height: "100%",
              backgroundImage: `url(${viewer.user.avatarUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ) : (
          initials || "·"
        )}
      </span>
    );
  }

  const optionRowStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "0.6rem 0.7rem",
    background: "transparent",
    border: "none",
    borderRadius: RADIUS.md,
    cursor: "pointer",
    textAlign: "left",
  };

  return (
    <header className="hc-idbar">
      <style dangerouslySetInnerHTML={{ __html: IDENTITY_BAR_CSS }} />

      {/* Avatar — identity anchor + peek trigger. */}
      <div className="hc-idbar__avatarwrap" ref={avatarWrapRef}>
        <button
          type="button"
          className="hc-idbar__avatar"
          data-open={peekOpen ? "true" : "false"}
          aria-haspopup="menu"
          aria-expanded={peekOpen}
          aria-label="Account"
          onClick={() => setPeekOpen((v) => !v)}
          style={{ ...focusVisibleStyle() }}
        >
          {avatarFace("2.5rem")}
        </button>
        {/* One-shot accent-ring pulse on open (sibling so the round
            avatar's overflow:hidden never clips it). */}
        <span className="hc-idbar__pulse" aria-hidden />

        {peekOpen ? (
          <div
            className="hc-idbar__peek"
            role="menu"
            aria-label="Account"
            style={{
              position: "absolute",
              top: "calc(100% + 0.5rem)",
              left: 0,
              minWidth: "15rem",
              maxWidth: "min(20rem, calc(100vw - 2rem))",
              backgroundColor: `var(${CSS_VARS.surface})`,
              border: `1px solid var(${CSS_VARS.hairline})`,
              borderRadius: RADIUS.lg,
              boxShadow: "0 18px 48px -16px rgba(0,0,0,0.28), 0 6px 16px rgba(0,0,0,0.08)",
              zIndex: 200,
              overflow: "hidden",
            }}
          >
            {/* Identity header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.85rem 0.85rem",
                borderBottom: `1px solid var(${CSS_VARS.hairline})`,
                background: `color-mix(in oklab, var(${CSS_VARS.accent}) 6%, var(${CSS_VARS.surface}))`,
              }}
            >
              {avatarFace("2.75rem")}
              <div style={{ minWidth: 0 }}>
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
                  {displayName}
                </p>
                {email ? (
                  <p
                    style={{
                      ...typeStyle("small"),
                      color: `var(${CSS_VARS.inkSoft})`,
                      margin: "0.1rem 0 0",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {email}
                  </p>
                ) : null}
                <div style={{ marginTop: "0.35rem" }}>
                  <Chip tone={chipToneForRole(viewer.role)}>{labelForRole(viewer.role)}</Chip>
                </div>
              </div>
            </div>

            {/* Switch lane (multi-lane viewers) */}
            {showSwitcher && options ? (
              <div style={{ padding: "0.5rem", borderBottom: onSignOut ? `1px solid var(${CSS_VARS.hairline})` : undefined }}>
                <p
                  style={{
                    ...typeStyle("kicker"),
                    color: `var(${CSS_VARS.inkMuted})`,
                    margin: "0.15rem 0.35rem 0.35rem",
                  }}
                >
                  Switch lane
                </p>
                {options.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setPeekOpen(false);
                      onSelectOption?.(opt.key);
                    }}
                    style={optionRowStyle}
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

            {/* Sign out */}
            {onSignOut ? (
              <div style={{ padding: "0.5rem" }}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setPeekOpen(false);
                    onSignOut();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.55rem",
                    width: "100%",
                    padding: "0.6rem 0.7rem",
                    background: "transparent",
                    border: "none",
                    borderRadius: RADIUS.md,
                    cursor: "pointer",
                    textAlign: "left",
                    ...typeStyle("bodyStrong"),
                    color: `var(${CSS_VARS.ink})`,
                  }}
                >
                  <LogOut size={16} aria-hidden />
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Name + role — desktop only (mobile folds these into the peek). */}
      <div className="hc-idbar__name">
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
          {displayName}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.15rem" }}>
          <Chip tone={chipToneForRole(viewer.role)}>{labelForRole(viewer.role)}</Chip>
        </div>
      </div>

      {/* Search — its own full-width tier on mobile, inline on desktop.
          Hidden entirely when no handler is wired (no dead control). */}
      {onSearchClick ? (
        <div className="hc-idbar__search">
          <button
            type="button"
            className="hc-idbar__searchbtn"
            onClick={onSearchClick}
            aria-label="Search"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.55rem 0.9rem",
              borderRadius: RADIUS.pill,
              border: `1px solid var(${CSS_VARS.hairline})`,
              backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
              color: `var(${CSS_VARS.inkSoft})`,
              cursor: "pointer",
              ...typeStyle("small"),
              ...focusVisibleStyle(),
            }}
          >
            <Search size={15} aria-hidden />
            <span style={{ flex: 1, textAlign: "left" }}>Search</span>
          </button>
        </div>
      ) : null}

      {/* Control cluster. */}
      <div className="hc-idbar__controls">
        {notificationsTrigger ??
          (typeof unreadCount === "number" && unreadCount > 0 ? (
            <Badge value={unreadCount} tone="urgent" />
          ) : null)}

        {/* Lane switcher — desktop inline (mobile uses the avatar peek). */}
        {showSwitcher && options ? (
          <div className="hc-idbar__deskonly" style={{ position: "relative" }} ref={switcherRef}>
            <button
              type="button"
              onClick={() => setSwitcherOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={switcherOpen}
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
              Switch lane <ChevronDown size={14} aria-hidden />
            </button>
            {switcherOpen ? (
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
                  boxShadow: "0 18px 48px -16px rgba(0,0,0,0.28), 0 6px 16px rgba(0,0,0,0.08)",
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
                      setSwitcherOpen(false);
                      onSelectOption?.(opt.key);
                    }}
                    style={optionRowStyle}
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

        {/* Sign out — desktop inline (mobile uses the avatar peek).
            G7: ≥ 44 × 44 px tap target. */}
        {onSignOut ? (
          <button
            type="button"
            className="hc-idbar__deskonly"
            onClick={onSignOut}
            aria-label="Sign out"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: `var(${CSS_VARS.inkSoft})`,
              minWidth: "44px",
              minHeight: "44px",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: RADIUS.pill,
              ...focusVisibleStyle(),
            }}
          >
            <LogOut size={18} aria-hidden />
          </button>
        ) : null}
      </div>
    </header>
  );
}

function labelForRole(role: DashboardRole): string {
  switch (role) {
    case "customer":
      return "Customer";
    case "staff":
      return "Staff";
    case "division_operator":
      return "Operator";
    case "super_admin":
      return "Owner";
  }
}

function chipToneForRole(role: DashboardRole): "accent" | "neutral" {
  return role === "super_admin" || role === "staff" || role === "division_operator"
    ? "accent"
    : "neutral";
}
