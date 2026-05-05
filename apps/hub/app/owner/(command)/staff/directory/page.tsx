import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getWorkforceCenterData } from "@/lib/owner-data";
import { StaffDirectoryClient } from "@/components/owner/StaffDirectoryClient";

export const dynamic = "force-dynamic";

export default async function StaffDirectoryPage() {
  const data = await getWorkforceCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Staff intelligence"
        title="Directory"
        description="Search and filter every HenryCo workforce member by name, email, division, or status. Click through to the intelligence profile for deep context."
      />

      <OwnerPanel title="Filters & list" description="Live data from your connected account directory.">
        <StaffDirectoryClient
          members={data.members.map((m) => ({
            id: m.id,
            fullName: m.fullName,
            email: m.email,
            division: m.division,
            role: m.role,
            status: m.status,
            lastSeen: m.lastSeen,
          }))}
          divisionLabels={Object.fromEntries(
            data.divisionSummary.map((d) => [d.slug, d.label] as const)
          )}
        />
      </OwnerPanel>
    </div>
  );
}
