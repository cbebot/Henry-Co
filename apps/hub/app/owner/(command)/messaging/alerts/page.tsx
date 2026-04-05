import DivisionBadge from "@/components/owner/DivisionBadge";
import StatusBadge from "@/components/owner/StatusBadge";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getMessagingCenterData } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

export default async function MessagingAlertsPage() {
  const data = await getMessagingCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Owner Alerts"
        title="Notification failures and skips"
        description="The owner alert board surfaces delivery problems immediately, including the live invalid sender issue already present in marketplace email alerts."
      />

      <OwnerPanel title="Failed or skipped owner alerts" description="These need configuration or data fixes.">
        <div className="space-y-3">
          {data.alerts.map((alert) => (
            <div key={alert.id} className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--acct-ink)]">{alert.subject}</div>
                  <p className="mt-2 text-sm text-[var(--acct-muted)]">{alert.error || "Skipped due to missing recipient coverage."}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <DivisionBadge division={alert.division} />
                  <StatusBadge status={alert.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </OwnerPanel>
    </div>
  );
}
