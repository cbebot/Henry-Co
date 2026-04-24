import type { HTMLAttributes } from "react";
import { HenryCoBrandedSpinner } from "./HenryCoBrandedSpinner";

/**
 * Lightweight branded activity indicator.
 *
 * Now delegates to `HenryCoBrandedSpinner` so every public consumer (buttons,
 * inline rows, route loaders) shares the same premium amber loading language.
 * API is preserved so existing callers keep working.
 */
export function HenryCoActivityIndicator({
  size = "md",
  label,
  className = "",
  ...rest
}: HTMLAttributes<HTMLSpanElement> & {
  size?: "sm" | "md";
  /** Visually hidden label for accessibility */
  label?: string;
}) {
  return (
    <HenryCoBrandedSpinner
      size={size}
      label={label}
      className={className}
      {...rest}
    />
  );
}
