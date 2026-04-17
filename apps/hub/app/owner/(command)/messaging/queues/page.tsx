import DivisionBadge from "@/components/owner/DivisionBadge";
import { MessagingHubNav } from "@/components/owner/MessagingHubNav";
import StatusBadge from "@/components/owner/StatusBadge";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getMessagingCenterData } from "@/lib/owner-data";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MessagingQueuesPage() {
  const data = await getMessagingCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Delivery Queues"
        title="Email and WhatsApp queue diagnostics"
        description="Every observed queue row from the live care and marketplace delivery systems is normalized here for owner visibility."
      />

      <MessagingHubNav />

      <OwnerPanel title="Queue rows" description="Latest delivery-health telemetry.">
        <table className="owner-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Division</th>
              <th>Channel</th>
              <th>Status</th>
              <th>Recipient</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {data.queues.map((row) => (
              <tr key={row.id}>
                <td>{row.subject}</td>
                <td><DivisionBadge division={row.division} /></td>
                <td>{row.channel}</td>
                <td><StatusBadge status={row.status} /></td>
                <td>{row.recipient}</td>
                <td>{row.updatedAt ? formatDateTime(row.updatedAt) : "Unknown"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </OwnerPanel>
    </div>
  );
}
