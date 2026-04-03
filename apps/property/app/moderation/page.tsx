import { PropertyStatusBadge, PropertyWorkspaceShell } from "@/components/property/ui";
import { getOperationsWorkspaceData, getPropertySnapshot } from "@/lib/property/data";
import { getWorkspaceNavigation } from "@/lib/property/navigation";
import { requirePropertyRoles } from "@/lib/property/auth";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  await requirePropertyRoles(["moderation", "listing_manager", "property_admin"], "/moderation");
  const [data, snapshot] = await Promise.all([getOperationsWorkspaceData(), getPropertySnapshot()]);

  return (
    <PropertyWorkspaceShell
      kicker="Moderation"
      title="Listing moderation and featuring"
      description="Approve, reject, request changes, and control which listings earn featured or promoted placement."
      nav={getWorkspaceNavigation("/moderation")}
    >
      <div className="space-y-5">
        {data.pendingListings.map((listing) => (
          <form key={listing.id} action="/api/property" method="POST" className="property-panel rounded-[2rem] p-6 sm:p-8">
            <input type="hidden" name="intent" value="listing_decision" />
            <input type="hidden" name="listing_id" value={listing.id} />
            <input type="hidden" name="return_to" value="/moderation" />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-2xl font-semibold tracking-[-0.04em] text-[var(--property-ink)]">
                  {listing.title}
                </div>
                <div className="mt-1 text-sm text-[var(--property-ink-soft)]">
                  {listing.locationLabel} · {formatCurrency(listing.price, listing.currency)}
                </div>
              </div>
              <PropertyStatusBadge status={listing.status} />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <select name="decision" defaultValue="approved" className="property-select rounded-2xl px-4 py-3">
                <option value="approved">Approve listing</option>
                <option value="changes_requested">Request changes</option>
                <option value="rejected">Reject listing</option>
              </select>
              <select name="agent_id" defaultValue={listing.agentId || ""} className="property-select rounded-2xl px-4 py-3">
                <option value="">Unassigned</option>
                {snapshot.agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
              <input
                name="note"
                className="property-input rounded-2xl px-4 py-3"
                placeholder="Review note for owner or agent"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-[var(--property-ink-soft)]">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" name="featured" value="1" defaultChecked={listing.featured} />
                Featured on editorial surfaces
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" name="promoted" value="1" defaultChecked={listing.promoted} />
                Promoted in search and campaigns
              </label>
            </div>

            <button type="submit" className="property-button-primary mt-5 inline-flex rounded-full px-5 py-3 text-sm font-semibold">
              Apply moderation decision
            </button>
          </form>
        ))}
      </div>
    </PropertyWorkspaceShell>
  );
}
