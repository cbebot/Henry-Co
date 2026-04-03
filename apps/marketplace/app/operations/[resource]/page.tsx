import { StaffResourcePage } from "@/components/marketplace/staff-resource-page";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";

export const dynamic = "force-dynamic";

export default async function OperationsResourcePage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  await requireMarketplaceRoles(["marketplace_owner", "operations"], "/operations");
  const { resource } = await params;

  return <StaffResourcePage root="/operations" resource={resource} />;
}
