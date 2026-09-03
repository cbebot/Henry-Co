"use client";

import { useLinkStatus } from "next/link";
import { CSS_VARS } from "../tokens/color";

/**
 * LinkActivity — honest, per-link "your tap is loading" feedback.
 *
 * Renders a small breathing accent dot ONLY while the enclosing
 * `next/link` `<Link>`'s navigation is genuinely pending (Next's
 * `useLinkStatus`). It confirms — on the exact element the user clicked —
 * that the tap registered and the destination is loading, with no faked
 * or timed state: the dot exists exactly as long as the navigation does,
 * then unmounts. Must be rendered as a descendant of a `<Link>`.
 *
 * Pairs with the route loader (the full-surface signal) and the global
 * `:active` press feedback (the instant tactile signal) to make every
 * interaction in the account feel acknowledged. The `henrycoLinkPulse`
 * keyframe ships in MOTION_KEYFRAMES_CSS (reduced-motion → static).
 */
export function LinkActivity() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden
      style={{
        flexShrink: 0,
        width: "0.5rem",
        height: "0.5rem",
        borderRadius: "999px",
        backgroundColor: `var(${CSS_VARS.accent})`,
        animation: "henrycoLinkPulse 720ms ease-in-out infinite",
      }}
    />
  );
}
