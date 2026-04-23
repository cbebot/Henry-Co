import { CrossDivisionSearchExperience } from "@henryco/ui";
import { getStaffSearchResults } from "@/lib/search";
import { requireStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Search Staff HQ",
  description: "Search staff workspaces and queue destinations inside Staff HQ.",
};

export default async function StaffSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [viewer, params] = await Promise.all([requireStaff(), searchParams]);
  const query = String(params.q || "").trim();

  return (
    <CrossDivisionSearchExperience
      context="staff"
      title="Search Staff HQ workspaces and queues."
      description="This search is staff-only and permission-filtered. It includes only routes your current staff role can open."
      placeholder="Search staff: support queue, finance, care, marketplace, trust..."
      initialQuery={query}
      results={getStaffSearchResults(viewer)}
    />
  );
}
