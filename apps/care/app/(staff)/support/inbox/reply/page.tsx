import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { requireRoles } from "@/lib/auth/server";
import { getSupportThreads, getSupportAgents } from "@/lib/support/data";
import { getWhatsAppCapability } from "@/lib/support/whatsapp";
import { SUPPORT_THREAD_STATUSES } from "@/lib/support/shared";
import ReplyComposer from "@/components/support/ReplyComposer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reply to Thread | Henry & Co. Fabric Care",
  description: "Compose and send a reply to a support thread.",
};

type PageSearchParams = {
  thread?: string | string[];
};

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? String(value[0] || "").trim() : String(value || "").trim();
}

export default async function ReplyPage({
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
          Return to the inbox and select a thread to reply to.
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

  const [threads] = await Promise.all([
    getSupportThreads({ limit: 900 }),
    getSupportAgents(),
  ]);

  const thread = threads.find((t) => t.threadId === threadId);
  const whatsapp = getWhatsAppCapability();
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

  const lastTimelineEntry = thread.timeline.length > 0 ? thread.timeline[thread.timeline.length - 1] : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* Back link */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to thread
      </Link>

      {/* Thread info header */}
      <div className="care-card rounded-[2rem] p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
          Replying to {thread.threadRef}
        </div>
        <h2 className="mt-1 text-xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white sm:text-2xl">
          {thread.customerName}
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-white/64">{thread.subject}</p>

        {/* Contact info */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
            <Mail className="h-3.5 w-3.5 text-[color:var(--accent)]" />
            {thread.customerEmail || "No email"}
          </div>
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
            <Phone className="h-3.5 w-3.5 text-[color:var(--accent)]" />
            {thread.customerPhone || "No phone"}
          </div>
        </div>

        {/* Last message preview */}
        {lastTimelineEntry && (
          <div className="mt-4 rounded-xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-white/35">
              Last message
            </div>
            <div className="mt-1 text-xs text-zinc-500 dark:text-white/45">
              {lastTimelineEntry.actorName || "System"} &middot; {lastTimelineEntry.kind}
            </div>
            <p className="mt-2 line-clamp-4 text-sm leading-7 text-zinc-600 dark:text-white/66">
              {lastTimelineEntry.body}
            </p>
          </div>
        )}
      </div>

      {/* Reply composer */}
      <ReplyComposer
        threadId={thread.threadId}
        threadRef={thread.threadRef}
        customerName={thread.customerName}
        customerEmail={thread.customerEmail}
        customerPhone={thread.customerPhone}
        backHref={backHref}
        statuses={SUPPORT_THREAD_STATUSES}
        whatsappConfigured={whatsapp.configured}
        whatsappReason={whatsapp.reason || "WhatsApp is not configured in this environment."}
      />
    </div>
  );
}
