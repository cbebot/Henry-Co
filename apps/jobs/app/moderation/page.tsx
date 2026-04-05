import { StaffSurfaceRetired } from "@henryco/ui";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  return (
    <StaffSurfaceRetired
      division="HenryCo Jobs"
      body="Legacy moderation dashboards have been retired while HenryCo Jobs prepares a rebuilt premium staff workspace."
      primaryHref="/"
      primaryLabel="Return to Jobs"
    />
  );
}
