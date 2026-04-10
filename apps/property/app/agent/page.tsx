import Link from "next/link";
import { PropertyEmptyState, PropertyStatusBadge, PropertyWorkspaceShell } from "@/components/property/ui";
import { getAgentWorkspaceData } from "@/lib/property/data";
import { getWorkspaceNavigation } from "@/lib/property/navigation";
import { requirePropertyRoles } from "@/lib/property/auth";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export default async function AgentWorkspacePage() {
  await requirePropertyRoles(["relationship_manager", "listing_manager", "property_admin"], "/agent");
  const data = await getAgentWorkspaceData();
  const listingMap = new Map(data.listings.map((listing) => [listing.id, listing]));

  return (
    <PropertyWorkspaceShell
      kicker="Agent"
      title="Assigned inquiry and viewing flow"
      description="Relationship managers and listing leads can update inquiry posture, schedule viewings, and keep seekers informed without leaving the live property workflow."
      nav={getWorkspaceNavigation("/agent")}
    >
      <section className="property-panel rounded-[2rem] p-6 sm:p-8">
        <div className="property-kicker">Assigned inquiries</div>
        {data.inquiries.length ? (
          <div className="mt-5 space-y-4">
            {data.inquiries.map((inquiry) => {
              const listing = listingMap.get(inquiry.listingId);
              return (
                <div
                  key={inquiry.id}
                  className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-[14rem]">
                      <div className="text-lg font-semibold text-[var(--property-ink)]">
                        {inquiry.name}
                      </div>
                      <div className="mt-1 text-sm text-[var(--property-ink-soft)]">
                        {inquiry.email}
                      </div>
                      <div className="mt-2 text-xs text-[var(--property-ink-muted)]">
                        {listing ? (
                          <Link href={`/property/${listing.slug}`} className="underline-offset-4 hover:underline">
                            {listing.title}
                          </Link>
                        ) : (
                          "Listing detail unavailable"
                        )}
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[var(--property-ink-soft)]">
                        {inquiry.message}
                      </p>
                    </div>

                    <form action="/api/property" method="POST" className="min-w-[18rem] space-y-3">
                      <input type="hidden" name="intent" value="inquiry_update" />
                      <input type="hidden" name="return_to" value="/agent" />
                      <input type="hidden" name="inquiry_id" value={inquiry.id} />
                      <input
                        type="hidden"
                        name="assigned_agent_id"
                        value={data.agent?.id || inquiry.assignedAgentId || ""}
                      />

                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
                          Status
                        </span>
                        <select
                          name="status"
                          defaultValue={inquiry.status}
                          className="property-select mt-2 w-full rounded-2xl px-4 py-3"
                        >
                          <option value="new">New</option>
                          <option value="acknowledged">Acknowledged</option>
                          <option value="assigned">Assigned</option>
                          <option value="in_progress">In progress</option>
                          <option value="closed">Closed</option>
                        </select>
                      </label>

                      <div className="flex items-center justify-between gap-3">
                        <PropertyStatusBadge status={inquiry.status} />
                        <button
                          type="submit"
                          className="property-button inline-flex rounded-full px-5 py-3 text-sm font-semibold"
                        >
                          Update inquiry
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              );
            })}
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
            {data.viewings.map((viewing) => {
              const listing = listingMap.get(viewing.listingId);
              return (
                <div key={viewing.id} className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-[14rem]">
                      <div className="text-lg font-semibold text-[var(--property-ink)]">
                        {viewing.attendeeName}
                      </div>
                      <div className="mt-1 text-sm text-[var(--property-ink-soft)]">
                        {viewing.attendeeEmail}
                      </div>
                      <div className="mt-2 text-xs text-[var(--property-ink-muted)]">
                        Preferred: {formatDate(viewing.preferredDate)}
                        {viewing.scheduledFor ? ` · Scheduled: ${formatDate(viewing.scheduledFor)}` : ""}
                      </div>
                      <div className="mt-2 text-xs text-[var(--property-ink-muted)]">
                        {listing ? (
                          <Link href={`/property/${listing.slug}`} className="underline-offset-4 hover:underline">
                            {listing.title}
                          </Link>
                        ) : (
                          "Listing detail unavailable"
                        )}
                      </div>
                    </div>

                    <form action="/api/property" method="POST" className="min-w-[20rem] space-y-3">
                      <input type="hidden" name="intent" value="viewing_update" />
                      <input type="hidden" name="return_to" value="/agent" />
                      <input type="hidden" name="viewing_id" value={viewing.id} />
                      <input
                        type="hidden"
                        name="assigned_agent_id"
                        value={data.agent?.id || viewing.assignedAgentId || ""}
                      />

                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="block">
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
                            Status
                          </span>
                          <select
                            name="status"
                            defaultValue={viewing.status}
                            className="property-select mt-2 w-full rounded-2xl px-4 py-3"
                          >
                            <option value="requested">Requested</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
                            Scheduled time
                          </span>
                          <input
                            type="datetime-local"
                            name="scheduled_for"
                            defaultValue={toDateTimeLocal(viewing.scheduledFor || viewing.preferredDate)}
                            className="property-input mt-2 w-full rounded-2xl px-4 py-3"
                          />
                        </label>
                      </div>

                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
                          Notes
                        </span>
                        <textarea
                          name="notes"
                          rows={3}
                          defaultValue={viewing.notes}
                          className="property-textarea mt-2 w-full rounded-2xl px-4 py-3"
                          placeholder="Access details, confirmation note, or update for the viewer."
                        />
                      </label>

                      <div className="flex items-center justify-between gap-3">
                        <PropertyStatusBadge status={viewing.status} />
                        <button
                          type="submit"
                          className="property-button inline-flex rounded-full px-5 py-3 text-sm font-semibold"
                        >
                          Update viewing
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              );
            })}
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
