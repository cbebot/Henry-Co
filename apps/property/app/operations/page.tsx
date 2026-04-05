import { StaffSurfaceRetired } from "@henryco/ui";

export const dynamic = "force-dynamic";

export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; decision?: string }>;
}) {
  void searchParams;
  return (
    <StaffSurfaceRetired
      division="HenryCo Property"
      body="Legacy property operations dashboards have been retired while the next premium staff workspace is rebuilt."
      primaryHref="/"
      primaryLabel="Return to Property"
    />
  );
}
