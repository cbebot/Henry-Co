import { StaffResourcePage } from "@/components/marketplace/staff-resource-page";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";

export const dynamic = "force-dynamic";

export default async function FinanceResourcePage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  await requireMarketplaceRoles(["marketplace_owner", "finance"], "/finance");
  const { resource } = await params;

  return <StaffResourcePage root="/finance" resource={resource} />;
}
