import Link from "next/link";
import {
  PropertyEmptyState,
  PropertyMetricCard,
  PropertyStatusBadge,
  PropertyWorkspaceShell,
} from "@/components/property/ui";
import { requirePropertyRoles } from "@/lib/property/auth";
import { getPropertyGovernanceWorkspaceData } from "@/lib/property/data";
import { getWorkspaceNavigation } from "@/lib/property/navigation";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  await requirePropertyRoles(["moderation", "listing_manager", "property_admin"], "/moderation");
  const data = await getPropertyGovernanceWorkspaceData();

  const escalated = data.queue.filter((item) => item.status === "escalated").length;
  const blocked = data.queue.filter((item) => item.status === "blocked").length;
  const corrections = data.queue.filter((item) =>
    ["requires_correction", "changes_requested"].includes(item.status)
  ).length;

  return (
    <PropertyWorkspaceShell
      kicker="Moderation"
      title="Moderation posture and exception handling"
      description="Keep risky listings out of publication, surface the correction backlog, and route serious exceptions into the full governance queue."
      nav={getWorkspaceNavigation("/moderation")}
      actions={
        <Link
          href="/admin/listings"
          className="property-button inline-flex rounded-full px-5 py-3 text-sm font-semibold"
        >
          Open full governance queue
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <PropertyMetricCard
          label="Queue"
          value={String(data.queue.length)}
          hint="Listings still in moderation, trust review, or inspection-sensitive states."
        />
        <PropertyMetricCard
          label="Corrections"
          value={String(corrections)}
          hint="Listings that need better copy, stronger evidence, or clearer readiness details."
        />
        <PropertyMetricCard
          label="Blocked"
          value={String(blocked)}
          hint="Listings held back because the trust posture is currently too weak."
        />
        <PropertyMetricCard
          label="Escalated"
          value={String(escalated)}
          hint="Listings that need higher-scrutiny operator review before moving forward."
        />
      </div>

      <section className="property-panel rounded-[2rem] p-6 sm:p-8">
        <div className="property-kicker">Priority moderation cases</div>
        {data.queue.length ? (
          <div className="mt-5 space-y-4">
            {data.queue.slice(0, 8).map((listing) => {
              const application = data.applicationsByListingId.get(listing.id);
              const inspection = data.inspectionsByListingId.get(listing.id);
              return (
                <article
                  key={listing.id}
                  className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold text-[var(--property-ink)]">
                        {listing.title}
                      </div>
                      <div className="mt-1 text-sm text-[var(--property-ink-soft)]">
                        {listing.locationLabel} · risk {listing.riskScore}/100 · updated {formatDate(listing.updatedAt)}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <PropertyStatusBadge status={listing.status} />
                        {inspection ? <PropertyStatusBadge status={`inspection_${inspection.status}`} /> : null}
                      </div>
                      {application?.reviewNote ? (
                        <p className="mt-3 text-sm leading-7 text-[var(--property-ink-soft)]">
                          {application.reviewNote}
                        </p>
                      ) : null}
                    </div>
                    <Link
                      href="/admin/listings"
                      className="property-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
                    >
                      Review in queue
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-5">
            <PropertyEmptyState
              title="No moderation cases waiting."
              body="The full governance queue will repopulate here as new listings hit trust review, correction, or escalation states."
            />
          </div>
        )}
      </section>
    </PropertyWorkspaceShell>
  );
}
