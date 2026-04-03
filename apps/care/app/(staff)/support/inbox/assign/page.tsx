import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRoles } from "@/lib/auth/server";
import { getSupportThreads, getSupportAgents } from "@/lib/support/data";
import AssignForm from "@/components/support/AssignForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Assign Thread | Henry & Co. Fabric Care",
  description: "Assign a support thread to an agent.",
};

type PageSearchParams = {
  thread?: string | string[];
};

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? String(value[0] || "").trim() : String(value || "").trim();
}

export default async function AssignPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  await requireRoles(["owner", "manager", "support"]);
  const params = (await searchParams) ?? {};
  const threadId = readParam(params.thread);

  if (!threadId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h2 className="text-xl font-black text-zinc-950 dark:text-white">No thread selected</h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-white/50">
          Return to the inbox and select a thread to assign.
        </p>
        <Link
          href="/support/inbox"
          className="care-button-primary mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to inbox
        </Link>
      </div>
    );
  }

  const [threads, agents] = await Promise.all([
    getSupportThreads({ limit: 900 }),
    getSupportAgents(),
  ]);

  const thread = threads.find((t) => t.threadId === threadId);
  const backHref = `/support/inbox?thread=${threadId}`;

  if (!thread) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h2 className="text-xl font-black text-zinc-950 dark:text-white">Thread not found</h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-white/50">
          This thread may have been removed or is no longer accessible.
        </p>
        <Link
          href="/support/inbox"
          className="care-button-primary mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to inbox
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* Back link */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to thread
      </Link>

      {/* Thread info */}
      <div className="care-card rounded-[2rem] p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
          Assign {thread.threadRef}
        </div>
        <h2 className="mt-1 text-xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white">
          {thread.customerName}
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-white/64">{thread.subject}</p>

        <div className="mt-4 rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-white/35">
            Currently assigned to
          </div>
          <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
            {thread.assignedTo?.fullName || "Unassigned"}
            {thread.assignedTo?.role ? ` (${thread.assignedTo.role})` : ""}
          </div>
        </div>
      </div>

      {/* Assignment form */}
      <AssignForm
        threadId={thread.threadId}
        currentAssigneeId={thread.assignedTo?.userId ?? null}
        agents={agents}
        backHref={backHref}
      />
    </div>
  );
}
