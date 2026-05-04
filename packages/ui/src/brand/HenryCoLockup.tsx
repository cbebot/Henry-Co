import * as React from "react";
import { cn } from "../cn";
import { HenryCoMonogram } from "./HenryCoMonogram";
import { HenryCoWordmark, type HenryCoWordmarkProps } from "./HenryCoWordmark";

/**
 * HenryCoLockup — the canonical header lockup. Pairs the path-based
 * monogram (always crisp) with the serif wordmark (always legible).
 *
 * Use this in division headers and the hub navbar. For favicons, drop
 * back to `<HenryCoMonogram />` alone.
 */
export type HenryCoLockupProps = {
  height?: number;
  /** Forwarded to the wordmark — "full" or "compact". */
  wordmarkVariant?: HenryCoWordmarkProps["variant"];
  /** Override the wordmark font stack — defaults to the canonical
   * brand serif (Source Serif 4 via `var(--hc-font-serif)`). */
  fontFamily?: string;
  /** Brand accent for the monogram rule. */
  accent?: string;
  className?: string;
  /** Optional sub-line (e.g., a division name). */
  sub?: string;
  /** When true, the monogram + wordmark sit on the same baseline; when
   * false, the wordmark stacks under the monogram. */
  inline?: boolean;
};

export function HenryCoLockup({
  height = 32,
  wordmarkVariant = "full",
  fontFamily,
  accent,
  className,
  sub,
  inline = true,
}: HenryCoLockupProps) {
  const monogramSize = height;

  return (
    <span
      className={cn(
        "inline-flex items-center",
        inline ? "gap-3" : "flex-col gap-1",
        className,
      )}
    >
      <HenryCoMonogram size={monogramSize} accent={accent} />
      <span className="inline-flex flex-col leading-none">
        <HenryCoWordmark
          variant={wordmarkVariant}
          height={Math.round(height * 0.78)}
          fontFamily={fontFamily}
        />
        {sub ? (
          <span
            className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] opacity-70"
            style={{ letterSpacing: "0.22em" }}
          >
            {sub}
          </span>
        ) : null}
      </span>
    </span>
  );
}
