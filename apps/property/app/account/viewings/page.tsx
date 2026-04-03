import { PropertyEmptyState, PropertyStatusBadge, PropertyWorkspaceShell } from "@/components/property/ui";
import { getPropertyDashboardData, getPropertySnapshot } from "@/lib/property/data";
import { getAccountNavigation } from "@/lib/property/navigation";
import { requirePropertyUser } from "@/lib/property/auth";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ViewingsPage() {
  await requirePropertyUser("/account/viewings");
  const [data, snapshot] = await Promise.all([getPropertyDashboardData(), getPropertySnapshot()]);

  return (
    <PropertyWorkspaceShell
      kicker="Viewings"
      title="Viewing requests and schedules"
      description="Viewing requests, confirmation windows, and reminders remain visible here instead of disappearing into ad hoc chat follow-up."
      nav={getAccountNavigation("/account/viewings")}
    >
      {data.viewings.length ? (
        <div className="space-y-4">
          {data.viewings.map((viewing) => {
            const listing = snapshot.listings.find((item) => item.id === viewing.listingId);
            return (
              <section key={viewing.id} className="property-paper rounded-[1.8rem] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-[var(--property-ink)]">
                      {listing?.title || "Property viewing"}
                    </div>
                    <div className="mt-1 text-sm text-[var(--property-ink-soft)]">
                      Preferred: {formatDate(viewing.preferredDate)}
                    </div>
                  </div>
                  <PropertyStatusBadge status={viewing.status} />
                </div>
                <div className="mt-4 text-sm leading-7 text-[var(--property-ink-soft)]">
                  Scheduled: {formatDate(viewing.scheduledFor)}
                </div>
                {viewing.notes ? (
                  <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">{viewing.notes}</p>
                ) : null}
              </section>
            );
          })}
        </div>
      ) : (
        <PropertyEmptyState
          title="No viewing requests yet."
          body="Request a viewing from any live property page and the appointment record will appear here."
        />
      )}
    </PropertyWorkspaceShell>
  );
}
