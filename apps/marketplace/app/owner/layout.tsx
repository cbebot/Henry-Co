import type { ReactNode } from "react";
import { StaffSurfaceRetired } from "@henryco/ui";

export default function MarketplaceOwnerLayout({
  children,
}: {
  children: ReactNode;
}) {
  void children;
  return (
    <StaffSurfaceRetired
      division="HenryCo Marketplace"
      body="Legacy marketplace owner dashboards have been retired while the next premium staff workspace is rebuilt."
      primaryHref="/"
      primaryLabel="Return to Marketplace"
    />
  );
}
