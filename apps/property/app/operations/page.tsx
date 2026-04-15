import Link from "next/link";
import {
  PropertyEmptyState,
  PropertyManagedRecordCard,
  PropertyMetricCard,
  PropertyStatusBadge,
  PropertyWorkspaceShell,
} from "@/components/property/ui";
import { requirePropertyRoles } from "@/lib/property/auth";
import { getOperationsWorkspaceData, getPropertySnapshot } from "@/lib/property/data";
import { getWorkspaceNavigation } from "@/lib/property/navigation";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const INSPECTION_OPTIONS = [
  { value: "requested", label: "Requested" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "waived", label: "Waived" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export default async function OperationsPage() {
  await requirePropertyRoles(["managed_ops", "relationship_manager", "property_admin"], "/operations");
  const [data, snapshot] = await Promise.all([getOperationsWorkspaceData(), getPropertySnapshot()]);
  const listingMap = new Map(snapshot.listings.map((listing) => [listing.id, listing]));

  return (
    <PropertyWorkspaceShell
      kicker="Operations"
      title="Inspection, viewing, and managed-property operations"
      description="Coordinate the real-world workflow behind trusted property listings: inspections, viewings, inquiry handoff, and managed portfolio continuity."
      nav={getWorkspaceNavigation("/operations")}
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/listings"
            className="property-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
          >
            Open governance queue
          </Link>
          <Link
            href="/agent"
            className="property-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
          >
            Open agent workflow
          </Link>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <PropertyMetricCard
          label="Listings"
          value={String(data.pendingListings.length)}
          hint="Listings still moving through trust, document, or inspection operations."
        />
        <PropertyMetricCard
          label="Inspections"
          value={String(data.inspections.length)}
          hint="Open inspections still requiring a scheduling or closure decision."
        />
        <PropertyMetricCard
          label="Viewings"
          value={String(data.pendingViewings.length)}
          hint="Viewing requests still being scheduled, confirmed, or completed."
        />
        <PropertyMetricCard
          label="Inquiries"
          value={String(data.pendingInquiries.length)}
          hint="Leads still open across support and relationship-management surfaces."
        />
      </div>

      <section className="property-panel rounded-[2rem] p-6 sm:p-8">
        <div className="property-kicker">Inspection queue</div>
        {data.inspections.length ? (
          <div className="mt-5 space-y-4">
            {data.inspections.map((inspection) => {
              const listing = listingMap.get(inspection.listingId);
              return (
                <article
                  key={inspection.id}
                  className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4"
                >
                  <div className="grid gap-4 xl:grid-cols-[1fr,0.9fr]">
                    <div>
                      <div className="text-lg font-semibold text-[var(--property-ink)]">
                        {listing?.title || "Inspection-linked listing"}
                      </div>
                      <div className="mt-1 text-sm text-[var(--property-ink-soft)]">
                        {listing?.locationLabel || "Location pending"} · {formatDate(inspection.updatedAt)}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <PropertyStatusBadge status={inspection.status} />
                        {listing ? <PropertyStatusBadge status={listing.status} /> : null}
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[var(--property-ink-soft)]">
                        {inspection.reason}
                      </p>
                      {inspection.locationNotes ? (
                        <p className="mt-3 text-xs leading-6 text-[var(--property-ink-soft)]">
                          Access notes: {inspection.locationNotes}
                        </p>
                      ) : null}
                    </div>

                    <form action="/api/property" method="POST" className="space-y-3">
                      <input type="hidden" name="intent" value="inspection_update" />
                      <input type="hidden" name="return_to" value="/operations" />
                      <input type="hidden" name="inspection_id" value={inspection.id} />
                      <input type="hidden" name="listing_id" value={inspection.listingId} />

                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
                          Status
                        </span>
                        <select
                          name="status"
                          defaultValue={inspection.status}
                          className="property-select mt-2 w-full rounded-2xl px-4 py-3"
                        >
                          {INSPECTION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
                          Scheduled time
                        </span>
                        <input
                          type="datetime-local"
                          name="scheduled_for"
                          defaultValue={toDateTimeLocal(inspection.scheduledFor)}
                          className="property-input mt-2 w-full rounded-2xl px-4 py-3"
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
                          Outcome notes
                        </span>
                        <textarea
                          name="outcome_notes"
                          rows={3}
                          defaultValue={inspection.outcomeNotes || ""}
                          className="property-textarea mt-2 w-full rounded-2xl px-4 py-3"
                          placeholder="What happened onsite, what was confirmed, or why this was waived."
                        />
                      </label>

                      <button
                        type="submit"
                        className="property-button inline-flex rounded-full px-5 py-3 text-sm font-semibold"
                      >
                        Save inspection update
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-5">
            <PropertyEmptyState
              title="No active inspections."
              body="Inspection-sensitive listings will appear here when they need scheduling, closure, or a waiver decision."
            />
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="property-panel rounded-[2rem] p-6 sm:p-8">
          <div className="property-kicker">Viewing pipeline</div>
          {data.pendingViewings.length ? (
            <div className="mt-5 space-y-4">
              {data.pendingViewings.slice(0, 8).map((viewing) => {
                const listing = listingMap.get(viewing.listingId);
                return (
                  <div
                    key={viewing.id}
                    className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-[var(--property-ink)]">
                          {viewing.attendeeName}
                        </div>
                        <div className="mt-1 text-sm text-[var(--property-ink-soft)]">
                          {listing?.title || "Listing pending"} · preferred {formatDate(viewing.preferredDate)}
                        </div>
                      </div>
                      <PropertyStatusBadge status={viewing.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-5">
              <PropertyEmptyState
                title="No active viewings."
                body="Requested, scheduled, and confirmed viewings will appear here when operations attention is needed."
              />
            </div>
          )}
        </div>

        <div className="property-panel rounded-[2rem] p-6 sm:p-8">
          <div className="property-kicker">Managed portfolio</div>
          {data.managedRecords.length ? (
            <div className="mt-5 space-y-4">
              {data.managedRecords.slice(0, 4).map((record) => (
                <PropertyManagedRecordCard key={record.id} record={record} compact />
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <PropertyEmptyState
                title="No managed portfolio records."
                body="Managed-property records will appear here once listings move into operational handoff."
              />
            </div>
          )}
        </div>
      </section>
    </PropertyWorkspaceShell>
  );
}
