"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  LayoutGrid,
  Bell,
  Menu,
  ChevronRight,
  Settings,
  HelpCircle,
  LogOut,
  Activity,
  X,
} from "lucide-react";

import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";
import { RADIUS, SPACING } from "../tokens/spacing";
import { focusVisibleStyle } from "../tokens/focus";
import { Drawer } from "../components/drawer";
import { BottomSheet } from "../components/bottom-sheet";
import { Badge } from "../components/badge";
import { EmptyState } from "../components/empty-state";
import { useRealtimeOptional } from "./supabase-realtime-provider";
import { LinkActivity } from "./link-activity";

/**
 * BottomActionBar — the canonical mobile chrome.
 *
 * The 4-anchor bottom navigation that becomes the primary nav at
 * < 768px viewports. Replaces `apps/account/components/layout/MobileNav.tsx`.
 *
 * The four anchors map to the audit's mobile vocabulary:
 *
 *   - Home   — `/` (Smart Home; DASH-4 surface)
 *   - Modules — opens a Drawer of `getEligibleModules(viewer)`
 *   - Inbox  — opens a Drawer with the same body the IdentityBar bell uses
 *   - More   — opens a BottomSheet with settings, theme, help, sign-out
 *
 * Active anchor is HenryCo gold (`var(--hc-accent-soft)` fill +
 * `var(--hc-accent-text)` ink). Each anchor is a 44×44 minimum tap
 * target (WCAG 2.5.5 AAA). Renders only at < 768px via the
 * `hc-bottom-action-bar` class hook (see `mobile-shell-css.ts`).
 *
 * Anti-pattern coverage:
 *   #15 — primary is HenryCo gold, never blue.
 *   #21 — mobile is a different layout, not a CSS-media-query-only scale.
 */

export type ModuleNavEntry = {
  /** Module slug — used as the React key. */
  slug: string;
  /** Display name. */
  title: string;
  /** One-line description. */
  description?: string;
  /** Resolved href the link navigates to. */
  href: string;
  /**
   * Division accent hex (e.g. `#B2863B` for marketplace). Renders as a
   * 3 px left stripe on the drawer entry + tints the icon container.
   * Optional — falls back to HenryCo gold when omitted.
   */
  accentHex?: string;
  /** Optional division-specific icon. */
  icon?: ReactNode;
};

export type BottomActionBarProps = {
  /** Root href for the Home anchor. Defaults to `/`. */
  homeHref?: string;
  /** Eligible modules (server-resolved). */
  modules: ReadonlyArray<ModuleNavEntry>;
  /**
   * Body for the Inbox drawer. Apps pass
   * `<NotificationsDrawerBody>`; if omitted the drawer renders the
   * primitive's default placeholder.
   */
  inboxBody?: ReactNode;
  /** Settings href shown in the More sheet. */
  settingsHref?: string;
  /** Help href shown in the More sheet. Defaults to `/support`. */
  helpHref?: string;
  /** Optional external status URL shown in the More sheet. */
  statusHref?: string;
  /**
   * Optional theme toggle slot (host-app provided). Rendered inside the
   * More sheet so the host doesn't need to introduce a second theme
   * provider.
   */
  themeToggleSlot?: ReactNode;
  /**
   * Server action invoked when the user signs out via the More sheet.
   * Same contract as IdentityBar.onSignOut.
   */
  onSignOut?: () => void;
  /** Optional translation function for ARIA labels. */
  t?: (key: string) => string;
};

const ANCHOR_KEYS = ["home", "modules", "inbox", "more"] as const;
type AnchorKey = (typeof ANCHOR_KEYS)[number];

export function BottomActionBar({
  homeHref = "/",
  modules,
  inboxBody,
  settingsHref = "/settings",
  helpHref = "/support",
  statusHref,
  themeToggleSlot,
  onSignOut,
  t = (s) => s,
}: BottomActionBarProps) {
  const pathname = usePathname() ?? "/";
  const [openSheet, setOpenSheet] = useState<AnchorKey | null>(null);
  const realtime = useRealtimeOptional();
  const unread = realtime?.customerUnread ?? 0;

  // Determine the active anchor from the current pathname.
  const activeAnchor: AnchorKey = computeActive(pathname, openSheet);

  // Close any open sheet/drawer once a navigation actually COMMITS (the
  // pathname changes). This is the CLOSE mechanism for in-sheet nav links
  // (they carry no onClick-close, so the route change dismisses the sheet
  // once the destination is ready). The companion fix that lets the link
  // actually navigate lives in the Drawer/BottomSheet primitives: their
  // `onClickCapture={suppressSentinelPopForNavLink}` tells
  // `useAndroidBackClose`'s cleanup to skip its `history.back()`, so
  // closing the sheet can't cancel the in-flight App Router navigation
  // (the "tap Settings / Help / a module just closes the sheet but never
  // navigates" bug). A no-op on the current page (no pathname change).
  useEffect(() => {
    setOpenSheet(null);
  }, [pathname]);

  return (
    <>
      <nav
        aria-label={t("Primary mobile navigation")}
        className="hc-bottom-action-bar"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          height: SPACING.chrome.bottomBarHeight,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          backgroundColor: `var(${CSS_VARS.surface})`,
          borderTop: `1px solid var(${CSS_VARS.hairline})`,
          // Slight elevation so the bar reads as a fixed surface above
          // the content scroll.
          boxShadow: "0 -1px 2px rgba(0, 0, 0, 0.04), 0 -8px 24px rgba(0, 0, 0, 0.04)",
          zIndex: 90,
          alignItems: "stretch",
          justifyContent: "space-around",
        }}
      >
        <AnchorButton
          kind="link"
          href={homeHref}
          icon={<Home size={20} aria-hidden />}
          label={t("Home")}
          active={activeAnchor === "home"}
        />
        <AnchorButton
          kind="button"
          onClick={() => setOpenSheet(openSheet === "modules" ? null : "modules")}
          icon={<LayoutGrid size={20} aria-hidden />}
          label={t("Modules")}
          active={activeAnchor === "modules"}
          ariaExpanded={openSheet === "modules"}
          ariaHaspopup="dialog"
        />
        <AnchorButton
          kind="button"
          onClick={() => setOpenSheet(openSheet === "inbox" ? null : "inbox")}
          icon={
            <span style={{ position: "relative", display: "inline-flex" }}>
              <Bell size={20} aria-hidden />
              {unread > 0 ? (
                <span
                  aria-hidden
                  style={{ position: "absolute", top: "-0.4rem", right: "-0.5rem" }}
                >
                  <Badge value={unread} tone="urgent" />
                </span>
              ) : null}
            </span>
          }
          label={t("Inbox")}
          active={activeAnchor === "inbox"}
          ariaExpanded={openSheet === "inbox"}
          ariaHaspopup="dialog"
          ariaLabel={
            unread > 0
              ? `${t("Inbox")} — ${unread} ${t("unread")}`
              : undefined
          }
        />
        <AnchorButton
          kind="button"
          onClick={() => setOpenSheet(openSheet === "more" ? null : "more")}
          icon={<Menu size={20} aria-hidden />}
          label={t("More")}
          active={activeAnchor === "more"}
          ariaExpanded={openSheet === "more"}
          ariaHaspopup="dialog"
        />
      </nav>

      {/* Spacer rendered in normal flow so content above doesn't sit
          underneath the fixed bar. The spacer matches the bar's height +
          safe-area inset and is shown only at < 768px (same class hook). */}
      <div
        aria-hidden
        className="hc-bottom-action-bar-spacer"
        style={{
          height: SPACING.chrome.bottomBarHeight,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      />

      {/* Modules drawer */}
      <Drawer
        open={openSheet === "modules"}
        onClose={() => setOpenSheet(null)}
        kicker={t("Workspace")}
        title={t("Modules")}
        telemetrySurface="bottom_action_bar_modules"
      >
        <ModulesList
          modules={modules}
          activeHref={pathname}
          t={t}
        />
      </Drawer>

      {/* Inbox drawer */}
      <Drawer
        open={openSheet === "inbox"}
        onClose={() => setOpenSheet(null)}
        kicker={t("Activity")}
        title={t("Inbox")}
        telemetrySurface="bottom_action_bar_inbox"
      >
        {inboxBody ?? (
          <EmptyState
            kicker={t("Inbox")}
            headline={t("Notifications coming online…")}
            body={t(
              "Pass <NotificationsDrawerBody> as the inboxBody prop to populate this view.",
            )}
          />
        )}
      </Drawer>

      {/* More sheet */}
      <BottomSheet
        open={openSheet === "more"}
        onClose={() => setOpenSheet(null)}
        telemetrySurface="bottom_action_bar_more"
        kicker={t("Account")}
        title={t("More")}
        tall
      >
        <MoreSheetBody
          settingsHref={settingsHref}
          helpHref={helpHref}
          statusHref={statusHref}
          themeToggleSlot={themeToggleSlot}
          onSignOut={onSignOut}
          onItemPick={() => setOpenSheet(null)}
          t={t}
        />
      </BottomSheet>
    </>
  );
}

/**
 * Decide which anchor is "active" given the current pathname + any
 * open sheet. An open sheet wins (Modules / Inbox / More) so the bar
 * reads as a stateful affordance. With nothing open, Home wins on `/`,
 * Modules wins on `/modules/...`, otherwise Home is the default.
 *
 * Exported for unit testing via `node:test`.
 */
export function computeActive(
  pathname: string,
  openSheet: AnchorKey | null,
): AnchorKey {
  if (openSheet) return openSheet;
  if (pathname === "/" || pathname === "") return "home";
  if (pathname.startsWith("/modules")) return "modules";
  return "home";
}

/** Anchor key set — exported for type-narrowing call sites + tests. */
export const BOTTOM_ACTION_BAR_ANCHOR_KEYS = ANCHOR_KEYS;
export type BottomActionBarAnchorKey = AnchorKey;

type AnchorButtonProps = {
  kind: "link" | "button";
  href?: string;
  onClick?: () => void;
  icon: ReactNode;
  label: string;
  active: boolean;
  ariaExpanded?: boolean;
  ariaHaspopup?: "dialog" | "menu";
  ariaLabel?: string;
};

function AnchorButton({
  kind,
  href,
  onClick,
  icon,
  label,
  active,
  ariaExpanded,
  ariaHaspopup,
  ariaLabel,
}: AnchorButtonProps) {
  const baseStyle: React.CSSProperties = {
    flex: 1,
    minWidth: "44px",
    minHeight: "44px",
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.18rem",
    padding: "0.4rem 0.5rem",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: active
      ? `var(${CSS_VARS.accentText})`
      : `var(${CSS_VARS.inkSoft})`,
    textDecoration: "none",
    position: "relative",
    transition: "color 160ms ease",
    ...focusVisibleStyle(),
  };

  const labelStyle: React.CSSProperties = {
    ...typeStyle("micro"),
    fontWeight: active ? 700 : 600,
    letterSpacing: "0.04em",
    textTransform: "none",
  };

  // Active surface: HenryCo gold soft background + 2px gold top stripe
  // so the active anchor reads instantly at thumb level.
  const activeIndicator = active ? (
    <span
      aria-hidden
      style={{
        position: "absolute",
        left: "30%",
        right: "30%",
        top: 0,
        height: "2px",
        backgroundColor: `var(${CSS_VARS.accent})`,
        borderRadius: RADIUS.pill,
      }}
    />
  ) : null;

  const inner = (
    <>
      {activeIndicator}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "2.25rem",
          height: "2.25rem",
          borderRadius: RADIUS.lg,
          backgroundColor: active
            ? `var(${CSS_VARS.accentSoft})`
            : "transparent",
        }}
      >
        {icon}
      </span>
      <span style={labelStyle}>{label}</span>
    </>
  );

  if (kind === "link") {
    return (
      <Link
        href={href!}
        aria-current={active ? "page" : undefined}
        aria-label={ariaLabel}
        style={baseStyle}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHaspopup}
      aria-label={ariaLabel}
      style={baseStyle}
    >
      {inner}
    </button>
  );
}

type ModulesListProps = {
  modules: ReadonlyArray<ModuleNavEntry>;
  activeHref: string;
  t: (key: string) => string;
};

function ModulesList({ modules, activeHref, t }: ModulesListProps) {
  if (modules.length === 0) {
    return (
      <EmptyState
        kicker={t("Workspace")}
        headline={t("No modules yet")}
        body={t(
          "Modules surface here as they become available for your account.",
        )}
      />
    );
  }
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      {modules.map((module) => {
        const isActive =
          activeHref === module.href ||
          (module.href !== "/" && activeHref.startsWith(module.href + "/"));
        const accentHex = module.accentHex;
        // Soft tint for the icon container — derive from the accent
        // hex via 18% alpha. Falls back to the shell's accentSoft token
        // when no accent supplied.
        const accentTint = accentHex ? `${accentHex}2E` : undefined;
        return (
          <li key={module.slug}>
            <Link
              href={module.href}
              aria-current={isActive ? "page" : undefined}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                padding: "0.85rem 0.85rem 0.85rem 1rem",
                minHeight: "56px",
                borderRadius: RADIUS.lg,
                border: `1px solid var(${CSS_VARS.hairline})`,
                backgroundColor: isActive
                  ? `var(${CSS_VARS.accentSoft})`
                  : `var(${CSS_VARS.surface})`,
                color: `var(${CSS_VARS.ink})`,
                textDecoration: "none",
                overflow: "hidden",
                ...focusVisibleStyle(),
              }}
            >
              {/* DASH-7 — left accent stripe in the module's division
                  color. Closes anti-pattern #15 at a per-entry level
                  while preserving HenryCo gold as the active state. */}
              {accentHex ? (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: "3px",
                    backgroundColor: accentHex,
                  }}
                />
              ) : null}
              <span
                aria-hidden
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "2.25rem",
                  height: "2.25rem",
                  borderRadius: RADIUS.md,
                  backgroundColor: accentTint ?? `var(${CSS_VARS.accentSoft})`,
                  color: accentHex ?? `var(${CSS_VARS.accentText})`,
                  flexShrink: 0,
                }}
              >
                {module.icon ?? <LayoutGrid size={18} aria-hidden />}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    ...typeStyle("bodyStrong"),
                    color: `var(${CSS_VARS.ink})`,
                    display: "block",
                  }}
                >
                  {module.title}
                </span>
                {module.description ? (
                  <span
                    className="hc-module-entry-description"
                    style={{
                      ...typeStyle("small"),
                      color: `var(${CSS_VARS.inkSoft})`,
                      marginTop: "0.1rem",
                    }}
                  >
                    {module.description}
                  </span>
                ) : null}
              </span>
              <LinkActivity />
              <ChevronRight
                size={16}
                aria-hidden
                style={{ color: `var(${CSS_VARS.inkMuted})`, flexShrink: 0 }}
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

type MoreSheetBodyProps = {
  settingsHref: string;
  helpHref: string;
  statusHref?: string;
  themeToggleSlot?: ReactNode;
  onSignOut?: () => void;
  onItemPick: () => void;
  t: (key: string) => string;
};

function MoreSheetBody({
  settingsHref,
  helpHref,
  statusHref,
  themeToggleSlot,
  onSignOut,
  onItemPick,
  t,
}: MoreSheetBodyProps) {
  const handleSignOut = () => {
    if (!onSignOut) return;
    onItemPick();
    onSignOut();
  };
  return (
    <div
      className="hc-more-sheet-body"
      style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
    >
      <MoreLink
        href={settingsHref}
        icon={<Settings size={18} aria-hidden />}
        label={t("Settings")}
        onPick={onItemPick}
      />
      <MoreLink
        href={helpHref}
        icon={<HelpCircle size={18} aria-hidden />}
        label={t("Help")}
        onPick={onItemPick}
      />
      {statusHref ? (
        <MoreLink
          href={statusHref}
          icon={<Activity size={18} aria-hidden />}
          label={t("System status")}
          onPick={onItemPick}
          external
        />
      ) : null}
      {themeToggleSlot ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
            padding: "0.75rem 0.85rem",
            minHeight: "44px",
            borderRadius: RADIUS.lg,
            border: `1px solid var(${CSS_VARS.hairline})`,
            backgroundColor: `var(${CSS_VARS.surface})`,
            color: `var(${CSS_VARS.ink})`,
          }}
        >
          <span
            style={{
              ...typeStyle("bodyStrong"),
              color: `var(${CSS_VARS.ink})`,
            }}
          >
            {t("Theme")}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            {themeToggleSlot}
          </span>
        </div>
      ) : null}
      {onSignOut ? (
        <button
          type="button"
          onClick={handleSignOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
            padding: "0.85rem 0.85rem",
            minHeight: "44px",
            borderRadius: RADIUS.lg,
            border: `1px solid var(${CSS_VARS.hairline})`,
            backgroundColor: `var(${CSS_VARS.surface})`,
            color: `var(${CSS_VARS.ink})`,
            textAlign: "left",
            cursor: "pointer",
            ...focusVisibleStyle(),
          }}
        >
          <span
            aria-hidden
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "2rem",
              height: "2rem",
              borderRadius: RADIUS.md,
              backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
              color: `var(${CSS_VARS.inkSoft})`,
            }}
          >
            <LogOut size={18} aria-hidden />
          </span>
          <span
            style={{
              ...typeStyle("bodyStrong"),
              color: `var(${CSS_VARS.ink})`,
            }}
          >
            {t("Sign out")}
          </span>
        </button>
      ) : null}
      <button
        type="button"
        onClick={onItemPick}
        style={{
          marginTop: "0.5rem",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.4rem",
          padding: "0.65rem 1rem",
          minHeight: "44px",
          borderRadius: RADIUS.pill,
          border: `1px solid var(${CSS_VARS.hairline})`,
          backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
          color: `var(${CSS_VARS.inkSoft})`,
          cursor: "pointer",
          ...typeStyle("small"),
          ...focusVisibleStyle(),
        }}
      >
        <X size={14} aria-hidden /> {t("Close")}
      </button>
    </div>
  );
}

type MoreLinkProps = {
  href: string;
  icon: ReactNode;
  label: string;
  onPick: () => void;
  external?: boolean;
};

function MoreLink({ href, icon, label, onPick, external }: MoreLinkProps) {
  const sharedStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.85rem",
    padding: "0.85rem 0.85rem",
    minHeight: "44px",
    borderRadius: RADIUS.lg,
    border: `1px solid var(${CSS_VARS.hairline})`,
    backgroundColor: `var(${CSS_VARS.surface})`,
    color: `var(${CSS_VARS.ink})`,
    textDecoration: "none",
    ...focusVisibleStyle(),
  };
  const inner = (
    <>
      <span
        aria-hidden
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "2rem",
          height: "2rem",
          borderRadius: RADIUS.md,
          backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
          color: `var(${CSS_VARS.inkSoft})`,
        }}
      >
        {icon}
      </span>
      <span
        style={{
          ...typeStyle("bodyStrong"),
          color: `var(${CSS_VARS.ink})`,
          flex: 1,
        }}
      >
        {label}
      </span>
      <ChevronRight
        size={16}
        aria-hidden
        style={{ color: `var(${CSS_VARS.inkMuted})` }}
      />
    </>
  );
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        onClick={onPick}
        style={sharedStyle}
      >
        {inner}
      </a>
    );
  }
  // Internal navigation: do NOT close on click. Closing here unmounts
  // this <Link> (the sheet returns null when openSheet flips), cancelling
  // the App Router navigation. The BottomActionBar's pathname effect
  // closes the sheet once the route commits. (The external `<a>` above
  // opens a new tab — no route change — so it keeps onClick={onPick}.)
  return (
    <Link href={href} style={sharedStyle}>
      {inner}
      <LinkActivity />
    </Link>
  );
}
