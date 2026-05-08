"use client";

import { useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import {
  ACCOUNT_NOTIFICATION_TOKENS,
  type SeverityTokens,
} from "@henryco/notifications-ui/tokens";

import { useRealtime } from "../../shell/realtime-hooks";
import type { SignalAudience } from "../../shell/realtime-types";
import { CSS_VARS } from "../../tokens/color";
import { RADIUS } from "../../tokens/spacing";
import { typeStyle } from "../../tokens/type";
import { focusVisibleStyle } from "../../tokens/focus";
import { InboxFeed } from "./inbox-feed";
import { QuietHoursPanel } from "./quiet-hours-panel";
import { PreferencesPanel } from "./preferences-panel";

/**
 * NotificationsDrawerBody — the tabbed surface composition mounted
 * inside `<ContextDrawer>` for DASH-6.
 *
 * Tabs:
 *   - Inbox            : InboxFeed (live realtime)
 *   - Preferences      : QuietHoursPanel + PreferencesPanel
 *   - Recently deleted : link out to the existing route (DASH-3 shipped)
 */

export type NotificationsDrawerBodyProps = {
  audience?: SignalAudience;
  tokens?: SeverityTokens;
  inboxHref?: string;
  recentlyDeletedHref?: string;
  actionEndpoint?: (id: string, action: "read" | "unread" | "archive" | "delete") => string;
  preferencesEndpoint?: string;
  t?: (key: string) => string;
};

type Tab = "inbox" | "preferences";

export function NotificationsDrawerBody({
  audience = "customer",
  tokens = ACCOUNT_NOTIFICATION_TOKENS,
  inboxHref = "/notifications",
  recentlyDeletedHref = "/notifications/recently-deleted",
  actionEndpoint,
  preferencesEndpoint = "/api/notifications/preferences",
  t = (s) => s,
}: NotificationsDrawerBodyProps) {
  const tt = (key: string) => (typeof t === "function" ? t(key) : key);
  const [tab, setTab] = useState<Tab>("inbox");
  const { customerChannelStatus, staffChannelStatus, error } = useRealtime();

  const offline =
    customerChannelStatus === "error" ||
    customerChannelStatus === "closed" ||
    staffChannelStatus === "error" ||
    staffChannelStatus === "closed";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.85rem",
        padding: "0.5rem 0",
      }}
    >
      {offline ? (
        <ConnectionBanner t={tt} />
      ) : error ? (
        <ConnectionBanner t={tt} message={error} />
      ) : null}

      <TabBar tab={tab} setTab={setTab} t={tt} />

      {tab === "inbox" ? (
        <InboxFeed
          audience={audience}
          tokens={tokens}
          actionEndpoint={actionEndpoint}
          t={t}
        />
      ) : null}

      {tab === "preferences" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <QuietHoursPanel endpoint={preferencesEndpoint} t={t} />
          <PreferencesPanel endpoint={preferencesEndpoint} t={t} />
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.85rem 0 0",
          borderTop: `1px solid var(${CSS_VARS.hairline})`,
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <a
          href={recentlyDeletedHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            color: `var(${CSS_VARS.inkSoft})`,
            textDecoration: "none",
            fontSize: "0.7rem",
            fontWeight: 600,
            ...focusVisibleStyle(),
          }}
        >
          <Trash2 size={12} aria-hidden /> {tt("Recently deleted")}
        </a>
        <a
          href={inboxHref}
          style={{
            color: `var(${CSS_VARS.inkSoft})`,
            textDecoration: "none",
            fontSize: "0.7rem",
            fontWeight: 600,
            ...focusVisibleStyle(),
          }}
        >
          {tt("Open full inbox")}
        </a>
      </div>
    </div>
  );
}

function TabBar({
  tab,
  setTab,
  t,
}: {
  tab: Tab;
  setTab: (next: Tab) => void;
  t: (key: string) => string;
}) {
  return (
    <div
      role="tablist"
      aria-label={t("Notifications drawer")}
      style={{ display: "flex", gap: "0.4rem" }}
    >
      <TabButton active={tab === "inbox"} onClick={() => setTab("inbox")} label={t("Inbox")} />
      <TabButton
        active={tab === "preferences"}
        onClick={() => setTab("preferences")}
        label={t("Preferences")}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        padding: "0.35rem 0.95rem",
        fontSize: "0.7rem",
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        borderRadius: "9999px",
        border: "none",
        backgroundColor: active
          ? `var(${CSS_VARS.accentSoft})`
          : `var(${CSS_VARS.surface})`,
        color: active
          ? `var(${CSS_VARS.accentText})`
          : `var(${CSS_VARS.inkSoft})`,
        cursor: "pointer",
        ...focusVisibleStyle(),
      }}
    >
      {label}
    </button>
  );
}

function ConnectionBanner({ t, message }: { t: (s: string) => string; message?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        padding: "0.6rem 0.85rem",
        borderRadius: RADIUS.md,
        border: `1px solid var(${CSS_VARS.hairline})`,
        backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
        display: "flex",
        gap: "0.5rem",
        alignItems: "center",
      }}
    >
      <span
        aria-hidden
        style={{
          width: "0.5rem",
          height: "0.5rem",
          borderRadius: "9999px",
          backgroundColor: `var(${CSS_VARS.inkSoft})`,
        }}
      />
      <p
        style={{
          ...typeStyle("small"),
          margin: 0,
          color: `var(${CSS_VARS.ink})`,
        }}
      >
        {message ?? t("Reconnecting to live activity…")}
      </p>
    </div>
  );
}
