import { PropertyEmptyState, PropertyStatusBadge, PropertyWorkspaceShell } from "@/components/property/ui";
import { getAgentWorkspaceData } from "@/lib/property/data";
import { getWorkspaceNavigation } from "@/lib/property/navigation";
import { requirePropertyRoles } from "@/lib/property/auth";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AgentWorkspacePage() {
  await requirePropertyRoles(["relationship_manager", "listing_manager", "property_admin"], "/agent");
  const data = await getAgentWorkspaceData();

  return (
    <PropertyWorkspaceShell
      kicker="Agent"
      title="Assigned inquiry and viewing flow"
      description="Relationship managers and listing leads can track the listings, inquiries, and viewing requests currently attached to their portfolio."
      nav={getWorkspaceNavigation("/agent")}
    >
      <section className="property-panel rounded-[2rem] p-6 sm:p-8">
        <div className="property-kicker">Assigned inquiries</div>
        {data.inquiries.length ? (
          <div className="mt-5 space-y-4">
            {data.inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4"
              >
                <div>
                  <div className="text-lg font-semibold text-[var(--property-ink)]">{inquiry.name}</div>
                  <div className="mt-1 text-sm text-[var(--property-ink-soft)]">{inquiry.email}</div>
                </div>
                <PropertyStatusBadge status={inquiry.status} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <PropertyEmptyState
              title="No inquiries assigned."
              body="When inquiries are assigned to this agent, they will appear here with the latest status."
            />
          </div>
        )}
      </section>

      <section className="property-panel rounded-[2rem] p-6 sm:p-8">
        <div className="property-kicker">Assigned viewings</div>
        {data.viewings.length ? (
          <div className="mt-5 space-y-4">
            {data.viewings.map((viewing) => (
              <div key={viewing.id} className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-[var(--property-ink)]">{viewing.attendeeName}</div>
                    <div className="mt-1 text-sm text-[var(--property-ink-soft)]">
                      Preferred: {formatDate(viewing.preferredDate)}
                    </div>
                  </div>
                  <PropertyStatusBadge status={viewing.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <PropertyEmptyState
              title="No viewings assigned."
              body="Confirmed and in-flight viewing requests will surface here once scheduled."
            />
          </div>
        )}
      </section>
    </PropertyWorkspaceShell>
  );
}
