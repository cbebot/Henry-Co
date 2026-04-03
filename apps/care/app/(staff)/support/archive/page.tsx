import type { Metadata } from "next";
import SupportThreadWorkspace from "@/components/support/SupportThreadWorkspace";
import { requireRoles } from "@/lib/auth/server";
import { logProtectedPageAccess } from "@/lib/security/logger";
import {
  getSupportAgents,
  getSupportInfrastructureStatus,
  getSupportThreads,
} from "@/lib/support/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Support Archive | Henry & Co. Fabric Care",
  description:
    "Resolved support conversation history with searchable detail and quick reopen controls.",
};

type PageSearchParams = {
  q?: string | string[];
  assignee?: string | string[];
  mailbox?: string | string[];
  thread?: string | string[];
};

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? String(value[0] || "").trim() : String(value || "").trim();
}

export default async function SupportArchivePage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const auth = await requireRoles(["owner", "manager", "support"]);
  const params = (await searchParams) ?? {};
  const q = readParam(params.q);
  const assignee = readParam(params.assignee) || "all";
  const mailbox = readParam(params.mailbox) || "all";
  const selectedThreadId = readParam(params.thread);

  await logProtectedPageAccess("/support/archive", {
    q: q || null,
    assignee: assignee !== "all" ? assignee : null,
    mailbox: mailbox !== "all" ? mailbox : null,
    selected_thread: selectedThreadId || null,
  });

  const [threads, agents, infrastructure] = await Promise.all([
    getSupportThreads({
      q: q || undefined,
      status: "resolved",
      assignee,
      mailbox,
      viewerUserId: auth.profile.id,
      limit: 260,
    }),
    getSupportAgents(),
    getSupportInfrastructureStatus(),
  ]);

  return (
    <div className="space-y-8">
      <SupportThreadWorkspace
        title="Resolved conversation archive"
        subtitle="Review finished cases, confirm how they were closed, and reopen any thread that needs new action."
        basePath="/support/archive"
        threads={threads}
        agents={agents}
        selectedThreadId={selectedThreadId}
        q={q}
        assignee={assignee}
        mailbox={mailbox}
        whatsappConfigured={infrastructure.whatsapp.configured}
        whatsappReason={infrastructure.whatsapp.reason || "WhatsApp is not configured."}
        allowStatusFilter={false}
        emptyTitle="No resolved conversations matched this view"
        emptyText="Resolved threads appear here once the customer loop is closed."
      />
    </div>
  );
}
