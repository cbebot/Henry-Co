import type { CSSProperties } from "react";
import { CSS_VARS } from "../tokens/color";
import { RADIUS } from "../tokens/spacing";

/**
 * LoadingSkeleton — placeholder geometry that matches the final
 * layout dimensions so hydration doesn't shift content.
 *
 * Variants:
 *   - `card` — full-width panel with internal skeleton lines
 *   - `metric` — square card matching MetricCard's 4-on-a-row layout
 *   - `signal` — full-width SignalCard placeholder
 *   - `line` — single text line
 *   - `avatar` — circular avatar
 *
 * Animation: linear shimmer at 1.6s, honoured `prefers-reduced-motion`
 * (animation falls back to a static muted fill).
 */
export type LoadingSkeletonProps = {
  variant: "card" | "metric" | "signal" | "line" | "avatar";
  /** Override the line count for `card` / `signal` variants. */
  lines?: number;
  /** Override the height (px or any CSS dimension). */
  height?: string;
  /** Override the width. */
  width?: string;
};

const SHIMMER_BG: CSSProperties = {
  background:
    "linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.04) 100%)",
  backgroundSize: "200% 100%",
  animation: "henrycoSkeletonShimmer 1.6s linear infinite",
};

export function LoadingSkeleton({ variant, lines = 3, height, width }: LoadingSkeletonProps) {
  if (variant === "line") {
    return (
      <div
        aria-hidden
        style={{
          ...SHIMMER_BG,
          height: height ?? "0.875rem",
          width: width ?? "100%",
          borderRadius: RADIUS.sm,
        }}
      />
    );
  }

  if (variant === "avatar") {
    return (
      <div
        aria-hidden
        style={{
          ...SHIMMER_BG,
          height: height ?? "2.25rem",
          width: width ?? "2.25rem",
          borderRadius: RADIUS.pill,
        }}
      />
    );
  }

  if (variant === "metric") {
    return (
      <div
        aria-busy
        aria-live="polite"
        style={{
          backgroundColor: `var(${CSS_VARS.surface})`,
          border: `1px solid var(${CSS_VARS.hairline})`,
          borderRadius: RADIUS.xl,
          padding: "1rem",
          minHeight: height ?? "7rem",
        }}
      >
        <div style={{ ...SHIMMER_BG, height: "0.7rem", width: "40%", borderRadius: RADIUS.sm }} />
        <div style={{ ...SHIMMER_BG, marginTop: "0.75rem", height: "1.5rem", width: "60%", borderRadius: RADIUS.sm }} />
        <div style={{ ...SHIMMER_BG, marginTop: "0.5rem", height: "0.7rem", width: "80%", borderRadius: RADIUS.sm }} />
      </div>
    );
  }

  if (variant === "signal") {
    return (
      <div
        aria-busy
        aria-live="polite"
        style={{
          backgroundColor: `var(${CSS_VARS.surface})`,
          border: `1px solid var(${CSS_VARS.hairline})`,
          borderRadius: RADIUS.lg,
          padding: "1rem",
        }}
      >
        <div style={{ ...SHIMMER_BG, height: "0.7rem", width: "30%", borderRadius: RADIUS.sm }} />
        <div style={{ ...SHIMMER_BG, marginTop: "0.5rem", height: "0.875rem", width: "85%", borderRadius: RADIUS.sm }} />
        <div style={{ ...SHIMMER_BG, marginTop: "0.4rem", height: "0.875rem", width: "70%", borderRadius: RADIUS.sm }} />
      </div>
    );
  }

  // card
  return (
    <div
      aria-busy
      aria-live="polite"
      style={{
        backgroundColor: `var(${CSS_VARS.surface})`,
        border: `1px solid var(${CSS_VARS.hairline})`,
        borderRadius: RADIUS.xl,
        padding: "1.25rem",
      }}
    >
      <div style={{ ...SHIMMER_BG, height: "0.7rem", width: "30%", borderRadius: RADIUS.sm }} />
      <div style={{ ...SHIMMER_BG, marginTop: "0.75rem", height: "1.25rem", width: "60%", borderRadius: RADIUS.sm }} />
      {Array.from({ length: Math.max(lines - 2, 1) }).map((_, i) => (
        <div
          key={i}
          style={{
            ...SHIMMER_BG,
            marginTop: "0.5rem",
            height: "0.875rem",
            width: `${85 - i * 8}%`,
            borderRadius: RADIUS.sm,
          }}
        />
      ))}
    </div>
  );
}
