import type { ReactNode } from "react";

/** Passthrough: authenticated HQ shell lives under @/app/owner/(command)/layout.tsx */
export default function OwnerSegmentLayout({ children }: { children: ReactNode }) {
  return children;
}
