import Link from "next/link";
import { translateSurfaceLabel } from "@henryco/i18n";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getOperationsCenterData } from "@/lib/owner-data";
import { getHubPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function OperationsQueuesPage() {
  const data = await getOperationsCenterData();
  const locale = await getHubPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow={t("Task Queues")}
        title={t("Operational backlog board")}
        description={t("The command center groups the biggest active queues so the owner can see where the company is losing time before switching into a deeper operational module.")}
      />

      <OwnerPanel title={t("Queue summary")} description={t("Largest live bottlenecks.")}>
        <table className="owner-table">
          <thead>
            <tr>
              <th>{t("Queue")}</th>
              <th>{t("Volume")}</th>
              <th>{t("Owner meaning")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{t("Open support threads")}</td>
              <td>{data.metrics.openSupport}</td>
              <td>{t("Customer pressure still unresolved across the company.")}</td>
            </tr>
            <tr>
              <td>{t("Stale support threads")}</td>
              <td>{data.metrics.staleSupport}</td>
              <td>{t("Threads that have already aged into slower service territory.")}</td>
            </tr>
            <tr>
              <td>{t("Care bookings")}</td>
              <td>{data.metrics.openCareBookings}</td>
              <td>{t("Fabric care work still moving through pickup, cleaning, or delivery stages.")}</td>
            </tr>
            <tr>
              <td>{t("Marketplace trust queue")}</td>
              <td>{data.metrics.marketplaceQueues}</td>
              <td>{t("Vendor applications and disputes needing moderation or trust action.")}</td>
            </tr>
            <tr>
              <td>{t("Pending invoices")}</td>
              <td>{data.metrics.pendingInvoices}</td>
              <td>{t("Learn or shared invoices still waiting for payment or confirmation.")}</td>
            </tr>
          </tbody>
        </table>
      </OwnerPanel>

      <OwnerPanel
        title={t("Where to act next")}
        description={t("Jump to the right HQ surface or approval links instead of guessing routes.")}
      >
        <div className="flex flex-wrap gap-3">
          <Link href="/owner/operations/approvals" className="acct-button-primary">
            {t("Approval center")}
          </Link>
          <Link href="/owner/finance" className="acct-button-secondary">
            {t("Finance center")}
          </Link>
          <Link href="/owner/divisions" className="acct-button-secondary">
            {t("Division map")}
          </Link>
          <Link href="/owner/messaging/queues" className="acct-button-secondary">
            {t("Delivery queues")}
          </Link>
        </div>
      </OwnerPanel>
    </div>
  );
}
