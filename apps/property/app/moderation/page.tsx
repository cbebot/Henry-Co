import { StaffSurfaceRetired } from "@henryco/ui";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  return (
    <StaffSurfaceRetired
      division="HenryCo Property"
      body="Legacy property moderation dashboards have been retired while the next premium staff workspace is rebuilt."
      primaryHref="/"
      primaryLabel="Return to Property"
    />
  );
}
