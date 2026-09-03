import type { CSSProperties, ReactNode } from "react";

export interface AiProseProps {
  children: ReactNode;
  /**
   * "chat" — compact, for chat bubbles and inline drafts (default).
   * "reading" — full editorial reading size, for long-form paid results.
   */
  size?: "chat" | "reading";
  className?: string;
  style?: CSSProperties;
}

/**
 * AiProse — the ONE wrapper for AI-authored text across Henry Onyx.
 *
 * Renders in the brand editorial reading serif: `.hc-prose` owns the reading face + rhythm,
 * and COLOUR is inherited (never forced), so it is safe to drop on any surface or theme.
 * Routing every AI reply, draft, and analysis through this keeps the AI's written voice
 * visually consistent across every division, and lets the whole company flip its reading
 * face from a single seam (`--font-reading`) without touching each surface.
 *
 * The real brand serif (Fraunces) resolves wherever the host app points `--font-reading` at
 * a loaded font; until then it falls back to a premium system serif, never sans.
 */
export function AiProse({ children, size = "chat", className, style }: AiProseProps) {
  return (
    <div
      className={["hc-prose", "hc-ai-prose", `hc-ai-prose--${size}`, className]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {children}
    </div>
  );
}
