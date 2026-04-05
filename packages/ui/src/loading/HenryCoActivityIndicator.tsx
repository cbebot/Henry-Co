import type { HTMLAttributes } from "react";

/**
 * Lightweight branded activity indicator — no minimum duration, no blocking timers.
 * Use inside buttons (small) or inline rows.
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
  const dim = size === "sm" ? "h-4 w-4 border-2" : "h-5 w-5 border-2";
  return (
    <span
      role="status"
      className={`inline-flex items-center justify-center ${className}`}
      {...rest}
    >
      <span
        className={`${dim} rounded-full border-current border-t-transparent animate-spin opacity-90`}
        aria-hidden
      />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
