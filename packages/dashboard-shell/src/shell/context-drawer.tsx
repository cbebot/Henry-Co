"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Bell } from "lucide-react";
import { Drawer } from "../components/drawer";
import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";
import { RADIUS } from "../tokens/spacing";
import { focusVisibleStyle } from "../tokens/focus";
import { Badge } from "../components/badge";
import { useRealtimeOptional } from "./supabase-realtime-provider";

/**
 * ContextDrawer — the right-edge notifications + signal-feed panel.
 *
 * DASH-6 wires it to the shell realtime spine:
 *   - The trigger button reads the live customer-audience unread count
 *     via `useRealtimeOptional()` so the badge updates on every realtime
 *     event without the host needing to wire it.
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
  const liveUnread = realtime?.customerUnread ?? 0;
  const unreadCount = unreadOverride ?? liveUnread;
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={
          unreadCount > 0
            ? `${t("Notifications")} — ${unreadCount} ${t("unread")}`
            : t("Notifications")
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "2.25rem",
          height: "2.25rem",
          borderRadius: RADIUS.pill,
          border: `1px solid var(${CSS_VARS.hairline})`,
          backgroundColor: `var(${CSS_VARS.surface})`,
          color: `var(${CSS_VARS.ink})`,
          cursor: "pointer",
          ...focusVisibleStyle(),
        }}
      >
        <Bell size={16} aria-hidden />
        {unreadCount > 0 ? (
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
