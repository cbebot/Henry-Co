import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  LifeBuoy,
  Palette,
  Rocket,
} from "lucide-react";
import { formatSurfaceTemplate, translateSurfaceLabel } from "@henryco/i18n/server";
import { requireAccountUser } from "@/lib/auth";
import { formatCurrencyAmount, formatDate, timeAgo } from "@/lib/format";
import { getStudioDashboardData } from "@/lib/studio-module";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";

function statusChip(status: string) {
  if (["paid", "approved", "delivered"].includes(status)) return "acct-chip acct-chip-green";
  if (["processing", "active", "in_review", "ready_for_review"].includes(status)) return "acct-chip acct-chip-blue";
  if (["pending_deposit", "requested", "overdue"].includes(status)) return "acct-chip acct-chip-orange";
  return "acct-chip acct-chip-gold";
}

export default async function StudioPage() {
  const locale = await getAccountAppLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const tf = (template: string, values: Record<string, string | number>) =>
    formatSurfaceTemplate(template, values);
  const user = await requireAccountUser();
  const data = await getStudioDashboardData(user.id, user.email);

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title={t("Studio")}
        description={t("A real project workspace fed by HenryCo Studio’s synced proposal, project, payment, and delivery records.")}
        icon={Palette}
        actions={
          <div className="flex flex-wrap gap-3">
            <a
              href="https://studio.henrycogroup.com/request"
              target="_blank"
              rel="noreferrer"
              className="acct-button-secondary rounded-xl"
            >
              {t("Start a new brief")} <ArrowUpRight size={14} />
            </a>
            <a
              href="https://studio.henrycogroup.com"
              target="_blank"
              rel="noreferrer"
              className="acct-button-primary rounded-xl"
            >
              {t("Open Studio site")} <ArrowUpRight size={14} />
            </a>
          </div>
        }
      />

      <section className="acct-card overflow-hidden">
        <div className="bg-[linear-gradient(135deg,#0F172A_0%,#7C2D12_46%,#C9A227_100%)] px-6 py-7 text-white sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-white/70">{t("Studio project room")}</p>
              <h2 className="mt-3 acct-display text-3xl leading-tight sm:text-4xl">
                {t("Your build journey now reads like a live workspace, not a dead status list.")}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/78">
                {t("Proposals, milestones, payment proofs, deliverables, and communication signals stay connected to the same HenryCo account identity you use everywhere else.")}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: t("Active projects"), value: data.metrics.activeProjects, detail: t("Live workspaces with delivery movement.") },
                { label: t("Pending payments"), value: data.metrics.pendingPayments, detail: t("Commercial checkpoints still open.") },
                { label: t("Proof submitted"), value: data.metrics.proofSubmitted, detail: t("Payments already waiting on review.") },
                { label: t("Deliverables"), value: data.metrics.deliverables, detail: t("Files and shared outputs tracked in one place.") },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/70">{item.label}</div>
                  <div className="mt-3 text-3xl font-semibold">{item.value}</div>
                  <p className="mt-2 text-sm leading-6 text-white/72">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {data.projects.length === 0 && data.proposals.length === 0 ? (
        <section className="acct-card p-6">
          <EmptyState
            icon={Rocket}
            title={t("No Studio workspaces are linked yet")}
            description={t("As soon as a proposal or project is created with your HenryCo identity, the synced Studio room will appear here with payments, updates, and delivery state.")}
            action={
              <a
                href="https://studio.henrycogroup.com/request"
                target="_blank"
                rel="noreferrer"
                className="acct-button-primary rounded-xl"
              >
                {t("Start a Studio request")}
              </a>
            }
          />
        </section>
      ) : null}

      {data.projects.length > 0 ? (
        <section className="acct-card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="acct-kicker">{t("Active project rooms")}</p>
              <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{t("Delivery lanes with real project state")}</h3>
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {data.projects.map((project) => (
              <Link
                key={project.id}
                href={`/studio/projects/${project.id}`}
                className="rounded-[1.6rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-5 transition hover:border-[var(--acct-gold)]/30 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={statusChip(project.status)}>{t(project.status.replaceAll("_", " "))}</span>
                  <span className="acct-chip acct-chip-gold">{tf("{percent}% complete", { percent: project.milestoneProgress })}</span>
                  {project.latestPaymentStatus ? (
                    <span className={statusChip(project.latestPaymentStatus)}>
                      {t("Payment")} {t(project.latestPaymentStatus.replaceAll("_", " "))}
                    </span>
                  ) : null}
                </div>
                <h4 className="mt-4 text-lg font-semibold text-[var(--acct-ink)]">{project.title}</h4>
                <p className="mt-2 text-sm leading-7 text-[var(--acct-muted)]">{project.nextAction}</p>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--acct-line)]">
                  <div className="h-full rounded-full bg-[var(--acct-gold)]" style={{ width: `${project.milestoneProgress}%` }} />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[var(--acct-surface)] p-3">
                    <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">
                      {t("Milestones")}
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-[var(--acct-ink)]">
                      {project.approvedMilestones}/{project.totalMilestones || 0}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[var(--acct-surface)] p-3">
                    <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">
                      {t("Open payments")}
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-[var(--acct-ink)]">{project.openPayments}</div>
                  </div>
                  <div className="rounded-2xl bg-[var(--acct-surface)] p-3">
                    <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">
                      {t("Deliverables")}
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-[var(--acct-ink)]">{project.deliverables}</div>
                  </div>
                </div>

                <div className="mt-4 flex items-start justify-between gap-4 rounded-2xl bg-[var(--acct-surface)] p-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--acct-ink)]">
                      <Clock3 size={14} className="text-[var(--acct-gold)]" />
                      {t("Latest movement")}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">
                      {project.latestUpdate?.summary ? t(project.latestUpdate.summary) : t("Studio is preparing the next project update.")}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--acct-muted)]">
                    {project.latestUpdate?.createdAt ? timeAgo(project.latestUpdate.createdAt) : timeAgo(project.updatedAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="acct-card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="acct-kicker">{t("Commercial checkpoints")}</p>
              <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{t("Payments and proof visibility")}</h3>
            </div>
          </div>
          {data.payments.length === 0 ? (
            <p className="text-sm leading-7 text-[var(--acct-muted)]">
              {t("Studio payment checkpoints will appear here when a proposal or project is live.")}
            </p>
          ) : (
            <div className="space-y-3">
              {data.payments.slice(0, 6).map((payment) => (
                <Link
                  key={payment.id}
                  href={`/studio/payments/${payment.id}`}
                  className="block rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] px-4 py-4 transition hover:border-[var(--acct-gold)]/25"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={statusChip(payment.status)}>{t(payment.status.replaceAll("_", " "))}</span>
                    <span className="acct-chip acct-chip-blue">{t(payment.method.replaceAll("_", " "))}</span>
                    {payment.proofUrl ? <span className="acct-chip acct-chip-gold">{t("Proof uploaded")}</span> : null}
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[var(--acct-ink)]">{payment.label}</p>
                      <p className="mt-1 text-sm text-[var(--acct-muted)]">
                        {formatCurrencyAmount(payment.amount, payment.currency)}
                      </p>
                    </div>
                    <div className="text-right text-xs text-[var(--acct-muted)]">
                      {payment.dueDate ? tf("Due {date}", { date: formatDate(payment.dueDate) }) : timeAgo(payment.updatedAt)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="acct-card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="acct-kicker">{t("Proposals and help lane")}</p>
              <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{t("Commercial context and follow-up")}</h3>
            </div>
          </div>

          <div className="space-y-3">
            {data.proposals.slice(0, 3).map((proposal) => (
              <div key={proposal.id} className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] px-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={statusChip(proposal.status)}>{t(proposal.status.replaceAll("_", " "))}</span>
                  <span className="acct-chip acct-chip-gold">
                    {tf("Deposit {amount}", { amount: formatCurrencyAmount(proposal.depositAmount, proposal.currency) })}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-[var(--acct-ink)]">{proposal.title}</p>
                <p className="mt-1 text-sm text-[var(--acct-muted)]">
                  {tf("Total {amount}", { amount: formatCurrencyAmount(proposal.investment, proposal.currency) })}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {proposal.projectId ? (
                    <Link href={`/studio/projects/${proposal.projectId}`} className="acct-button-secondary rounded-xl">
                      {t("Open workspace")}
                    </Link>
                  ) : null}
                  {proposal.validUntil ? (
                    <span className="text-xs text-[var(--acct-muted)]">{tf("Valid until {date}", { date: formatDate(proposal.validUntil) })}</span>
                  ) : null}
                </div>
              </div>
            ))}

            {data.supportThreads.length > 0 ? (
              <Link
                href={`/support/${data.supportThreads[0].id}`}
                className="flex items-start gap-3 rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4 transition hover:border-[var(--acct-gold)]/30"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--acct-blue-soft)] text-[var(--acct-blue)]">
                  <LifeBuoy size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--acct-ink)]">{t("Continue Studio communication")}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--acct-muted)]">
                    {data.supportThreads[0].subject}
                  </p>
                  <p className="mt-2 text-xs text-[var(--acct-muted)]">
                    {data.supportThreads[0].status.replaceAll("_", " ")} • {timeAgo(data.supportThreads[0].updatedAt)}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
                <p className="text-sm font-semibold text-[var(--acct-ink)]">{t("No open Studio support thread yet")}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">
                  {t("Once Studio opens a follow-up thread or you request help, that communication room will appear here.")}
                </p>
              </div>
            )}

            {data.proposals.length === 0 && data.supportThreads.length === 0 ? (
              <p className="text-sm leading-7 text-[var(--acct-muted)]">
                {t("No active proposal or Studio help thread is linked yet.")}
              </p>
            ) : null}
          </div>
        </section>
      </div>

      {data.projects.length > 0 ? (
        <section className="acct-card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="acct-kicker">{t("Awaiting your action")}</p>
              <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{t("The fastest moves to unblock Studio work")}</h3>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {data.projects.slice(0, 3).map((project) => (
              <Link
                key={`action-${project.id}`}
                href={`/studio/projects/${project.id}`}
                className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4 transition hover:border-[var(--acct-gold)]/30"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--acct-ink)]">
                  <CheckCircle2 size={15} className="text-[var(--acct-gold)]" />
                  {project.title}
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{project.nextAction}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
