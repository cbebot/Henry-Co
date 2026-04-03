import { PropertyMetricCard, PropertyStatusBadge, PropertyWorkspaceShell } from "@/components/property/ui";
import { requirePropertyRoles } from "@/lib/property/auth";
import { getPropertySnapshot } from "@/lib/property/data";
import { getWorkspaceNavigation } from "@/lib/property/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requirePropertyRoles(["property_admin"], "/admin");
  const snapshot = await getPropertySnapshot();

  const approved = snapshot.listings.filter((item) => item.status === "approved").length;
  const submitted = snapshot.listings.filter((item) => item.status === "submitted").length;
  const messagingFailures = snapshot.notifications.filter((item) => item.status === "failed").length;
  const emailConfigured = Boolean(process.env.RESEND_API_KEY);
  const whatsappConfigured = Boolean(
    process.env.TWILIO_ACCOUNT_SID ||
      (process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN)
  );

  return (
    <PropertyWorkspaceShell
      kicker="Admin"
      title="Property platform governance"
      description="Monitor live inventory, messaging health, moderation backlog, and the current readiness of the platform’s operator stack."
      nav={getWorkspaceNavigation("/admin")}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <PropertyMetricCard label="Approved" value={String(approved)} hint="Listings currently live on the public property surface." />
        <PropertyMetricCard label="Pending" value={String(submitted)} hint="Listings waiting for moderation or revision." />
        <PropertyMetricCard label="Notifications" value={String(snapshot.notifications.length)} hint="Recorded email and WhatsApp delivery events." />
        <PropertyMetricCard label="Failures" value={String(messagingFailures)} hint="Notification records marked as failed." />
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="property-panel rounded-[2rem] p-6 sm:p-8">
          <div className="property-kicker">Messaging health</div>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4">
              <div>
                <div className="text-lg font-semibold text-[var(--property-ink)]">Email automation</div>
                <div className="mt-1 text-sm text-[var(--property-ink-soft)]">Resend-backed transactional email flow</div>
              </div>
              <PropertyStatusBadge status={emailConfigured ? "active" : "offline"} />
            </div>
            <div className="flex items-center justify-between rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4">
              <div>
                <div className="text-lg font-semibold text-[var(--property-ink)]">WhatsApp automation</div>
                <div className="mt-1 text-sm text-[var(--property-ink-soft)]">Meta or Twilio-backed WhatsApp notifications</div>
              </div>
              <PropertyStatusBadge status={whatsappConfigured ? "active" : "offline"} />
            </div>
          </div>
        </div>

        <div className="property-panel rounded-[2rem] p-6 sm:p-8">
          <div className="property-kicker">Campaign surfaces</div>
          <div className="mt-5 space-y-4">
            {snapshot.campaigns.map((campaign) => (
              <div key={campaign.id} className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-[var(--property-ink)]">{campaign.title}</div>
                    <div className="mt-1 text-sm text-[var(--property-ink-soft)]">
                      {campaign.surface} · {campaign.listingIds.length} attached listings
                    </div>
                  </div>
                  <PropertyStatusBadge status="active" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PropertyWorkspaceShell>
  );
}
