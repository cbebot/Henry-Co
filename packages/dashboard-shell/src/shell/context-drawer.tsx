"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Bell } from "lucide-react";
import { Drawer } from "../components/drawer";
import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";
import { RADIUS } from "../tokens/spacing";
import { focusVisibleStyle } from "../tokens/focus";
import { Badge } from "../components/badge";
import { useRealtimeOptional } from "./supabase-realtime-provider";
import { isMutedDivision } from "./realtime-rules";

/**
 * ContextDrawer — the right-edge notifications + signal-feed panel.
 *
 * DASH-6 wires it to the shell realtime spine:
 *   - The trigger button reads the live customer-audience unread count
 *     via `useRealtimeOptional()` and applies the same muted-division
 *     filter the bell uses, so the drawer trigger badge and any
 *     shell-wide `<NotificationsBell>` always show the same number.
 *   - When the channel is degraded (error/closed), a small amber dot
 *     replaces the count so the user knows the badge may be lagging.
 *   - The body is provided as `children` — apps pass
 *     `<NotificationsDrawerBody>` from
 *     `@henryco/dashboard-shell/components/notifications`.
 *   - On narrow viewports the drawer becomes a bottom sheet via the
 *     underlying `<Drawer>` primitive.
 *
 * `useRealtimeOptional()` is used so the drawer can render outside the
 * shell during transient unauthenticated states without crashing.
 */
export type ContextDrawerProps = {
  /**
   * Override the unread count read from the spine. Useful for the SSR
   * placeholder during hydration. The live spine takes over on mount.
   */
  unreadCount?: number;
  /**
   * Body content. Passed via children so the package stays composable
   * across apps that render their own preferences mix.
   */
  children?: ReactNode;
  /** Optional translation function for ARIA labels. */
  t?: (key: string) => string;
};

export function ContextDrawer({
  unreadCount: unreadOverride,
  children,
  t = (s) => s,
}: ContextDrawerProps) {
  const realtime = useRealtimeOptional();
  // Apply the same muted-division filter the bell uses so the drawer
  // trigger badge and the bell badge always match.
  const liveUnread = useMemo(() => {
    if (!realtime) return 0;
    let count = 0;
    for (const s of realtime.signals) {
      if (s.audience !== "customer") continue;
      if (s.is_read || s.archived_at || s.deleted_at) continue;
      if (isMutedDivision(realtime.preferences, s.division)) continue;
      count += 1;
    }
    return count;
  }, [realtime]);
  const unreadCount = unreadOverride ?? liveUnread;
  const channelDegraded =
    realtime?.customerChannelStatus === "error" ||
    realtime?.customerChannelStatus === "closed";
  const [open, setOpen] = useState(false);

  // Keyboard escape — fallback in case the Drawer primitive's listener
  // doesn't bind under a hydration race.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const triggerLabel = (() => {
    if (channelDegraded) {
      return `${t("Notifications")} — ${t("reconnecting")}`;
    }
    if (unreadCount > 0) {
      return `${t("Notifications")} — ${unreadCount} ${t("unread")}`;
    }
    return t("Notifications");
  })();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={triggerLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          // DASH-7 G7 — promote to ≥ 44 × 44 px tap target (WCAG 2.5.5
          // AAA). Pre-DASH-7 this was 36 × 36; the bell now matches the
          // BottomActionBar.Inbox anchor so shell chrome is uniformly
          // thumb-friendly across desktop + mobile.
          minWidth: "44px",
          minHeight: "44px",
          borderRadius: RADIUS.pill,
          border: `1px solid var(${CSS_VARS.hairline})`,
          backgroundColor: `var(${CSS_VARS.surface})`,
          color: `var(${CSS_VARS.ink})`,
          cursor: "pointer",
          ...focusVisibleStyle(),
        }}
      >
        <Bell size={18} aria-hidden />
        {channelDegraded ? (
          <span
            aria-hidden
            title={t("Reconnecting to live activity")}
            style={{
              position: "absolute",
              top: "-0.25rem",
              right: "-0.25rem",
              width: "0.55rem",
              height: "0.55rem",
              borderRadius: "9999px",
              backgroundColor: "#c9a227",
              boxShadow: `0 0 0 2px var(${CSS_VARS.surface})`,
            }}
          />
        ) : unreadCount > 0 ? (
          <span
            aria-hidden
            style={{ position: "absolute", top: "-0.4rem", right: "-0.4rem" }}
          >
            <Badge value={unreadCount} tone="urgent" />
          </span>
        ) : null}
      </button>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        kicker={t("Activity")}
        title={t("Signal feed")}
      >
        {children ?? (
          <div style={{ padding: "1.5rem 0", textAlign: "center" }}>
            <p
              style={{
                ...typeStyle("body"),
                color: `var(${CSS_VARS.inkSoft})`,
                marginBottom: "0.5rem",
              }}
            >
              {t("Notifications coming online…")}
            </p>
            <p
              style={{
                ...typeStyle("small"),
                color: `var(${CSS_VARS.inkMuted})`,
              }}
            >
              {t(
                "Drawer body not yet provided — pass <NotificationsDrawerBody> as children to populate.",
              )}
            </p>
          </div>
        )}
      </Drawer>
    </>
  );
}
