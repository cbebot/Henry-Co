import type { ReactNode } from "react";
import { cn } from "../cn";
import { HenryCoActivityIndicator } from "./HenryCoActivityIndicator";

export function ButtonPendingContent({
  pending,
  children,
  pendingLabel,
  spinnerLabel = "Loading",
  indicatorSize = "sm",
  className,
  textClassName,
  spinnerClassName,
}: {
  pending: boolean;
  children: ReactNode;
  pendingLabel?: ReactNode;
  spinnerLabel?: string;
  indicatorSize?: "sm" | "md";
  className?: string;
  textClassName?: string;
  spinnerClassName?: string;
}) {
  const activeContent = pendingLabel ?? children;

  return (
    <span className={cn("grid place-items-center", className)}>
      <span
        className={cn(
          "col-start-1 row-start-1 inline-flex items-center justify-center gap-2 whitespace-nowrap transition-opacity duration-150",
          pending ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!pending}
      >
        <span className="inline-flex min-w-4 items-center justify-center">
          <HenryCoActivityIndicator
            size={indicatorSize}
            label={spinnerLabel}
            className={spinnerClassName}
          />
        </span>
        <span className={textClassName}>{activeContent}</span>
      </span>
      <span
        className={cn(
          "col-start-1 row-start-1 inline-flex items-center justify-center gap-2 whitespace-nowrap transition-opacity duration-150",
          pending ? "pointer-events-none opacity-0" : "opacity-100"
        )}
        aria-hidden={pending}
      >
        <span className="inline-flex min-w-4 items-center justify-center" aria-hidden />
        <span className={textClassName}>{children}</span>
      </span>
    </span>
  );
}
