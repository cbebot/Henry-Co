import Link from "next/link";
import { PropertyStatusBadge, PropertyWorkspaceShell } from "@/components/property/ui";
import { requirePropertyRoles } from "@/lib/property/auth";
import { getPropertySnapshot } from "@/lib/property/data";
import { getWorkspaceNavigation } from "@/lib/property/navigation";

export const dynamic = "force-dynamic";

const DECISION_OPTIONS = [
  { value: "published", label: "Publish" },
  { value: "requires_correction", label: "Requires correction" },
  { value: "rejected", label: "Reject" },
  { value: "blocked", label: "Block" },
  { value: "escalated", label: "Escalate" },
] as const;

export default async function AdminListingsPage() {
  await requirePropertyRoles(["property_admin", "moderation", "listing_manager"], "/admin/listings");
  const snapshot = await getPropertySnapshot();

  const queue = snapshot.listings
    .filter((listing) => !["published", "approved", "archived"].includes(listing.status))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  return (
    <PropertyWorkspaceShell
      kicker="Admin"
      title="Listing governance queue"
      description="Review, request corrections, schedule inspections, and publish only when policy rails are satisfied."
      nav={getWorkspaceNavigation("/admin")}
    >
      <div className="property-panel rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="property-kicker">Pending submissions</div>
            <div className="mt-2 text-sm text-[var(--property-ink-soft)]">
              {queue.length} listing{queue.length === 1 ? "" : "s"} awaiting action
            </div>
          </div>
          <Link
            href="/admin"
            className="property-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
          >
            Back to admin
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          {queue.length === 0 ? (
            <div className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-5 text-sm text-[var(--property-ink-soft)]">
              No pending submissions right now.
            </div>
          ) : (
            queue.map((listing) => {
              const openInspection = snapshot.inspections.find(
                (inspection) =>
                  inspection.listingId === listing.id &&
                  ["requested", "scheduled"].includes(inspection.status)
              );

              return (
                <div
                  key={listing.id}
                  className="rounded-[1.8rem] border border-[var(--property-line)] bg-black/10 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-[16rem]">
                      <div className="text-lg font-semibold text-[var(--property-ink)]">
                        {listing.title}
                      </div>
                      <div className="mt-1 text-sm text-[var(--property-ink-soft)]">
                        {listing.locationLabel} · {listing.serviceType.replaceAll("_", " ")} ·{" "}
                        risk {listing.riskScore}/100
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <PropertyStatusBadge status={listing.status} />
                        {openInspection ? (
                          <PropertyStatusBadge status={`inspection_${openInspection.status}`} />
                        ) : null}
                      </div>
                      {listing.policySummary ? (
                        <div className="mt-3 text-sm text-[var(--property-ink-soft)]">
                          {listing.policySummary}
                        </div>
                      ) : null}
                    </div>

                    <form action="/api/property" method="POST" className="min-w-[18rem] space-y-3">
                      <input type="hidden" name="intent" value="listing_decision" />
                      <input type="hidden" name="return_to" value="/admin/listings" />
                      <input type="hidden" name="listing_id" value={listing.id} />

                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
                          Decision
                        </span>
                        <select
                          name="decision"
                          defaultValue="requires_correction"
                          className="property-select mt-2 w-full rounded-2xl px-4 py-3"
                        >
                          {DECISION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]">
                          Note (required for correction/block)
                        </span>
                        <textarea
                          name="note"
                          rows={3}
                          className="property-textarea mt-2 w-full rounded-2xl px-4 py-3"
                          placeholder="What must change, what proof is missing, or why this is blocked."
                        />
                      </label>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="submit"
                          className="property-button inline-flex rounded-full px-5 py-3 text-sm font-semibold"
                        >
                          Apply
                        </button>
                        <Link
                          href={`/property/${listing.slug}`}
                          className="property-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
                        >
                          View
                        </Link>
                      </div>
                    </form>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </PropertyWorkspaceShell>
  );
}

