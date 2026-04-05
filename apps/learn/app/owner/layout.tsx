import type { ReactNode } from "react";
import { StaffSurfaceRetired } from "@henryco/ui";

export default function LearnOwnerLayout({
  children,
}: {
  children: ReactNode;
}) {
  void children;
  return (
    <StaffSurfaceRetired
      division="HenryCo Learn"
      body="Legacy learning owner dashboards have been retired while the next premium internal workspace is rebuilt."
      primaryHref="/"
      primaryLabel="Return to Learn"
    />
  );
}
