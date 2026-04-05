import type { ReactNode } from "react";
import { StaffSurfaceRetired } from "@henryco/ui";

export default function RecruiterLayout({
  children,
}: {
  children: ReactNode;
}) {
  void children;
  return (
    <StaffSurfaceRetired
      division="HenryCo Jobs"
      body="Legacy recruiter dashboards have been retired while HenryCo Jobs prepares a rebuilt premium staff workspace."
      primaryHref="/"
      primaryLabel="Return to Jobs"
    />
  );
}
