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
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";
import { resolveLocalizedDynamicField } from "@henryco/i18n/server";
import { emitEvent } from "@henryco/observability/events";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { requireClientPortalViewer } from "@/lib/portal/auth";
import {
  getClientProjectDetail,
  unreadCountForProject,
} from "@/lib/portal/data";
import { getDeliverableRevisionStates } from "@/lib/portal/deliverable-revisions";
import { isProjectPaid } from "@/lib/studio/project-payment";
import { formatKobo, shortDate } from "@/lib/portal/helpers";
import {
  invoiceStatusToken,
  paymentStatusToken,
  projectStatusToken,
} from "@/lib/portal/status";
import { ActivityFeed } from "@/components/portal/activity-feed";
import {
  PortalDeliverableCard,
  type PortalDeliverableView,
} from "@/components/portal/portal-deliverable-card";
import { DeliverableApprovalPanel } from "@/components/portal/deliverable-approval-panel";
import { StudioMessageThread } from "@/components/portal/StudioMessageThread";
import { MilestoneProgress } from "@/components/portal/milestone-progress";
import { PortalEmptyState } from "@/components/portal/empty-state";
import { PortalTabBar, type PortalTabDefinition } from "@/components/portal/tabs";
import { StatusBadge } from "@/components/portal/status-badge";
import type { ClientDeliverable } from "@/types/portal";

// V3-73 — sanitize a deliverable for the client boundary: never ship the raw
// file/thumbnail URL or public id into a "use client" component (it would leak
// the un-watermarked, un-gated original into the page payload). The card only
// needs presence + previewability booleans; URLs resolve server-side via the
// gated asset-unlock route.
function toDeliverableView(deliverable: ClientDeliverable): PortalDeliverableView {
  const hasFile = Boolean(deliverable.fileUrl);
  return {
    id: deliverable.id,
    title: deliverable.title,
    description: deliverable.description ?? null,
    version: deliverable.version,
    status: deliverable.status,
    sharedAt: deliverable.sharedAt ?? null,
    fileType: deliverable.fileType,
    hasFile,
    canPreview: deliverable.fileType === "image" && hasFile,
  };
}

export const metadata: Metadata = {
  title: "Project",
};

type ProjectTabId = "overview" | "progress" | "files" | "approvals" | "messages" | "payments";

function buildProjectTabs(locale: AppLocale): Array<{
  id: ProjectTabId;
  label: string;
  icon: typeof Inbox;
}> {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  return [
    { id: "overview", label: t("Overview"), icon: Inbox },
    { id: "progress", label: t("Progress"), icon: History },
    { id: "files", label: t("Files"), icon: FileText },
    { id: "approvals", label: t("Approvals"), icon: ShieldCheck },
    { id: "messages", label: t("Messages"), icon: MessageSquare },
    { id: "payments", label: t("Payments"), icon: CreditCard },
  ];
}

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

  const locale = await getStudioPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const projectTabs = buildProjectTabs(locale);

  // V3-73 — telemetry: a client opened the project portal. Emit once per entry
  // (the default overview load, i.e. no ?tab=) so tab switches and the
  // approval-panel's router.refresh() don't inflate the client_viewed metric.
  if (!tabParam) {
    emitEvent({
      name: "henry.studio_project.client_viewed",
      classification: "user_action",
      outcome: "completed",
      actorId: viewer.userId,
      payload: { project_id: detail.project.id },
    });
  }

  // Final-file unlock is gated on confirmed-paid money-truth (READ-ONLY).
  const finalsLocked = !isProjectPaid(detail.paymentSummary);
  // Per-deliverable revision rounds + round-trip counter (RLS-scoped read).
  const revisionStates = await getDeliverableRevisionStates(detail.project.id);

  // WAVE1 — wrap Supabase-row text fields through resolveLocalizedDynamicField
  // so non-EN locales hit the cached DeepL pipeline (and any `_i18n` /
  // `locale_overrides` cells when present). Single-row detail page, so the
  // DeepL cost is acceptable. Milestones / deliverables / updates / invoice
  // descriptions ship through Promise.all alongside the project fields. The
  // chat thread (initial messages) is rendered by StudioMessageThread and is
  // intentionally skipped — those are user-typed messages.
  const [
    localizedProjectTitle,
    localizedProjectSummary,
    localizedProjectBrief,
    localizedProjectNextAction,
    localizedMilestones,
    localizedDeliverables,
    localizedUpdates,
    localizedInvoices,
  ] = await Promise.all([
    resolveLocalizedDynamicField({
      record: detail.project as unknown as Record<string, unknown>,
      field: "title",
      locale,
      fallback: detail.project.title ?? "",
      machineTranslate: locale !== "en",
    }),
    resolveLocalizedDynamicField({
      record: detail.project as unknown as Record<string, unknown>,
      field: "summary",
      locale,
      fallback: detail.project.summary ?? "",
      machineTranslate: locale !== "en",
    }),
    resolveLocalizedDynamicField({
      record: detail.project as unknown as Record<string, unknown>,
      field: "brief",
      locale,
      fallback: detail.project.brief ?? "",
      machineTranslate: locale !== "en",
    }),
    resolveLocalizedDynamicField({
      record: detail.project as unknown as Record<string, unknown>,
      field: "nextAction",
      locale,
      fallback: detail.project.nextAction ?? "",
      machineTranslate: locale !== "en",
    }),
    Promise.all(
      detail.milestones.map(async (milestone) => {
        const [title, description] = await Promise.all([
          resolveLocalizedDynamicField({
            record: milestone as unknown as Record<string, unknown>,
            field: "title",
            locale,
            fallback: milestone.title ?? "",
            machineTranslate: locale !== "en",
          }),
          resolveLocalizedDynamicField({
            record: milestone as unknown as Record<string, unknown>,
            field: "description",
            locale,
            fallback: milestone.description ?? "",
            machineTranslate: locale !== "en",
          }),
        ]);
        return { ...milestone, title, description };
      }),
    ),
    Promise.all(
      detail.deliverables.map(async (deliverable) => {
        const [title, description] = await Promise.all([
          resolveLocalizedDynamicField({
            record: deliverable as unknown as Record<string, unknown>,
            field: "title",
            locale,
            fallback: deliverable.title ?? "",
            machineTranslate: locale !== "en",
          }),
          resolveLocalizedDynamicField({
            record: deliverable as unknown as Record<string, unknown>,
            field: "description",
            locale,
            fallback: deliverable.description ?? "",
            machineTranslate: locale !== "en",
          }),
        ]);
        return { ...deliverable, title, description };
      }),
    ),
    Promise.all(
      detail.updates.map(async (update) => {
        const [title, body] = await Promise.all([
          resolveLocalizedDynamicField({
            record: update as unknown as Record<string, unknown>,
            field: "title",
            locale,
            fallback: update.title ?? "",
            machineTranslate: locale !== "en",
          }),
          update.body
            ? resolveLocalizedDynamicField({
                record: update as unknown as Record<string, unknown>,
                field: "body",
                locale,
                fallback: update.body ?? "",
                machineTranslate: locale !== "en",
              })
            : Promise.resolve(update.body ?? null),
        ]);
        return { ...update, title, body };
      }),
    ),
    Promise.all(
      detail.invoices.map(async (invoice) => {
        const description = await resolveLocalizedDynamicField({
          record: invoice as unknown as Record<string, unknown>,
          field: "description",
          locale,
          fallback: invoice.description ?? "",
          machineTranslate: locale !== "en",
        });
        return { ...invoice, description };
      }),
    ),
  ]);

  // Build a locale-aware detail shape so the existing tab renderers can
  // continue to use the same prop names without further changes.
  const localizedDetail = {
    ...detail,
    project: {
      ...detail.project,
      title: localizedProjectTitle,
      summary: localizedProjectSummary,
      brief: localizedProjectBrief,
      nextAction: localizedProjectNextAction,
    },
    milestones: localizedMilestones,
    deliverables: localizedDeliverables,
    updates: localizedUpdates,
    invoices: localizedInvoices,
  };

  const activeTab =
    projectTabs.find((tab) => tab.id === tabParam)?.id ?? "overview";

  const status = projectStatusToken(localizedDetail.project.status, locale);
  const unread = unreadCountForProject(localizedDetail.messages, viewer.userId);
  const filesPending = localizedDetail.deliverables.filter((d) => d.status === "shared").length;
  const outstandingInvoices = localizedDetail.invoices.filter(
    (i) => i.status === "sent" || i.status === "overdue" || i.status === "pending_verification"
  ).length;
  const awaitingApproval = localizedDetail.deliverables.filter((d) => {
    const revisionState = revisionStates.get(d.id);
    return (revisionState?.latestStatus ?? null) !== "approved" && d.status !== "approved";
  }).length;

  const tabs: PortalTabDefinition[] = projectTabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    icon: tab.icon,
    badge:
      tab.id === "messages"
        ? unread
        : tab.id === "files"
        ? filesPending
        : tab.id === "approvals"
        ? awaitingApproval
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
        {t("All projects")}
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
              {localizedDetail.project.type ? localizedDetail.project.type : t("Studio engagement")}
            </div>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)] sm:text-3xl">
              {localizedDetail.project.title}
            </h1>
            {localizedDetail.project.summary ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--studio-ink-soft)]">
                {localizedDetail.project.summary}
              </p>
            ) : null}
          </div>
          <StatusBadge tone={status.tone} label={status.label} />
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-[var(--studio-ink-soft)]">
          {localizedDetail.project.startDate ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {t("Started")} {shortDate(localizedDetail.project.startDate)}
            </span>
          ) : null}
          {localizedDetail.project.estimatedCompletion ? (
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {t("Est. complete")} {shortDate(localizedDetail.project.estimatedCompletion)}
            </span>
          ) : null}
          {localizedDetail.milestones.length > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {localizedDetail.milestones.filter((m) => ["approved", "complete"].includes(m.status)).length}/
              {localizedDetail.milestones.length} {t("milestones")}
            </span>
          ) : null}
        </div>
      </header>

      <PortalTabBar tabs={tabs} />

      {activeTab === "overview" ? <OverviewTab detail={localizedDetail} locale={locale} /> : null}
      {activeTab === "progress" ? <ProgressTab detail={localizedDetail} locale={locale} /> : null}
      {activeTab === "files" ? (
        <FilesTab detail={localizedDetail} locale={locale} finalsLocked={finalsLocked} />
      ) : null}
      {activeTab === "approvals" ? (
        <ApprovalsTab
          detail={localizedDetail}
          locale={locale}
          revisionStates={revisionStates}
          finalsLocked={finalsLocked}
        />
      ) : null}
      {activeTab === "messages" ? (
        <StudioMessageThread
          projectId={localizedDetail.project.id}
          initialMessages={localizedDetail.messages}
          viewerId={viewer.userId}
          viewerName={viewer.fullName || viewer.email || t("You")}
          projectTitle={localizedDetail.project.title}
          projectSummary={localizedDetail.project.summary || localizedDetail.project.brief || null}
        />
      ) : null}
      {activeTab === "payments" ? <PaymentsTab detail={localizedDetail} locale={locale} /> : null}
    </div>
  );
}

function OverviewTab({
  detail,
  locale,
}: {
  detail: NonNullable<Awaited<ReturnType<typeof getClientProjectDetail>>>;
  locale: AppLocale;
}) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const recent = detail.updates.slice(0, 6);
  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-4">
        <section className="portal-card-elev p-5 sm:p-7">
          <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
            {t("About this project")}
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--studio-ink-soft)]">
            {detail.project.brief ||
              detail.project.summary ||
              t(
                "Your project brief will appear here once we capture it. The team uses this as the source of truth for scope and direction.",
              )}
          </p>
          {detail.project.nextAction ? (
            <div className="mt-4 rounded-2xl border border-[var(--studio-line-strong)] bg-[var(--studio-accent-soft)] px-4 py-3 text-[13px] text-[var(--studio-ink)]">
              <span className="font-semibold text-[var(--studio-signal)]">{t("Next")}: </span>
              {detail.project.nextAction}
            </div>
          ) : null}
        </section>

        {detail.milestones.length > 0 ? (
          <section className="portal-card p-5 sm:p-6">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
              {t("Timeline at a glance")}
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
            {t("Recent activity")}
          </h2>
          {recent.length > 0 ? (
            <div className="mt-4">
              <ActivityFeed updates={recent} />
            </div>
          ) : (
            <p className="mt-3 text-[13px] leading-5 text-[var(--studio-ink-soft)]">
              {t("Activity will appear here as we move through milestones, share files, and post updates.")}
            </p>
          )}
        </section>

        <section className="portal-card p-5">
          <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
            {t("Quick links")}
          </h2>
          <div className="mt-3 flex flex-col gap-2 text-[13px]">
            <Link
              href={`/client/projects/${detail.project.id}?tab=files`}
              className="inline-flex items-center justify-between gap-2 rounded-xl border border-[var(--studio-line)] bg-[var(--studio-fill-faint)] px-3 py-2 font-semibold text-[var(--studio-ink)] hover:border-[var(--studio-accent-ring)]"
            >
              <span className="inline-flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                {t("Files")}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--studio-ink-soft)]" />
            </Link>
            <Link
              href={`/client/projects/${detail.project.id}?tab=messages`}
              className="inline-flex items-center justify-between gap-2 rounded-xl border border-[var(--studio-line)] bg-[var(--studio-fill-faint)] px-3 py-2 font-semibold text-[var(--studio-ink)] hover:border-[var(--studio-accent-ring)]"
            >
              <span className="inline-flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5" />
                {t("Messages")}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--studio-ink-soft)]" />
            </Link>
            <Link
              href={`/client/projects/${detail.project.id}?tab=payments`}
              className="inline-flex items-center justify-between gap-2 rounded-xl border border-[var(--studio-line)] bg-[var(--studio-fill-faint)] px-3 py-2 font-semibold text-[var(--studio-ink)] hover:border-[var(--studio-accent-ring)]"
            >
              <span className="inline-flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5" />
                {t("Payments")}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--studio-ink-soft)]" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function ProgressTab({
  detail,
  locale,
}: {
  detail: NonNullable<Awaited<ReturnType<typeof getClientProjectDetail>>>;
  locale: AppLocale;
}) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  if (detail.milestones.length === 0) {
    return (
      <PortalEmptyState
        icon={History}
        title={t("Milestones will appear once we kick off")}
        body={t("Once the project starts, you will see every milestone here with its status, due date, and the deliverables linked to it.")}
      />
    );
  }

  return (
    <section className="portal-card-elev p-5 sm:p-7">
      <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
        {t("Milestone tracker")}
      </h2>
      <p className="mt-1.5 text-[13px] leading-5 text-[var(--studio-ink-soft)]">
        {t("This is the answer to “what stage are we at?” — the current milestone is highlighted, and completed work shows the date it was approved.")}
      </p>
      <div className="mt-5">
        <MilestoneProgress milestones={detail.milestones} layout="vertical" />
      </div>
    </section>
  );
}

function FilesTab({
  detail,
  locale,
  finalsLocked,
}: {
  detail: NonNullable<Awaited<ReturnType<typeof getClientProjectDetail>>>;
  locale: AppLocale;
  finalsLocked: boolean;
}) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const grouped = new Map<string | null, typeof detail.deliverables>();
  for (const deliverable of detail.deliverables) {
    const key = deliverable.milestoneId ?? null;
    grouped.set(key, [...(grouped.get(key) ?? []), deliverable]);
  }

  if (detail.deliverables.length === 0) {
    return (
      <PortalEmptyState
        icon={Folder}
        title={t("No deliverables shared yet")}
        body={t("As the team prepares files — design directions, prototypes, final assets — they will land here grouped by milestone.")}
      />
    );
  }

  return (
    <div className="space-y-5">
      {finalsLocked ? (
        <div className="rounded-2xl border border-[var(--studio-amber-line)] bg-[var(--studio-amber-soft)] px-4 py-3 text-[12.5px] text-[var(--studio-amber-ink)]">
          {t("Previews are watermarked. Final, full-resolution files unlock automatically once your payment is confirmed.")}
        </div>
      ) : null}
      {[...grouped.entries()].map(([milestoneId, deliverables]) => {
        const milestone = milestoneId
          ? detail.milestones.find((m) => m.id === milestoneId)
          : null;
        const heading = milestone?.title || t("Other files");

        return (
          <section key={milestoneId ?? "_other"} className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-[14.5px] font-semibold tracking-[-0.005em] text-[var(--studio-ink)]">
                {heading}
              </h3>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                {deliverables.length} {deliverables.length === 1 ? t("item") : t("items")}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {deliverables.map((deliverable) => (
                <PortalDeliverableCard
                  key={deliverable.id}
                  deliverable={toDeliverableView(deliverable)}
                  locked={finalsLocked}
                  locale={locale}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ApprovalsTab({
  detail,
  locale,
  revisionStates,
  finalsLocked,
}: {
  detail: NonNullable<Awaited<ReturnType<typeof getClientProjectDetail>>>;
  locale: AppLocale;
  revisionStates: Awaited<ReturnType<typeof getDeliverableRevisionStates>>;
  finalsLocked: boolean;
}) {
  const t = (text: string) => translateSurfaceLabel(locale, text);

  if (detail.deliverables.length === 0) {
    return (
      <PortalEmptyState
        icon={ShieldCheck}
        title={t("Nothing to approve yet")}
        body={t("When the team shares a deliverable, you'll approve it or request changes here. Every approval is signed and recorded.")}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[12.5px] leading-5 text-[var(--studio-ink-soft)]">
        {t("Review each deliverable, then approve it or request changes. Your included revision rounds are tracked per deliverable.")}
      </p>
      {detail.deliverables.map((deliverable) => {
        const state = revisionStates.get(deliverable.id) ?? {
          allowance: 3,
          used: 0,
          remaining: 3,
          exhausted: false,
          billable: false,
          latestStatus: null,
          rounds: [],
        };
        return (
          <div key={deliverable.id} className="space-y-3">
            <DeliverableApprovalPanel
              deliverableId={deliverable.id}
              deliverableTitle={deliverable.title}
              state={state}
              locale={locale}
            />
            <PortalDeliverableCard
              deliverable={toDeliverableView(deliverable)}
              locked={finalsLocked}
              locale={locale}
            />
          </div>
        );
      })}
    </div>
  );
}

function PaymentsTab({
  detail,
  locale,
}: {
  detail: NonNullable<Awaited<ReturnType<typeof getClientProjectDetail>>>;
  locale: AppLocale;
}) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const summary = detail.paymentSummary;

  return (
    <div className="space-y-5">
      <section className="portal-card-elev grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
        <SummaryStat label={t("Project value")} value={formatKobo(summary.totalKobo, summary.currency)} />
        <SummaryStat label={t("Paid")} value={formatKobo(summary.paidKobo, summary.currency)} accent="success" />
        <SummaryStat
          label={t("Remaining")}
          value={formatKobo(summary.outstandingKobo, summary.currency)}
          accent={summary.outstandingKobo > 0 ? "warn" : "neutral"}
        />
      </section>

      {detail.invoices.length === 0 ? (
        <PortalEmptyState
          icon={Receipt}
          title={t("No invoices yet")}
          body={t("When we issue an invoice for this project, it will appear here with bank details and a one-click pay button.")}
        />
      ) : (
        <section className="space-y-3">
          {detail.invoices.map((invoice) => {
            const status = invoiceStatusToken(invoice.status, locale);
            const payable = invoice.status === "sent" || invoice.status === "overdue";
            return (
              <article
                key={invoice.id}
                className="portal-card flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:p-5"
              >
                <div className="min-w-0">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                    {invoice.invoiceNumber}
                    {invoice.dueDate ? ` · ${t("Due")} ${shortDate(invoice.dueDate)}` : ""}
                  </div>
                  <div className="mt-1 truncate text-[15px] font-semibold text-[var(--studio-ink)]">
                    {invoice.description || t("Studio invoice")}
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
                    {t("Pay now")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : invoice.status === "pending_verification" ? (
                  <span className="self-start text-[12px] font-semibold text-[var(--studio-ink-soft)]">
                    {t("Verifying with finance")}
                  </span>
                ) : null}
              </article>
            );
          })}
        </section>
      )}

      {detail.payments.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-[14.5px] font-semibold text-[var(--studio-ink)]">{t("Payment history")}</h3>
          <div className="portal-card divide-y divide-[var(--studio-line)]">
            {detail.payments.map((payment) => {
              const status = paymentStatusToken(payment.status, locale);
              return (
                <div key={payment.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                      {payment.paymentReference || t("Bank transfer")}
                    </div>
                    <div className="mt-0.5 text-[13.5px] font-semibold text-[var(--studio-ink)]">
                      {formatKobo(payment.amountKobo, payment.currency)}
                    </div>
                    <div className="mt-1 text-[11.5px] text-[var(--studio-ink-soft)]">
                      {t("Submitted")} {shortDate(payment.submittedAt) || "—"}
                      {payment.verifiedAt ? ` · ${t("Verified")} ${shortDate(payment.verifiedAt)}` : ""}
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
      ? "text-[var(--studio-green-ink)]"
      : accent === "warn"
      ? "text-[var(--studio-amber-ink)]"
      : "text-[var(--studio-ink)]";
  return (
    <div className="rounded-2xl border border-[var(--studio-line)] bg-[var(--studio-fill-faint)] px-4 py-3">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
        {label}
      </div>
      <div className={`mt-2 text-xl font-semibold tracking-[-0.01em] ${valueClass}`}>{value}</div>
    </div>
  );
}
