import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getSecurityCenterData } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

export default async function OwnerSecurityPage() {
  const data = await getSecurityCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Security"
        title="Security and privilege health"
        description="Central visibility into owner profiles, suspended accounts, and privilege-sensitive audit history."
      />

      <OwnerPanel title="Owner profiles" description="Current owner rows in the shared production project.">
        <table className="owner-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {data.ownerProfiles.map((row) => (
              <tr key={String(row.id)}>
                <td>{String(row.user_id || "")}</td>
                <td>{String(row.role || "owner")}</td>
                <td>{String(row.is_active ?? true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </OwnerPanel>
    </div>
  );
}
