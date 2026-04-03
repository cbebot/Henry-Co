import type { Metadata } from "next";
import SupportThreadWorkspace from "@/components/support/SupportThreadWorkspace";
import { requireRoles } from "@/lib/auth/server";
import { logProtectedPageAccess } from "@/lib/security/logger";
import {
  getSupportAgents,
  getSupportInfrastructureStatus,
  getSupportThreads,
  syncInboundSupportEmails,
} from "@/lib/support/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Support Inbox | Henry & Co. Fabric Care",
  description:
    "Active support inbox with searchable thread rail, detail panel, and reply workflow.",
};

type PageSearchParams = {
  q?: string | string[];
  status?: string | string[];
  assignee?: string | string[];
  mailbox?: string | string[];
  thread?: string | string[];
};

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? String(value[0] || "").trim() : String(value || "").trim();
}

export default async function SupportInboxPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const auth = await requireRoles(["owner", "manager", "support"]);
  const params = (await searchParams) ?? {};
  const q = readParam(params.q);
  const status = readParam(params.status) || "all";
  const assignee = readParam(params.assignee) || "all";
  const mailbox = readParam(params.mailbox) || "all";
  const selectedThreadId = readParam(params.thread);

  await logProtectedPageAccess("/support/inbox", {
    q: q || null,
    status: status !== "all" ? status : null,
    assignee: assignee !== "all" ? assignee : null,
    mailbox: mailbox !== "all" ? mailbox : null,
    selected_thread: selectedThreadId || null,
  });

  await syncInboundSupportEmails(12);

  const [threads, agents, infrastructure] = await Promise.all([
    getSupportThreads({
      q: q || undefined,
      status,
      assignee,
      mailbox,
      viewerUserId: auth.profile.id,
      limit: 260,
    }).then((rows) =>
      rows.filter((thread) => thread.status !== "resolved")
    ),
    getSupportAgents(),
    getSupportInfrastructureStatus(),
  ]);

  return (
    <div className="space-y-8">
      <SupportThreadWorkspace
        title="Inbox conversations"
        subtitle="Handle new requests, active replies, and customer follow-up in one clear list/detail workspace."
        basePath="/support/inbox"
        threads={threads}
        agents={agents}
        selectedThreadId={selectedThreadId}
        q={q}
        status={status}
        assignee={assignee}
        mailbox={mailbox}
        whatsappConfigured={infrastructure.whatsapp.configured}
        whatsappReason={infrastructure.whatsapp.reason || "WhatsApp is not configured."}
        emptyTitle="No active support conversations matched this view"
        emptyText="Try a broader filter or check the archive if you are looking for a conversation that was already resolved."
      />
    </div>
  );
}
