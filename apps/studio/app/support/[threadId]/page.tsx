import { notFound } from "next/navigation";
import { ThreadAppearanceProvider, type ThreadParticipant } from "@henryco/messaging-thread";
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

  // studio_owner can move a thread to another division.
  const canTransfer = (viewer.roles ?? []).some(
    (role) => role === "studio_owner",
  );
  const initialMuted = Boolean(thread.staffMutedAt);
  const participants = deriveStudioParticipants({
    viewerUserId: viewerUser?.id || "",
    viewerName: fullName,
    messages: messageRows,
    customerName,
  });

  return (
    <StudioWorkspaceShell
      kicker="Support · Thread"
      title="Conversation detail"
      description="Reply with context, capture next actions, and move the thread back into a resolved state."
      nav={supportNav("/support")}
    >
      <ThreadAppearanceProvider>
        <StudioSupportThreadHeader
          threadId={thread.id}
          subject={subject}
          divisionLabel={divisionLabel(thread.division || "studio")}
          divisionValue={String(thread.division || "studio").toLowerCase()}
          categoryLabel={categoryLabel(thread.category)}
          priorityLabel={priorityLabel(thread.priority)}
          status={status}
          statusLabel={localizeStatus(status)}
          initialMuted={initialMuted}
          participants={participants}
          canTransfer={canTransfer}
          download={{
            endpoint: `/api/documents/support-thread/${thread.id}`,
            filename: `HenryCo-SupportThread-${thread.id.slice(0, 8)}.pdf`,
            shareTitle: `Henry & Co. Studio — ${subject}`,
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
      </ThreadAppearanceProvider>
    </StudioWorkspaceShell>
  );
}

function deriveStudioParticipants({
  viewerUserId,
  viewerName,
  messages,
  customerName,
}: {
  viewerUserId: string;
  viewerName: string;
  messages: Array<Record<string, unknown>>;
  customerName: string;
}): ThreadParticipant[] {
  const seen = new Map<string, ThreadParticipant>();
  if (viewerUserId) {
    seen.set(viewerUserId, {
      id: viewerUserId,
      name: viewerName,
      role: "Studio support",
      isSelf: true,
    });
  }
  // Always show the customer chip even on an empty thread — staff need
  // to know who they're talking to at a glance.
  seen.set("customer", {
    id: "customer",
    name: customerName,
    role: "Customer",
  });
  for (const row of messages) {
    const senderType = String(
      (row as { sender_type?: unknown }).sender_type || "",
    ).toLowerCase();
    if (senderType === "system") continue;
    if (senderType === "customer") continue;
    const senderId =
      String((row as { sender_id?: unknown }).sender_id || "") ||
      `staff-${senderType || "agent"}`;
    if (seen.has(senderId)) continue;
    seen.set(senderId, {
      id: senderId,
      name: "Henry & Co. staff",
      role: "Studio support",
    });
  }
  return Array.from(seen.values());
}
