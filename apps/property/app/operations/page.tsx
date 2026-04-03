import { PropertyStatusBadge, PropertyWorkspaceShell } from "@/components/property/ui";
import { getOperationsWorkspaceData, getPropertySnapshot } from "@/lib/property/data";
import { getWorkspaceNavigation } from "@/lib/property/navigation";
import { requirePropertyRoles } from "@/lib/property/auth";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; decision?: string }>;
}) {
  await requirePropertyRoles(
    ["managed_ops", "listing_manager", "relationship_manager", "property_admin"],
    "/operations"
  );
  const [data, snapshot, params] = await Promise.all([
    getOperationsWorkspaceData(),
    getPropertySnapshot(),
    searchParams,
  ]);

  return (
    <PropertyWorkspaceShell
      kicker="Operations"
      title="Property operations control room"
      description="Moderate listings, assign follow-up, schedule viewings, and keep managed-property records moving through one operational surface."
      nav={getWorkspaceNavigation("/operations")}
    >
      {params.updated === "1" || params.decision ? (
        <div className="rounded-[1.5rem] border border-[var(--property-line)] bg-black/10 px-4 py-3 text-sm text-[var(--property-ink-soft)]">
          Workflow updated successfully.
        </div>
      ) : null}

      <section className="property-panel rounded-[2rem] p-6 sm:p-8">
        <div className="property-kicker">Pending listings</div>
        <div className="mt-5 space-y-5">
          {data.pendingListings.map((listing) => (
            <form key={listing.id} action="/api/property" method="POST" className="rounded-[1.7rem] border border-[var(--property-line)] bg-black/10 p-5">
              <input type="hidden" name="intent" value="listing_decision" />
              <input type="hidden" name="listing_id" value={listing.id} />
              <input type="hidden" name="return_to" value="/operations" />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xl font-semibold text-[var(--property-ink)]">{listing.title}</div>
                  <div className="mt-1 text-sm text-[var(--property-ink-soft)]">
                    {listing.locationLabel} · {formatCurrency(listing.price, listing.currency)}
                  </div>
                </div>
                <PropertyStatusBadge status={listing.status} />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-medium text-[var(--property-ink)]">Decision</span>
                  <select name="decision" defaultValue={listing.status} className="property-select mt-2 rounded-2xl px-4 py-3">
                    <option value="approved">Approve</option>
                    <option value="changes_requested">Changes requested</option>
                    <option value="rejected">Reject</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-[var(--property-ink)]">Assign agent</span>
                  <select name="agent_id" defaultValue={listing.agentId || ""} className="property-select mt-2 rounded-2xl px-4 py-3">
                    <option value="">Unassigned</option>
                    {snapshot.agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-[var(--property-ink)]">Review note</span>
                  <input name="note" className="property-input mt-2 rounded-2xl px-4 py-3" placeholder="Moderation context" />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-[var(--property-ink-soft)]">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" name="featured" value="1" defaultChecked={listing.featured} />
                  Featured
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" name="promoted" value="1" defaultChecked={listing.promoted} />
                  Promoted
                </label>
              </div>

              <button type="submit" className="property-button-primary mt-4 inline-flex rounded-full px-5 py-3 text-sm font-semibold">
                Save listing decision
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="property-panel rounded-[2rem] p-6 sm:p-8">
          <div className="property-kicker">Inquiry queue</div>
          <div className="mt-5 space-y-4">
            {data.pendingInquiries.map((inquiry) => (
              <form key={inquiry.id} action="/api/property" method="POST" className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4">
                <input type="hidden" name="intent" value="inquiry_update" />
                <input type="hidden" name="inquiry_id" value={inquiry.id} />
                <input type="hidden" name="return_to" value="/operations" />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-[var(--property-ink)]">{inquiry.name}</div>
                    <div className="mt-1 text-sm text-[var(--property-ink-soft)]">{inquiry.email}</div>
                  </div>
                  <PropertyStatusBadge status={inquiry.status} />
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <select name="status" defaultValue={inquiry.status} className="property-select rounded-2xl px-4 py-3">
                    <option value="new">New</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In progress</option>
                    <option value="closed">Closed</option>
                  </select>
                  <select name="assigned_agent_id" defaultValue={inquiry.assignedAgentId || ""} className="property-select rounded-2xl px-4 py-3">
                    <option value="">Unassigned</option>
                    {snapshot.agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="property-button-secondary mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold">
                  Update inquiry
                </button>
              </form>
            ))}
          </div>
        </div>

        <div className="property-panel rounded-[2rem] p-6 sm:p-8">
          <div className="property-kicker">Viewing scheduling</div>
          <div className="mt-5 space-y-4">
            {data.pendingViewings.map((viewing) => (
              <form key={viewing.id} action="/api/property" method="POST" className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4">
                <input type="hidden" name="intent" value="viewing_update" />
                <input type="hidden" name="viewing_id" value={viewing.id} />
                <input type="hidden" name="return_to" value="/operations" />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-[var(--property-ink)]">{viewing.attendeeName}</div>
                    <div className="mt-1 text-sm text-[var(--property-ink-soft)]">
                      Preferred: {formatDate(viewing.preferredDate)}
                    </div>
                  </div>
                  <PropertyStatusBadge status={viewing.status} />
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <select name="status" defaultValue={viewing.status} className="property-select rounded-2xl px-4 py-3">
                    <option value="requested">Requested</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <input
                    name="scheduled_for"
                    type="datetime-local"
                    className="property-input rounded-2xl px-4 py-3"
                  />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <select name="assigned_agent_id" defaultValue={viewing.assignedAgentId || ""} className="property-select rounded-2xl px-4 py-3">
                    <option value="">Unassigned</option>
                    {snapshot.agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                  <input
                    name="notes"
                    defaultValue={viewing.notes}
                    className="property-input rounded-2xl px-4 py-3"
                    placeholder="Scheduling note"
                  />
                </div>
                <button type="submit" className="property-button-secondary mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold">
                  Update viewing
                </button>
              </form>
            ))}
          </div>
        </div>
      </section>

      <section className="property-panel rounded-[2rem] p-6 sm:p-8">
        <div className="property-kicker">Managed-property ops</div>
        <div className="mt-5 space-y-4">
          {data.managedRecords.map((record) => (
            <form key={record.id} action="/api/property" method="POST" className="rounded-[1.7rem] border border-[var(--property-line)] bg-black/10 p-5">
              <input type="hidden" name="intent" value="managed_record_update" />
              <input type="hidden" name="record_id" value={record.id} />
              <input type="hidden" name="return_to" value="/operations" />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xl font-semibold text-[var(--property-ink)]">{record.title}</div>
                  <div className="mt-1 text-sm text-[var(--property-ink-soft)]">{record.ownerName}</div>
                </div>
                <PropertyStatusBadge status={record.status} />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <select name="status" defaultValue={record.status} className="property-select rounded-2xl px-4 py-3">
                  <option value="active">Active</option>
                  <option value="pipeline">Pipeline</option>
                  <option value="archived">Archived</option>
                </select>
                <select name="assigned_manager_id" defaultValue={record.assignedManagerId || ""} className="property-select rounded-2xl px-4 py-3">
                  <option value="">Unassigned</option>
                  {snapshot.agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
                <input
                  defaultValue={record.serviceLines.join(", ")}
                  name="service_lines"
                  className="property-input rounded-2xl px-4 py-3"
                  placeholder="Service lines"
                />
              </div>

              <textarea
                name="narrative"
                rows={3}
                defaultValue={record.narrative}
                className="property-textarea mt-4 rounded-2xl px-4 py-3"
              />

              <button type="submit" className="property-button-primary mt-4 inline-flex rounded-full px-5 py-3 text-sm font-semibold">
                Save managed update
              </button>
            </form>
          ))}
        </div>
      </section>
    </PropertyWorkspaceShell>
  );
}
