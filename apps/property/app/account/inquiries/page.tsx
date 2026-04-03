import { PropertyEmptyState, PropertyStatusBadge, PropertyWorkspaceShell } from "@/components/property/ui";
import { getPropertyDashboardData, getPropertySnapshot } from "@/lib/property/data";
import { getAccountNavigation } from "@/lib/property/navigation";
import { requirePropertyUser } from "@/lib/property/auth";

export const dynamic = "force-dynamic";

export default async function InquiriesPage() {
  await requirePropertyUser("/account/inquiries");
  const [data, snapshot] = await Promise.all([getPropertyDashboardData(), getPropertySnapshot()]);

  return (
    <PropertyWorkspaceShell
      kicker="Inquiries"
      title="Inquiry history"
      description="Every inquiry is persisted so follow-up is visible and future HenryCo account unification has a clean audit trail."
      nav={getAccountNavigation("/account/inquiries")}
    >
      {data.inquiries.length ? (
        <div className="space-y-4">
          {data.inquiries.map((inquiry) => {
            const listing = snapshot.listings.find((item) => item.id === inquiry.listingId);
            return (
              <section key={inquiry.id} className="property-paper rounded-[1.8rem] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-[var(--property-ink)]">
                      {listing?.title || "Property inquiry"}
                    </div>
                    <div className="mt-1 text-sm text-[var(--property-ink-soft)]">{inquiry.email}</div>
                  </div>
                  <PropertyStatusBadge status={inquiry.status} />
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--property-ink-soft)]">{inquiry.message}</p>
              </section>
            );
          })}
        </div>
      ) : (
        <PropertyEmptyState
          title="No inquiries yet."
          body="The first inquiry you submit from a listing page will appear here with its follow-up status."
        />
      )}
    </PropertyWorkspaceShell>
  );
}
