import { getAccountUrl, getHubUrl } from "@henryco/config";
import { StaffSurfaceRetired } from "@henryco/ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  void params;
  return (
    <StaffSurfaceRetired
      division="Henry & Co. Workspace"
      title="The previous staff workspace has been retired."
      body="This workspace has been replaced. Staff tools are being rebuilt with improved performance and security across all divisions."
      primaryHref={getHubUrl("/")}
      primaryLabel="Open the company hub"
      secondaryHref={getAccountUrl("/")}
      secondaryLabel="Open HenryCo account"
    />
  );
}
