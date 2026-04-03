import { StaffResourcePage } from "@/components/marketplace/staff-resource-page";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";

export const dynamic = "force-dynamic";

export default async function OwnerResourcePage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  await requireMarketplaceRoles(["marketplace_owner"], "/owner");
  const { resource } = await params;

  return <StaffResourcePage root="/owner" resource={resource} />;
}
