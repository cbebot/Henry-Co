import type { ReactNode } from "react";
import { StaffSurfaceRetired } from "@henryco/ui";

export default async function StaffShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  void children;
  return (
    <StaffSurfaceRetired
      division="HenryCo Care"
      body="Legacy staff, rider, support, manager, and owner dashboards have been retired while HenryCo Care prepares a rebuilt premium internal workspace."
      primaryHref="/"
      primaryLabel="Return to Fabric Care"
    />
  );
}
