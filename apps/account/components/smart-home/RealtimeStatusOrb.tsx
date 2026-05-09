"use client";

import { useRealtime } from "@henryco/dashboard-shell";

/**
 * RealtimeStatusOrb — a calm, breathing dot that reflects the actual
 * health of the realtime spine.
 *
 * Three states, all ambient — never alarming:
 *   subscribed → 4-second breath in calm green; the page is alive.
 *   connecting → 1.2-second slightly faster pulse in soft amber;
 *                gives the user feedback while the broker handshakes.
 *   error/closed → slow drift in warm amber; signals "we're trying"
 *                  but doesn't shout. Backoff handles re-connection.
 *
 * The orb deliberately replaces the older "Live · 30s refresh" copy —
 * a working dashboard shouldn't have to teach the user how it works.
 * If the channel is healthy the dot just breathes; if it isn't, the
 * surrounding label flips to "Reconnecting…".
 *
 * prefers-reduced-motion: reduce → orb holds steady, no pulse, label
 * uses static "Live" / "Reconnecting" copy.
 */
export function RealtimeStatusOrb() {
  const { customerChannelStatus } = useRealtime();

  const orbState =
    customerChannelStatus === "subscribed"
      ? "subscribed"
      : customerChannelStatus === "connecting" || customerChannelStatus === "idle"
        ? "connecting"
        : customerChannelStatus === "disabled"
          ? "subscribed" // calm; signed-out users see steady dot
          : "error";

  const label =
    orbState === "subscribed"
      ? "Live"
      : orbState === "connecting"
        ? "Connecting"
        : "Reconnecting";

  return (
    <div
      className="hc-realtime-orb"
      data-state={orbState}
      role="status"
      aria-live="polite"
      aria-label={`Realtime spine ${label.toLowerCase()}`}
    >
      <span aria-hidden className="hc-realtime-orb__dot" />
      <span className="hc-realtime-orb__label">{label}</span>
    </div>
  );
}
