import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  Folder,
  History,
  Inbox,
  MessageSquare,
  Receipt,
  Sparkles,
} from "lucide-react";

import { requireClientPortalViewer } from "@/lib/portal/auth";
import {
  getClientProjectDetail,
  unreadCountForProject,
} from "@/lib/portal/data";
import { formatKobo, shortDate } from "@/lib/portal/helpers";
import {
  invoiceStatusToken,
  paymentStatusToken,
  projectStatusToken,
} from "@/lib/portal/status";
import { ActivityFeed } from "@/components/portal/activity-feed";
import { FileCard } from "@/components/portal/file-card";
import { MessageThread } from "@/components/portal/message-thread";
import { MilestoneProgress } from "@/components/portal/milestone-progress";
import { PortalEmptyState } from "@/components/portal/empty-state";
import { PortalTabBar, type PortalTabDefinition } from "@/components/portal/tabs";
import { StatusBadge } from "@/components/portal/status-badge";

export const metadata: Metadata = {
  title: "Project",
};

const PROJECT_TABS: Array<{
  id: "overview" | "progress" | "files" | "messages" | "payments";
  label: string;
  icon: typeof Inbox;
}> = [
  { id: "overview", label: "Overview", icon: Inbox },
  { id: "progress", label: "Progress", icon: History },
  { id: "files", label: "Files", icon: FileText },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "payments", label: "Payments", icon: CreditCard },
];

export default async function ClientProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { projectId } = await params;
  const { tab: tabParam } = await searchParams;
  const viewer = await requireClientPortalViewer(`/client/projects/${projectId}`);
  const detail = await getClientProjectDetail(viewer, projectId);

  if (!detail) notFound();

  const activeTab =
    PROJECT_TABS.find((tab) => tab.id === tabParam)?.id ?? "overview";

  const status = projectStatusToken(detail.project.status);
  const unread = unreadCountForProject(detail.messages, viewer.userId);
  const filesPending = detail.deliverables.filter((d) => d.status === "shared").length;
  const outstandingInvoices = detail.invoices.filter(
    (i) => i.status === "sent" || i.status === "overdue" || i.status === "pending_verification"
  ).length;

  const tabs: PortalTabDefinition[] = PROJECT_TABS.map((tab) => ({
    id: tab.id,
    label: tab.label,
    icon: tab.icon,
    badge:
      tab.id === "messages"
        ? unread
        : tab.id === "files"
        ? filesPending
        : tab.id === "payments"
        ? outstandingInvoices
        : 0,
  }));

  return (
    <div className="space-y-6">
      <Link
        href="/client/projects"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--studio-ink-soft)] transition hover:text-[var(--studio-ink)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All projects
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
              {detail.project.type ? detail.project.type : "Studio engagement"}
            </div>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)] sm:text-3xl">
              {detail.project.title}
            </h1>
            {detail.project.summary ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--studio-ink-soft)]">
                {detail.project.summary}
              </p>
            ) : null}
          </div>
          <StatusBadge tone={status.tone} label={status.label} />
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-[var(--studio-ink-soft)]">
          {detail.project.startDate ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Started {shortDate(detail.project.startDate)}
            </span>
          ) : null}
          {detail.project.estimatedCompletion ? (
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Est. complete {shortDate(detail.project.estimatedCompletion)}
            </span>
          ) : null}
          {detail.milestones.length > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {detail.milestones.filter((m) => ["approved", "complete"].includes(m.status)).length}/
              {detail.milestones.length} milestones
            </span>
          ) : null}
        </div>
      </header>

      <PortalTabBar tabs={tabs} />

      {activeTab === "overview" ? <OverviewTab detail={detail} /> : null}
      {activeTab === "progress" ? <ProgressTab detail={detail} /> : null}
      {activeTab === "files" ? <FilesTab detail={detail} /> : null}
      {activeTab === "messages" ? (
        <MessageThread
          projectId={detail.project.id}
          initialMessages={detail.messages}
          viewerId={viewer.userId}
          viewerName={viewer.fullName || viewer.email || "You"}
        />
      ) : null}
      {activeTab === "payments" ? <PaymentsTab detail={detail} /> : null}
    </div>
  );
}

function OverviewTab({ detail }: { detail: NonNullable<Awaited<ReturnType<typeof getClientProjectDetail>>> }) {
  const recent = detail.updates.slice(0, 6);
  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-4">
        <section className="portal-card-elev p-5 sm:p-7">
          <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
            About this project
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--studio-ink-soft)]">
            {detail.project.brief ||
              detail.project.summary ||
              "Your project brief will appear here once we capture it. The team uses this as the source of truth for scope and direction."}
          </p>
          {detail.project.nextAction ? (
            <div className="mt-4 rounded-2xl border border-[var(--studio-line-strong)] bg-[rgba(151,244,243,0.04)] px-4 py-3 text-[13px] text-[var(--studio-ink)]">
              <span className="font-semibold text-[var(--studio-signal)]">Next: </span>
              {detail.project.nextAction}
            </div>
          ) : null}
        </section>

        {detail.milestones.length > 0 ? (
          <section className="portal-card p-5 sm:p-6">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
              Timeline at a glance
            </h2>
            <div className="mt-4">
              <MilestoneProgress milestones={detail.milestones} layout="horizontal" />
            </div>
          </section>
        ) : null}
      </div>

      <div className="space-y-4">
        <section className="portal-card p-5">
          <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
            Recent activity
          </h2>
          {recent.length > 0 ? (
            <div className="mt-4">
              <ActivityFeed updates={recent} />
            </div>
          ) : (
            <p className="mt-3 text-[13px] leading-5 text-[var(--studio-ink-soft)]">
              Activity will appear here as we move through milestones, share files, and post updates.
            </p>
          )}
        </section>

        <section className="portal-card p-5">
          <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
            Quick links
          </h2>
          <div className="mt-3 flex flex-col gap-2 text-[13px]">
            <Link
              href={`/client/projects/${detail.project.id}?tab=files`}
              className="inline-flex items-center justify-between gap-2 rounded-xl border border-[var(--studio-line)] bg-[rgba(255,255,255,0.03)] px-3 py-2 font-semibold text-[var(--studio-ink)] hover:border-[rgba(151,244,243,0.4)]"
            >
              <span className="inline-flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                Files
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--studio-ink-soft)]" />
            </Link>
            <Link
              href={`/client/projects/${detail.project.id}?tab=messages`}
              className="inline-flex items-center justify-between gap-2 rounded-xl border border-[var(--studio-line)] bg-[rgba(255,255,255,0.03)] px-3 py-2 font-semibold text-[var(--studio-ink)] hover:border-[rgba(151,244,243,0.4)]"
            >
              <span className="inline-flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5" />
                Messages
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--studio-ink-soft)]" />
            </Link>
            <Link
              href={`/client/projects/${detail.project.id}?tab=payments`}
              className="inline-flex items-center justify-between gap-2 rounded-xl border border-[var(--studio-line)] bg-[rgba(255,255,255,0.03)] px-3 py-2 font-semibold text-[var(--studio-ink)] hover:border-[rgba(151,244,243,0.4)]"
            >
              <span className="inline-flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5" />
                Payments
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--studio-ink-soft)]" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function ProgressTab({ detail }: { detail: NonNullable<Awaited<ReturnType<typeof getClientProjectDetail>>> }) {
  if (detail.milestones.length === 0) {
    return (
      <PortalEmptyState
        icon={History}
        title="Milestones will appear once we kick off"
        body="Once the project starts, you will see every milestone here with its status, due date, and the deliverables linked to it."
      />
    );
  }

  return (
    <section className="portal-card-elev p-5 sm:p-7">
      <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
        Milestone tracker
      </h2>
      <p className="mt-1.5 text-[13px] leading-5 text-[var(--studio-ink-soft)]">
        This is the answer to &ldquo;what stage are we at?&rdquo; — the current milestone is highlighted, and
        completed work shows the date it was approved.
      </p>
      <div className="mt-5">
        <MilestoneProgress milestones={detail.milestones} layout="vertical" />
      </div>
    </section>
  );
}

function FilesTab({ detail }: { detail: NonNullable<Awaited<ReturnType<typeof getClientProjectDetail>>> }) {
  const grouped = new Map<string | null, typeof detail.deliverables>();
  for (const deliverable of detail.deliverables) {
    const key = deliverable.milestoneId ?? null;
    grouped.set(key, [...(grouped.get(key) ?? []), deliverable]);
  }

  if (detail.deliverables.length === 0) {
    return (
      <PortalEmptyState
        icon={Folder}
        title="No deliverables shared yet"
        body="As the team prepares files — design directions, prototypes, final assets — they will land here grouped by milestone."
      />
    );
  }

  return (
    <div className="space-y-5">
      {[...grouped.entries()].map(([milestoneId, deliverables]) => {
        const milestone = milestoneId
          ? detail.milestones.find((m) => m.id === milestoneId)
          : null;
        const heading = milestone?.title || "Other files";

        return (
          <section key={milestoneId ?? "_other"} className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-[14.5px] font-semibold tracking-[-0.005em] text-[var(--studio-ink)]">
                {heading}
              </h3>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                {deliverables.length} item{deliverables.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {deliverables.map((deliverable) => (
                <FileCard key={deliverable.id} deliverable={deliverable} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function PaymentsTab({ detail }: { detail: NonNullable<Awaited<ReturnType<typeof getClientProjectDetail>>> }) {
  const summary = detail.paymentSummary;

  return (
    <div className="space-y-5">
      <section className="portal-card-elev grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
        <SummaryStat label="Project value" value={formatKobo(summary.totalKobo, summary.currency)} />
        <SummaryStat label="Paid" value={formatKobo(summary.paidKobo, summary.currency)} accent="success" />
        <SummaryStat
          label="Remaining"
          value={formatKobo(summary.outstandingKobo, summary.currency)}
          accent={summary.outstandingKobo > 0 ? "warn" : "neutral"}
        />
      </section>

      {detail.invoices.length === 0 ? (
        <PortalEmptyState
          icon={Receipt}
          title="No invoices yet"
          body="When we issue an invoice for this project, it will appear here with bank details and a one-click pay button."
        />
      ) : (
        <section className="space-y-3">
          {detail.invoices.map((invoice) => {
            const status = invoiceStatusToken(invoice.status);
            const payable = invoice.status === "sent" || invoice.status === "overdue";
            return (
              <article
                key={invoice.id}
                className="portal-card flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:p-5"
              >
                <div className="min-w-0">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                    {invoice.invoiceNumber}
                    {invoice.dueDate ? ` · Due ${shortDate(invoice.dueDate)}` : ""}
                  </div>
                  <div className="mt-1 truncate text-[15px] font-semibold text-[var(--studio-ink)]">
                    {invoice.description || "Studio invoice"}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[var(--studio-ink-soft)]">
                    <StatusBadge tone={status.tone} label={status.label} size="sm" />
                    <span>{formatKobo(invoice.amountKobo, invoice.currency)}</span>
                  </div>
                </div>
                {payable ? (
                  <Link
                    href={`/client/payment/${invoice.id}`}
                    className="portal-button portal-button-primary self-start"
                  >
                    Pay now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : invoice.status === "pending_verification" ? (
                  <span className="self-start text-[12px] font-semibold text-[var(--studio-ink-soft)]">
                    Verifying with finance
                  </span>
                ) : null}
              </article>
            );
          })}
        </section>
      )}

      {detail.payments.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-[14.5px] font-semibold text-[var(--studio-ink)]">Payment history</h3>
          <div className="portal-card divide-y divide-[var(--studio-line)]">
            {detail.payments.map((payment) => {
              const status = paymentStatusToken(payment.status);
              return (
                <div key={payment.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                      {payment.paymentReference || "Bank transfer"}
                    </div>
                    <div className="mt-0.5 text-[13.5px] font-semibold text-[var(--studio-ink)]">
                      {formatKobo(payment.amountKobo, payment.currency)}
                    </div>
                    <div className="mt-1 text-[11.5px] text-[var(--studio-ink-soft)]">
                      Submitted {shortDate(payment.submittedAt) || "—"}
                      {payment.verifiedAt ? ` · Verified ${shortDate(payment.verifiedAt)}` : ""}
                    </div>
                  </div>
                  <StatusBadge tone={status.tone} label={status.label} size="sm" />
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  accent = "neutral",
}: {
  label: string;
  value: string;
  accent?: "neutral" | "success" | "warn";
}) {
  const valueClass =
    accent === "success"
      ? "text-[#bdf2cf]"
      : accent === "warn"
      ? "text-[#f3d28a]"
      : "text-[var(--studio-ink)]";
  return (
    <div className="rounded-2xl border border-[var(--studio-line)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
        {label}
      </div>
      <div className={`mt-2 text-xl font-semibold tracking-[-0.01em] ${valueClass}`}>{value}</div>
    </div>
  );
}
