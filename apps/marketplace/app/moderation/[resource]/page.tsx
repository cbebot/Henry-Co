import { StaffResourcePage } from "@/components/marketplace/staff-resource-page";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";

export const dynamic = "force-dynamic";

export default async function ModerationResourcePage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  await requireMarketplaceRoles(["marketplace_owner", "marketplace_admin", "moderation"], "/moderation");
  const { resource } = await params;

  return <StaffResourcePage root="/moderation" resource={resource} />;
}
