import { getPostmarkServerToken } from "@henryco/email";
import { translateSurfaceLabel } from "@henryco/i18n";
import { resolveLocalizedDynamicField } from "@henryco/i18n/server";
import { PropertyMetricCard, PropertyStatusBadge, PropertyWorkspaceShell } from "@/components/property/ui";
import { requirePropertyRoles } from "@/lib/property/auth";
import { getPropertyGovernanceWorkspaceData, getPropertySnapshot } from "@/lib/property/data";
import { getPropertyPublicLocale } from "@/lib/locale-server";
import { getWorkspaceNavigation } from "@/lib/property/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

function CountPill({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--property-line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--property-ink)]">
      {value}
    </span>
  );
}

export default async function AdminPage() {
  await requirePropertyRoles(["property_admin"], "/admin");
  const [snapshot, governance] = await Promise.all([
    getPropertySnapshot(),
    getPropertyGovernanceWorkspaceData(),
  ]);

  const approved = snapshot.listings.filter((item) => ["published", "approved"].includes(item.status)).length;
  const submitted = governance.queue.length;
  const inspectionBacklog = governance.queue.filter((item) =>
    ["inspection_requested", "inspection_scheduled"].includes(item.status)
  ).length;
  const messagingFailures = snapshot.notifications.filter((item) => item.status === "failed").length;
  const awaitingDocuments = governance.queue.filter((item) => item.status === "awaiting_documents").length;
  const awaitingEligibility = governance.queue.filter((item) => item.status === "awaiting_eligibility").length;
  // EMAIL-POSTMARK (2026-07-14): Postmark is the only outbound rail.
  const emailConfigured = Boolean(getPostmarkServerToken());
  const whatsappConfigured = Boolean(
    process.env.TWILIO_ACCOUNT_SID ||
      (process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN)
  );

  const locale = await getPropertyPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  // Campaign list — small fixed array, public-facing label, wrap title.
  const localizedCampaigns = await Promise.all(
    snapshot.campaigns.map(async (campaign) => {
      const title = await resolveLocalizedDynamicField({
        record: campaign as unknown as Record<string, unknown>,
        field: "title",
        locale,
        fallback: campaign.title ?? "",
        machineTranslate: locale !== "en",
      });
      return { ...campaign, title };
    }),
  );

  return (
    <PropertyWorkspaceShell
      kicker={t("Admin")}
      title={t("Property platform governance")}
      description={t("Monitor live inventory, messaging health, moderation backlog, and the current readiness of the platform’s operator stack.")}
      nav={getWorkspaceNavigation("/admin")}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <PropertyMetricCard label={t("Approved")} value={String(approved)} hint={t("Listings currently live on the public property surface.")} />
        <PropertyMetricCard label={t("Pending")} value={String(submitted)} hint={t("Listings waiting for moderation or revision.")} />
        <PropertyMetricCard label={t("Inspection")} value={String(inspectionBacklog)} hint={t("Listings that still need an inspection decision before publication.")} />
        <PropertyMetricCard label={t("Failures")} value={String(messagingFailures)} hint={t("Notification records marked as failed.")} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/admin/listings"
          className="property-button inline-flex rounded-full px-6 py-3 text-sm font-semibold"
        >
          {t("Open governance queue")}
        </Link>
        <Link
          href="/operations"
          className="property-button-secondary inline-flex rounded-full px-6 py-3 text-sm font-semibold"
        >
          {t("Open operations")}
        </Link>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="property-panel rounded-[2rem] p-6 sm:p-8">
          <div className="property-kicker">{t("Governance posture")}</div>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4">
              <div>
                <div className="text-lg font-semibold text-[var(--property-ink)]">{t("Awaiting documents")}</div>
                <div className="mt-1 text-sm text-[var(--property-ink-soft)]">{t("Listings still missing trust evidence before review can continue.")}</div>
              </div>
              <CountPill value={awaitingDocuments} />
            </div>
            <div className="flex items-center justify-between rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4">
              <div>
                <div className="text-lg font-semibold text-[var(--property-ink)]">{t("Awaiting eligibility")}</div>
                <div className="mt-1 text-sm text-[var(--property-ink-soft)]">{t("Listings paused on identity, duplicate-contact, or trust gating.")}</div>
              </div>
              <CountPill value={awaitingEligibility} />
            </div>
            <div className="flex items-center justify-between rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4">
              <div>
                <div className="text-lg font-semibold text-[var(--property-ink)]">{t("Messaging health")}</div>
                <div className="mt-1 text-sm text-[var(--property-ink-soft)]">{t("Email and WhatsApp delivery stack for property notifications.")}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <PropertyStatusBadge status={emailConfigured ? "active" : "offline"} />
                <PropertyStatusBadge status={whatsappConfigured ? "active" : "offline"} />
              </div>
            </div>
          </div>
        </div>

        <div className="property-panel rounded-[2rem] p-6 sm:p-8">
          <div className="property-kicker">{t("Campaign surfaces")}</div>
          <div className="mt-5 space-y-4">
            {localizedCampaigns.map((campaign) => (
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
