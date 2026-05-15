"use client";

import { useState } from "react";
import { MonitorUp, MonitorOff } from "lucide-react";
import { ActionButton, Panel } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";

/**
 * ScreenSharePane — provider-agnostic screen-share toggle.
 *
 * The actual `getDisplayMedia()` invocation happens INSIDE the provider
 * iframe (Daily and Jitsi both render their own screen-share affordance).
 * This pane is an orchestration layer:
 *   - When the host page has full control of the iframe (Daily callObject
 *     mode is out-of-scope for Wave A2), this component triggers it via
 *     a postMessage. For Wave A2 it just informs the caller via the
 *     `onToggle` callback so the consumer can do the right thing on its
 *     own.
 *   - Renders a stable affordance (icon + label) so a screen-share CTA
 *     is reachable outside the provider iframe (e.g. when the iframe
 *     is full-bleed and the controls are hidden).
 *
 * Wave A2 ships this as a NO-OP wrapper around the provider iframe's
 * native screen-share affordance. The consumer surfaces it as a hint to
 * the user where to click inside the iframe. Subsequent passes (Wave C
 * jobs interview room with Daily callObject mode) may wire real
 * postMessage control.
 */
export type ScreenSharePaneProps = {
  /** Currently sharing? Optional — caller may not have introspection. */
  active?: boolean;
  /** Callback when the user taps the affordance. */
  onToggle?: (next: { active: boolean }) => void;
  /** Hide if the provider does not support screen share. */
  available?: boolean;
};

export function ScreenSharePane({
  active = false,
  onToggle,
  available = true,
}: ScreenSharePaneProps) {
  const [pendingState, setPendingState] = useState<boolean | null>(null);
  const visualActive = pendingState ?? active;

  if (!available) return null;

  const handleClick = () => {
    const next = !visualActive;
    setPendingState(next);
    onToggle?.({ active: next });
    // Clear the pending state once the parent has had a chance to
    // observe — we don't keep optimistic UI for long because there's no
    // server-side state to confirm against.
    setTimeout(() => setPendingState(null), 1200);
  };

  return (
    <Panel tone="flat" padding="md">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.95rem",
              fontWeight: 500,
              color: `var(${CSS_VARS.ink})`,
            }}
          >
            Screen share
          </p>
          <p
            style={{
              margin: 0,
              marginTop: "0.15rem",
              fontSize: "0.85rem",
              color: `var(${CSS_VARS.inkMuted})`,
            }}
          >
            {visualActive
              ? "You are sharing your screen."
              : "Share a tab, window, or your full screen with the room."}
          </p>
        </div>
        <ActionButton
          tone={visualActive ? "secondary" : "primary"}
          onClick={handleClick}
          icon={
            visualActive ? (
              <MonitorOff size={16} aria-hidden />
            ) : (
              <MonitorUp size={16} aria-hidden />
            )
          }
          aria-label={visualActive ? "Stop sharing" : "Share screen"}
        >
          {visualActive ? "Stop sharing" : "Share screen"}
        </ActionButton>
      </div>
    </Panel>
  );
}
