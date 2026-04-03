import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CircleDashed,
  CreditCard,
  FolderArchive,
  Headset,
  Mail,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Star,
  TriangleAlert,
  UserCog,
} from "lucide-react";
import {
  WorkspaceHero,
  WorkspaceInfoTile,
  WorkspaceMetricCard,
  WorkspacePanel,
} from "@/components/dashboard/WorkspacePrimitives";
import { requireRoles } from "@/lib/auth/server";
import { getAdminReviews } from "@/lib/admin/care-admin";
import {
  getPaymentReviewQueue,
  type PaymentReviewQueueItem,
} from "@/lib/payments/verification";
import { logProtectedPageAccess } from "@/lib/security/logger";
import {
  getSupportInfrastructureStatus,
  getSupportThreads,
  syncInboundSupportEmails,
} from "@/lib/support/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Support Overview | Henry & Co. Fabric Care",
  description:
    "Support command overview for inbox pressure, payment proof review, moderation, and channel health.",
};

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pluralize(count: number, singular: string, plural?: string) {
  return `${count} ${count === 1 ? singular : plural || `${singular}s`}`;
}

function countPaymentsByStatus(
  queue: PaymentReviewQueueItem[],
  statuses: Array<PaymentReviewQueueItem["verificationStatus"]>
) {
  return queue.filter((item) => statuses.includes(item.verificationStatus)).length;
}

function readinessTone(ok: boolean) {
  return ok
    ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100"
    : "border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-100";
}

export default async function SupportOverviewPage() {
  await requireRoles(["owner", "manager", "support"]);
  await logProtectedPageAccess("/support");
  await syncInboundSupportEmails(12);

  const [threads, paymentQueue, reviews, infrastructure] = await Promise.all([
    getSupportThreads({ status: "all", limit: 260 }),
    getPaymentReviewQueue(180),
    getAdminReviews(140),
    getSupportInfrastructureStatus(),
  ]);

  const activeThreads = threads.filter((thread) => thread.status !== "resolved");
  const archivedThreads = threads.filter((thread) => thread.status === "resolved");
  const urgentThreads = activeThreads.filter((thread) => thread.urgency === "urgent");
  const staleThreads = activeThreads.filter((thread) => thread.isStale);
  const unassignedThreads = activeThreads.filter((thread) => !thread.assignedTo?.userId);
  const pendingReviews = reviews.filter((review) => !review.is_approved);
  const reviewPayments = paymentQueue.filter((item) =>
    ["receipt_submitted", "under_review", "awaiting_corrected_proof", "rejected"].includes(
      String(item.verificationStatus || "").toLowerCase()
    )
  );
  const awaitingReceiptCount = countPaymentsByStatus(paymentQueue, ["awaiting_receipt"]);

  const queueCards = [
    {
      href: "/support/inbox",
      label: "Inbox",
      icon: MessageSquareText,
      value: activeThreads.length,
      note:
        activeThreads.length > 0
          ? `${pluralize(urgentThreads.length, "urgent thread")} and ${pluralize(
              staleThreads.length,
              "stale conversation"
            )} need attention.`
          : "The active conversation queue is calm right now.",
    },
    {
      href: "/support/payments",
      label: "Payment proofs",
      icon: CreditCard,
      value: reviewPayments.length,
      note:
        reviewPayments.length > 0
          ? `${awaitingReceiptCount} booking${awaitingReceiptCount === 1 ? "" : "s"} still waiting on proof.`
          : "No receipt verification backlog is open.",
    },
    {
      href: "/support/reviews",
      label: "Review moderation",
      icon: Star,
      value: pendingReviews.length,
      note:
        pendingReviews.length > 0
          ? "New review submissions are waiting for approval decisions."
          : "Public trust flow is currently clear.",
    },
    {
      href: "/support/archive",
      label: "Archive",
      icon: FolderArchive,
      value: archivedThreads.length,
      note:
        archivedThreads.length > 0
          ? "Resolved conversations remain searchable and reopenable here."
          : "No resolved conversation history has been captured yet.",
    },
  ];

  return (
    <div className="space-y-8">
      <WorkspaceHero
        eyebrow="Support command"
        title="See workload clearly, then drop into the exact queue."
        description="Support now runs as a set of dedicated workspaces. Use this overview to spot urgency, follow-up risk, payment pressure, and channel health before opening inbox, proofs, moderation, or archive."
        actions={
          <>
            <Link
              href="/support/inbox"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-secondary)] px-5 py-3 text-sm font-semibold text-[#07111F]"
            >
              Open inbox
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/support/payments"
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            >
              Review payment proofs
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/support/reviews"
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            >
              Moderate reviews
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        }
      />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <WorkspaceMetricCard
          icon={Headset}
          label="Active conversations"
          value={String(activeThreads.length)}
          note={`${pluralize(unassignedThreads.length, "thread")} unassigned.`}
        />
        <WorkspaceMetricCard
          icon={TriangleAlert}
          label="Urgent or stale"
          value={String(urgentThreads.length + staleThreads.length)}
          note="Critical follow-up pressure across the inbox."
        />
        <WorkspaceMetricCard
          icon={CreditCard}
          label="Receipt reviews"
          value={String(reviewPayments.length)}
          note="Proof checks, clarifications, and rejections waiting on support."
        />
        <WorkspaceMetricCard
          icon={Star}
          label="Pending reviews"
          value={String(pendingReviews.length)}
          note="Customer trust content waiting for moderation."
        />
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <WorkspacePanel
          eyebrow="Queues"
          title="Choose the right support workspace"
          subtitle="Each queue now carries one responsibility, so support can work faster without cards competing for the same space."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {queueCards.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group rounded-[1.8rem] border border-black/10 bg-black/[0.03] p-5 transition hover:border-[color:var(--accent)]/28 hover:bg-[color:var(--accent)]/8 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
                    <Icon className="h-5 w-5 text-[color:var(--accent)]" />
                  </div>
                  <div className="mt-5 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                        {card.label}
                      </div>
                      <div className="mt-2 text-3xl font-black tracking-[-0.05em] text-zinc-950 dark:text-white">
                        {card.value}
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-[color:var(--accent)] transition group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-white/64">
                    {card.note}
                  </p>
                </Link>
              );
            })}
          </div>
        </WorkspacePanel>

        <WorkspacePanel
          eyebrow="Attention"
          title="What needs a move next"
          subtitle="This is the high-signal layer for whoever is running support right now."
        >
          <div className="grid gap-4">
            <WorkspaceInfoTile
              label="Unassigned inbox work"
              value={pluralize(unassignedThreads.length, "conversation")}
              note="Route these first so customers never sit without an owner."
            />
            <WorkspaceInfoTile
              label="Stale threads"
              value={pluralize(staleThreads.length, "active thread")}
              note="Anything quiet for 12+ hours still counts as unresolved pressure."
            />
            <WorkspaceInfoTile
              label="Awaiting proof"
              value={pluralize(awaitingReceiptCount, "booking")}
              note="Customers who received bank details but have not uploaded proof yet."
            />
            <WorkspaceInfoTile
              label="Latest inbound inbox sync"
              value={formatDateTime(infrastructure.inboundEmail.lastProcessedAt)}
              note={infrastructure.inboundEmail.lastInboundThreadRef || "No linked inbound thread yet"}
            />
          </div>
        </WorkspacePanel>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <WorkspacePanel
          eyebrow="Channel health"
          title="Messaging and automation readiness"
          subtitle="Support needs reliable reply delivery, inbound capture, and automation visibility."
        >
          <div className="grid gap-4">
            <div className={`rounded-[1.5rem] border p-4 ${readinessTone(Boolean(process.env.RESEND_API_KEY))}`}>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Mail className="h-4 w-4" />
                Outbound email replies
              </div>
              <p className="mt-2 text-sm leading-7 opacity-90">
                {process.env.RESEND_API_KEY
                  ? "Customer replies, booking confirmations, proof reminders, and staff notifications can all leave the platform."
                  : "Outbound email is blocked because the email transport key is missing in this runtime."}
              </p>
            </div>

            <div
              className={`rounded-[1.5rem] border p-4 ${readinessTone(
                infrastructure.inboundEmail.configured
              )}`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CircleDashed className="h-4 w-4" />
                Inbound support email
              </div>
              <p className="mt-2 text-sm leading-7 opacity-90">
                {infrastructure.inboundEmail.reason}
              </p>
            </div>

            <div
              className={`rounded-[1.5rem] border p-4 ${readinessTone(
                infrastructure.whatsapp.configured
              )}`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4" />
                WhatsApp replies
              </div>
              <p className="mt-2 text-sm leading-7 opacity-90">
                {infrastructure.whatsapp.configured
                  ? `Configured through ${infrastructure.whatsapp.provider}.`
                  : infrastructure.whatsapp.reason || "WhatsApp delivery is not configured."}
              </p>
            </div>
          </div>
        </WorkspacePanel>

        <WorkspacePanel
          eyebrow="Quick jumps"
          title="Support pages that should stay one click away"
          subtitle="These links keep the workflow tight on both desktop and mobile."
        >
          <div className="grid gap-4">
            {[
              {
                href: "/support/inbox?assignee=unassigned",
                icon: UserCog,
                title: "Claim unassigned conversations",
                text: "Open the inbox pre-filtered to threads that still need an owner.",
              },
              {
                href: "/support/notifications",
                icon: BellRing,
                title: "Review role alerts",
                text: "See unread support-only alerts without owner-wide intelligence noise.",
              },
              {
                href: "/support/archive",
                icon: ShieldCheck,
                title: "Check resolved history",
                text: "Review finished conversations, proof history, and reopen when needed.",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-[1.5rem] border border-black/10 bg-black/[0.03] p-4 transition hover:border-[color:var(--accent)]/28 hover:bg-[color:var(--accent)]/8 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
                      <Icon className="h-5 w-5 text-[color:var(--accent)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-base font-semibold text-zinc-950 dark:text-white">
                          {item.title}
                        </div>
                        <ArrowRight className="h-4 w-4 text-[color:var(--accent)] transition group-hover:translate-x-0.5" />
                      </div>
                      <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/64">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </WorkspacePanel>
      </section>
    </div>
  );
}
