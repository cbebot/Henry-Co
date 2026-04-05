import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getWorkforceCenterData } from "@/lib/owner-data";
import type { WorkforcePermissionOption } from "@/lib/owner-workforce-catalog";

export const dynamic = "force-dynamic";

export default async function StaffRolesPage() {
  const data = await getWorkforceCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Roles & permissions"
        title="Access model"
        description="Permission keys define what each team member can do in HQ. Pair them with a division when the role is division-scoped."
      />

      <OwnerPanel title="Permission catalogue" description="Keys you can assign when editing staff.">
        <table className="owner-table">
          <thead>
            <tr>
              <th>Permission</th>
              <th>Group</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {data.permissionOptions.map((permission: WorkforcePermissionOption) => (
              <tr key={permission.key}>
                <td>{permission.key}</td>
                <td>{permission.group}</td>
                <td>{permission.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </OwnerPanel>

      <OwnerPanel title="Recent workforce audit" description="Role and access changes recorded for compliance.">
        <table className="owner-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Entity</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {data.audit.map((row) => (
              <tr key={String(row.id)}>
                <td>{String(row.action || "staff.change")}</td>
                <td>{String(row.entity_id || "staff")}</td>
                <td>{String(row.created_at || "")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </OwnerPanel>
    </div>
  );
}
