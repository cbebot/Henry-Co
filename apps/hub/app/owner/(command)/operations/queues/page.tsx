import Link from "next/link";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getOperationsCenterData } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

export default async function OperationsQueuesPage() {
  const data = await getOperationsCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Task Queues"
        title="Operational backlog board"
        description="The command center groups the biggest active queues so the owner can see where the company is losing time before switching into a deeper operational module."
      />

      <OwnerPanel title="Queue summary" description="Largest live bottlenecks.">
        <table className="owner-table">
          <thead>
            <tr>
              <th>Queue</th>
              <th>Volume</th>
              <th>Owner meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Open support threads</td>
              <td>{data.metrics.openSupport}</td>
              <td>Customer pressure still unresolved across the company.</td>
            </tr>
            <tr>
              <td>Stale support threads</td>
              <td>{data.metrics.staleSupport}</td>
              <td>Threads that have already aged into slower service territory.</td>
            </tr>
            <tr>
              <td>Care bookings</td>
              <td>{data.metrics.openCareBookings}</td>
              <td>Fabric care work still moving through pickup, cleaning, or delivery stages.</td>
            </tr>
            <tr>
              <td>Marketplace trust queue</td>
              <td>{data.metrics.marketplaceQueues}</td>
              <td>Vendor applications and disputes needing moderation or trust action.</td>
            </tr>
            <tr>
              <td>Pending invoices</td>
              <td>{data.metrics.pendingInvoices}</td>
              <td>Learn or shared invoices still waiting for payment or confirmation.</td>
            </tr>
          </tbody>
        </table>
      </OwnerPanel>

      <OwnerPanel
        title="Where to act next"
        description="Jump to the right HQ surface or approval links instead of guessing routes."
      >
        <div className="flex flex-wrap gap-3">
          <Link href="/owner/operations/approvals" className="acct-button-primary">
            Approval center
          </Link>
          <Link href="/owner/finance" className="acct-button-secondary">
            Finance center
          </Link>
          <Link href="/owner/divisions" className="acct-button-secondary">
            Division map
          </Link>
          <Link href="/owner/messaging/queues" className="acct-button-secondary">
            Delivery queues
          </Link>
        </div>
      </OwnerPanel>
    </div>
  );
}
