import type { ReactNode } from "react";
import { StaffSurfaceRetired } from "@henryco/ui";

export default function MarketplaceOperationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  void children;
  return (
    <StaffSurfaceRetired
      division="HenryCo Marketplace"
      body="Legacy marketplace operations routes have been retired while the premium internal workspace is rebuilt."
      primaryHref="/"
      primaryLabel="Return to Marketplace"
    />
  );
}
