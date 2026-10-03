import { StaffResourcePage } from "@/components/marketplace/staff-resource-page";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";

export const dynamic = "force-dynamic";

export default async function AdminResourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ resource: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireMarketplaceRoles(["marketplace_owner", "marketplace_admin"], "/admin");
  const { resource } = await params;
  const query = (await searchParams) ?? {};

  return (
    <StaffResourcePage
      root="/admin"
      resource={resource}
      error={typeof query.error === "string" ? query.error : undefined}
    />
  );
}
