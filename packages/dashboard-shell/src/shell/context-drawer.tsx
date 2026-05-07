"use client";

import { useState, type ReactNode } from "react";
import { Bell } from "lucide-react";
import { Drawer } from "../components/drawer";
import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";
import { RADIUS } from "../tokens/spacing";
import { focusVisibleStyle } from "../tokens/focus";
import { Badge } from "../components/badge";

/**
 * ContextDrawer — the right-edge notifications + signal-feed panel.
 *
 * DASH-1 ships the trigger button + empty drawer placeholder.
 * DASH-6 fills the drawer with the realtime signal feed
 * (`get_signal_feed` SQL ranks; the SupabaseRealtimeProvider invalidates
 * caches on incoming notifications).
 *
 * The trigger button is rendered in the IdentityBar's trailing slot.
 * This component encapsulates both the trigger and the drawer body so
 * the IdentityBar consumer doesn't need to manage open-state.
 */
export type ContextDrawerProps = {
  /** Optional initial unread count — overridden once Realtime fan-out
   * lands in DASH-6. */
  unreadCount?: number;
  /** Optional drawer body — DASH-6 will pass the signal feed here.
   * DASH-1's default placeholder explains the not-yet-wired state. */
  children?: ReactNode;
};

export function ContextDrawer({ unreadCount = 0, children }: ContextDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={
          unreadCount > 0
            ? `Notifications (${unreadCount} unread)`
            : "Notifications"
        }
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
            style={{ position: "absolute", top: "-0.4rem", right: "-0.4rem" }}
          >
            <Badge value={unreadCount} tone="urgent" />
          </span>
        ) : null}
      </button>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        kicker="Activity"
        title="Signal feed"
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
              Notifications coming online…
            </p>
            <p
              style={{
                ...typeStyle("small"),
                color: `var(${CSS_VARS.inkMuted})`,
              }}
            >
              {/* TODO V2-COPY-01: review */}
              Realtime fan-out wires in DASH-6. Until then, the drawer is the
              shell-level mount point — your existing notification feed at
              <code> /notifications </code>continues to surface canonical state.
            </p>
          </div>
        )}
      </Drawer>
    </>
  );
}
