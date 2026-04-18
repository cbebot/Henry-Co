import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  FolderOpen,
  LifeBuoy,
  MessageSquare,
  ReceiptText,
  Sparkles,
} from "lucide-react";
import { formatSurfaceTemplate, translateSurfaceLabel } from "@henryco/i18n/server";
import { requireAccountUser } from "@/lib/auth";
import { formatCurrencyAmount, formatDate, formatDateTime, timeAgo } from "@/lib/format";
import { getStudioProjectRoom } from "@/lib/studio-module";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";

function statusChip(status: string) {
  if (["paid", "approved", "delivered"].includes(status)) return "acct-chip acct-chip-green";
  if (["processing", "active", "in_review", "ready_for_review"].includes(status)) return "acct-chip acct-chip-blue";
  if (["pending_deposit", "requested", "overdue", "open", "in_progress"].includes(status)) return "acct-chip acct-chip-orange";
  return "acct-chip acct-chip-gold";
}

export default async function StudioProjectRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getAccountAppLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const tf = (template: string, values: Record<string, string | number>) =>
    formatSurfaceTemplate(template, values);
  const user = await requireAccountUser();
  const { id } = await params;
  const room = await getStudioProjectRoom(user.id, user.email, id);

  if (!room) {
    notFound();
  }

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title={room.project.title}
        description={t("A synced Studio room with milestones, updates, deliverables, revisions, proof state, and the cleanest next move.")}
        icon={Sparkles}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href="/studio" className="acct-button-secondary rounded-xl">
              <ArrowLeft size={14} /> {t("Back to Studio")}
            </Link>
            {room.supportThread ? (
              <Link href={`/support/${room.supportThread.id}`} className="acct-button-primary rounded-xl">
                {t("Open support room")}
              </Link>
            ) : null}
          </div>
        }
      />

      <section className="acct-card overflow-hidden">
        <div className="bg-[linear-gradient(135deg,#0F172A_0%,#7C2D12_42%,#C9A227_100%)] px-6 py-7 text-white sm:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/12 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/84">
                  {t(room.project.status.replaceAll("_", " "))}
                </span>
                <span className="rounded-full bg-white/12 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/84">
                  {tf("{percent}% complete", { percent: room.project.milestoneProgress })}
                </span>
              </div>
              <h2 className="mt-4 acct-display text-3xl leading-tight sm:text-4xl">
                {room.project.nextAction}
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/78">{room.project.summary}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-white/65">
                {tf("Updated {value}", { value: timeAgo(room.project.updatedAt) })}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: t("Milestones"),
                  value: `${room.project.approvedMilestones}/${room.project.totalMilestones || 0}`,
                  detail: tf("{count} ready for review", { count: room.project.readyMilestones }),
                },
                {
                  label: t("Open payments"),
                  value: String(room.project.openPayments),
                  detail: tf("{count} proof upload(s) found", { count: room.payments.filter((payment) => Boolean(payment.proofUrl)).length }),
                },
                {
                  label: t("Team updates"),
                  value: String(room.updates.length + room.messages.length),
                  detail: tf("{count} deliverable lane(s) visible", { count: room.deliverables.length }),
                },
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

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="acct-card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="acct-kicker">{t("Milestone rail")}</p>
              <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{t("Where the project is right now")}</h3>
            </div>
          </div>
          <div className="space-y-4">
            {room.project.milestones.map((milestone, index) => (
              <div key={milestone.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] text-sm font-semibold text-[var(--acct-ink)]">
                    {index + 1}
                  </div>
                  {index < room.project.milestones.length - 1 ? <div className="mt-2 h-full min-h-10 w-px bg-[var(--acct-line)]" /> : null}
                </div>
                <div className="flex-1 rounded-[1.45rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={statusChip(milestone.status)}>{t(milestone.status.replaceAll("_", " "))}</span>
                    <span className="acct-chip acct-chip-gold">{formatCurrencyAmount(milestone.amount)}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[var(--acct-ink)]">{milestone.name}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{milestone.description}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--acct-muted)]">{milestone.dueLabel}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="acct-card p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <ReceiptText size={15} className="text-[var(--acct-gold)]" />
              <div>
                <p className="acct-kicker">{t("Payment visibility")}</p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{t("Commercial checkpoints tied to this room")}</h3>
              </div>
            </div>
            <div className="space-y-3">
              {room.payments.map((payment) => (
                <Link
                  key={payment.id}
                  href={`/studio/payments/${payment.id}`}
                  className="block rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] px-4 py-4 transition hover:border-[var(--acct-gold)]/30"
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
                      {payment.dueDate ? tf("Due {date}", { date: formatDate(payment.dueDate) }) : formatDateTime(payment.updatedAt)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {room.proposal ? (
            <div className="acct-card p-5 sm:p-6">
              <p className="acct-kicker">{t("Commercial brief")}</p>
              
              <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{room.proposal.title}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={statusChip(room.proposal.status)}>{t(room.proposal.status.replaceAll("_", " "))}</span>
                <span className="acct-chip acct-chip-gold">
                  {tf("Total {amount}", { amount: formatCurrencyAmount(room.proposal.investment, room.proposal.currency) })}
                </span>
                <span className="acct-chip acct-chip-blue">
                  {tf("Deposit {amount}", { amount: formatCurrencyAmount(room.proposal.depositAmount, room.proposal.currency) })}
                </span>
              </div>
              {room.proposal.scopeBullets.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {room.proposal.scopeBullets.map((bullet) => (
                    <div key={bullet} className="rounded-2xl bg-[var(--acct-surface)] px-4 py-3 text-sm leading-6 text-[var(--acct-muted)]">
                      {bullet}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="acct-card p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-[var(--acct-gold)]" />
              <div>
                <p className="acct-kicker">{t("Project updates")}</p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{t("Studio-side movement and decisions")}</h3>
              </div>
            </div>
          {room.updates.length === 0 ? (
            <p className="text-sm leading-7 text-[var(--acct-muted)]">{t("Studio has not logged a visible update yet.")}</p>
          ) : (
            <div className="space-y-3">
              {room.updates.map((update) => (
                <div key={update.id} className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={statusChip(update.kind)}>{update.kind.replaceAll("_", " ")}</span>
                    <span className="text-xs text-[var(--acct-muted)]">{formatDateTime(update.createdAt)}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[var(--acct-ink)]">{update.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{update.summary}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="acct-card p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <MessageSquare size={15} className="text-[var(--acct-blue)]" />
              <div>
                <p className="acct-kicker">{t("Communication lane")}</p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{t("Project-room conversation and support continuity")}</h3>
              </div>
            </div>
          {room.messages.length === 0 ? (
            <div className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4">
              <p className="text-sm leading-7 text-[var(--acct-muted)]">
                {t("No direct project messages are visible yet. The room will still track project updates, payment checkpoints, and deliverables as they land.")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {room.messages.map((message) => (
                <div key={message.id} className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[var(--acct-ink)]">{message.sender}</p>
                      <p className="text-xs uppercase tracking-[0.14em] text-[var(--acct-muted)]">{message.senderRole}</p>
                    </div>
                    <span className="text-xs text-[var(--acct-muted)]">{formatDateTime(message.createdAt)}</span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--acct-muted)]">{message.body}</p>
                </div>
              ))}
            </div>
          )}

          {room.supportThread ? (
            <Link
              href={`/support/${room.supportThread.id}`}
              className="mt-4 flex items-start gap-3 rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4 transition hover:border-[var(--acct-gold)]/30"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--acct-blue-soft)] text-[var(--acct-blue)]">
                <LifeBuoy size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--acct-ink)]">{t("Continue in the support room")}</p>
                <p className="mt-1 text-sm leading-6 text-[var(--acct-muted)]">{room.supportThread.subject}</p>
                <p className="mt-2 text-xs text-[var(--acct-muted)]">
                  {room.supportThread.status.replaceAll("_", " ")} • {timeAgo(room.supportThread.updatedAt)}
                </p>
              </div>
            </Link>
          ) : null}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="acct-card p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <FolderOpen size={15} className="text-[var(--acct-gold)]" />
              <div>
                <p className="acct-kicker">{t("Deliverables and files")}</p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{t("Shared outputs and asset handoff")}</h3>
              </div>
            </div>
          {room.deliverables.length === 0 && room.files.length === 0 ? (
            <p className="text-sm leading-7 text-[var(--acct-muted)]">{t("No deliverables or files have been shared yet.")}</p>
          ) : (
            <div className="space-y-4">
              {room.deliverables.map((deliverable) => (
                <div key={deliverable.id} className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={statusChip(deliverable.status)}>{deliverable.status.replaceAll("_", " ")}</span>
                    <span className="text-xs text-[var(--acct-muted)]">{formatDateTime(deliverable.createdAt)}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[var(--acct-ink)]">{deliverable.label}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{deliverable.summary}</p>
                  {deliverable.files.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {deliverable.files.map((file) =>
                        file.url ? (
                          <a
                            key={file.id}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full bg-[var(--acct-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--acct-ink)]"
                          >
                            {file.label}
                          </a>
                        ) : null
                      )}
                    </div>
                  ) : null}
                </div>
              ))}

              {room.files.length > 0 ? (
                <div className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
                  <p className="text-sm font-semibold text-[var(--acct-ink)]">{t("Project files")}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {room.files.map((file) =>
                      file.url ? (
                        <a
                          key={file.id}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full bg-[var(--acct-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--acct-ink)]"
                        >
                          {file.label}
                        </a>
                      ) : null
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section className="acct-card p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <ReceiptText size={15} className="text-[var(--acct-blue)]" />
              <div>
                <p className="acct-kicker">{t("Revision lane")}</p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{t("Requested changes and review pressure")}</h3>
              </div>
            </div>
          {room.revisions.length === 0 ? (
            <p className="text-sm leading-7 text-[var(--acct-muted)]">{t("No revisions are open right now.")}</p>
          ) : (
            <div className="space-y-3">
              {room.revisions.map((revision) => (
                <div key={revision.id} className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={statusChip(revision.status)}>{t(revision.status.replaceAll("_", " "))}</span>
                    <span className="acct-chip acct-chip-gold">{revision.requestedBy}</span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--acct-muted)]">{revision.summary}</p>
                  <p className="mt-2 text-xs text-[var(--acct-muted)]">
                    {tf("Opened {date}", { date: formatDateTime(revision.createdAt) })} • {tf("Updated {value}", { value: timeAgo(revision.updatedAt) })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
