import type { ReactNode } from "react";

const STYLE = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  borderWidth: 0,
} as const;

export function VisuallyHidden({
  children,
  as: As = "span",
}: {
  children: ReactNode;
  as?: "span" | "div" | "p";
}) {
  return <As style={STYLE as React.CSSProperties}>{children}</As>;
}
