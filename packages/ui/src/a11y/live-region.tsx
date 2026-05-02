"use client";

import type { ReactNode } from "react";

export function LiveRegion({
  politeness = "polite",
  atomic = true,
  children,
  className,
}: {
  politeness?: "polite" | "assertive" | "off";
  atomic?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className={className}
      style={
        className
          ? undefined
          : {
              position: "absolute",
              width: "1px",
              height: "1px",
              padding: 0,
              margin: "-1px",
              overflow: "hidden",
              clip: "rect(0, 0, 0, 0)",
              whiteSpace: "nowrap",
              borderWidth: 0,
            }
      }
    >
      {children}
    </div>
  );
}
