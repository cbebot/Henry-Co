import { notFound } from "next/navigation";
import { requireStudioRoles } from "@/lib/studio/auth";
import { supportNav } from "@/lib/studio/navigation";
import { getStudioSnapshot } from "@/lib/studio/store";
import { StudioWorkspaceShell } from "@/components/studio/workspace/shell";
import StudioSupportThreadHeader from "@/components/studio/support/StudioSupportThreadHeader";
import StudioSupportThreadRoom from "@/components/studio/support/StudioSupportThreadRoom";

export const dynamic = "force-dynamic";

function localizeStatus(raw: string) {
  const value = raw.replaceAll("_", " ").trim();
  if (!value) return "Open";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function categoryLabel(raw: string) {
  switch (raw.trim().toLowerCase()) {
    case "billing":
      return "Billing";
    case "general":
      return "General";
    case "account":
      return "Account";
    case "feedback":
      return "Feedback";
    default: {
      const normalized = raw.trim().replace(/[_-]+/g, " ");
      if (!normalized) return "General";
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }
  }
}

function divisionLabel(raw: string) {
  const value = raw.trim().toLowerCase();
  if (!value || value === "studio") return "Studio";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function priorityLabel(raw: string) {
  switch (raw.trim().toLowerCase()) {
    case "urgent":
      return "Urgent";
    case "high":
      return "High";
    case "low":
      return "Low";
    case "normal":
    default:
      return "Normal";
  }
}

export default async function SupportThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const viewer = await requireStudioRoles(
    ["studio_owner", "client_success"],
    "/support",
  );
  const { threadId } = await params;
  const snapshot = await getStudioSnapshot();
  const thread =
    (snapshot.supportThreads ?? []).find((item) => item.id === threadId) ?? null;
  if (!thread) notFound();

  const messages = (snapshot.supportMessages ?? []).filter(
    (item) => item.threadId === thread.id,
  );

  // Map studio's typed StudioSupportMessage onto the raw-row shape the
  // engine adapter expects. We tag each row with the customer name when
  // sender_type === "customer" so the bubble renders with a stable
  // attribution instead of "Customer".
  const customerName = "Customer";
  const messageRows = messages.map((message) => ({
    id: message.id,
    thread_id: message.threadId,
    sender_id: message.senderId,
    sender_type: message.senderType,
    body: message.body,
    attachments: message.attachments,
    created_at: message.createdAt,
    customer_name: customerName,
  }));

  const status = thread.status || "open";
  const subject = thread.subject || "Studio support";
  const viewerUser = viewer.user;
  const fullName =
    String(viewerUser?.fullName || "").trim() ||
    String(viewerUser?.email || "").trim() ||
    "Studio team";

  return (
    <StudioWorkspaceShell
      kicker="Support · Thread"
      title="Conversation detail"
      description="Reply with context, capture next actions, and move the thread back into a resolved state."
      nav={supportNav("/support")}
    >
      <StudioSupportThreadHeader
        threadId={thread.id}
        subject={subject}
        divisionLabel={divisionLabel(thread.division || "studio")}
        categoryLabel={categoryLabel(thread.category)}
        priorityLabel={priorityLabel(thread.priority)}
        status={status}
        statusLabel={localizeStatus(status)}
        download={{
          endpoint: `/api/documents/support-thread/${thread.id}`,
          filename: `HenryCo-SupportThread-${thread.id.slice(0, 8)}.pdf`,
          shareTitle: `HenryCo Studio — ${subject}`,
          label: "Download",
        }}
      />
      <StudioSupportThreadRoom
        threadId={thread.id}
        messages={messageRows}
        threadStatus={status}
        viewer={{
          userId: viewerUser?.id || "",
          fullName,
          email: viewerUser?.email || null,
        }}
      />
    </StudioWorkspaceShell>
  );
}
