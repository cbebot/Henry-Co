import type { ReactNode } from "react";
import { StaffSurfaceRetired } from "@henryco/ui";

export default function MarketplaceModerationLayout({
  children,
}: {
  children: ReactNode;
}) {
  void children;
  return (
    <StaffSurfaceRetired
      division="HenryCo Marketplace"
      body="Legacy marketplace moderation routes have been retired while the premium internal workspace is rebuilt."
      primaryHref="/"
      primaryLabel="Return to Marketplace"
    />
  );
}
