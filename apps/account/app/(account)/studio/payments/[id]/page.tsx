import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Landmark,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { formatCurrencyAmount, formatDate, formatDateTime } from "@/lib/format";
import { getStudioPaymentRoom } from "@/lib/studio-module";
import PageHeader from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";

function statusChip(status: string) {
  if (["paid", "approved"].includes(status)) return "acct-chip acct-chip-green";
  if (["processing", "in_review"].includes(status)) return "acct-chip acct-chip-blue";
  if (["requested", "pending_deposit", "overdue"].includes(status)) return "acct-chip acct-chip-orange";
  return "acct-chip acct-chip-gold";
}

export default async function StudioPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAccountUser();
  const { id } = await params;
  const room = await getStudioPaymentRoom(user.id, user.email, id);

  if (!room) {
    notFound();
  }

  const payment = room.payment;
  const bank = room.paymentRail;

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title={payment.label}
        description="Studio payment status, proof visibility, and the exact HenryCo transfer details linked to this milestone."
        icon={ReceiptText}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href="/studio" className="acct-button-secondary rounded-xl">
              <ArrowLeft size={14} /> Back to Studio
            </Link>
            {room.project ? (
              <Link href={`/studio/projects/${room.project.id}`} className="acct-button-primary rounded-xl">
                Open project room
              </Link>
            ) : null}
          </div>
        }
      />

      <section className="acct-card overflow-hidden">
        <div className="bg-[linear-gradient(135deg,#0F172A_0%,#0E7490_48%,#C9A227_100%)] px-6 py-7 text-white sm:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/12 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/84">
                  {payment.status.replaceAll("_", " ")}
                </span>
                <span className="rounded-full bg-white/12 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/84">
                  {payment.method.replaceAll("_", " ")}
                </span>
                {payment.proofUrl ? (
                  <span className="rounded-full bg-white/12 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/84">
                    Proof uploaded
                  </span>
                ) : null}
              </div>
              <h2 className="mt-4 acct-display text-3xl leading-tight sm:text-4xl">
                {formatCurrencyAmount(payment.amount, payment.currency)}
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/78">
                This payment checkpoint stays tied to your Studio project, so payment status, proof visibility, and the next delivery step remain aligned.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Due date",
                  value: payment.dueDate ? formatDate(payment.dueDate) : "Open",
                  detail: "Studio uses this date to plan the next milestone.",
                },
                {
                  label: "Proof state",
                  value: payment.proofUrl ? "Submitted" : "Awaiting",
                  detail: payment.proofUrl ? "The team can review the uploaded transfer proof." : "Upload happens in the active payment lane.",
                },
                {
                  label: "Updated",
                  value: formatDateTime(payment.updatedAt),
                  detail: "Latest payment update.",
                },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/70">{item.label}</div>
                  <div className="mt-3 text-lg font-semibold">{item.value}</div>
                  <p className="mt-2 text-sm leading-6 text-white/72">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-6">
          <div className="acct-card p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <Landmark size={15} className="text-[var(--acct-gold)]" />
              <div>
                <p className="acct-kicker">Bank transfer lane</p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">Use the exact company account details below</h3>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Bank", bank.bankName || "HenryCo account"],
                ["Account name", bank.accountName || "HenryCo"],
                ["Account number", bank.accountNumber || "Provided after confirmation"],
                ["Currency", bank.currency || "NGN"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4">
                  <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">{label}</div>
                  <div className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--acct-ink)]">
                <ShieldCheck size={15} className="text-[var(--acct-blue)]" />
                Transfer instructions
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--acct-muted)]">
                {bank.instructions || "Transfer the exact amount for this milestone, then keep the proof in this payment lane so the team can confirm it without restarting the conversation."}
              </p>
            </div>
          </div>

          <div className="acct-card p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-[var(--acct-gold)]" />
              <div>
                <p className="acct-kicker">Proof visibility</p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">What HenryCo can already see</h3>
              </div>
            </div>

            {payment.proofUrl ? (
              <div className="space-y-4">
                <div className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={statusChip(payment.status)}>{payment.status.replaceAll("_", " ")}</span>
                    <span className="acct-chip acct-chip-gold">Proof uploaded</span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--acct-muted)]">
                    Finance already has a proof artifact linked to this payment checkpoint.
                  </p>
                  <a
                    href={payment.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="acct-button-secondary mt-4 rounded-xl"
                  >
                    Open uploaded proof
                  </a>
                </div>
                <p className="text-xs text-[var(--acct-muted)]">
                  {payment.proofName ? `Latest proof: ${payment.proofName}` : "The synced proof file is attached to the live Studio record."}
                </p>
              </div>
            ) : (
              <div className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--acct-ink)]">
                  <Clock3 size={15} className="text-[var(--acct-orange)]" />
                  Proof still waiting
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--acct-muted)]">
                  This payment lane does not show an uploaded proof yet. If you already transferred, continue in the Studio project room or linked support room so the team can confirm the deposit cleanly.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="acct-card p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <ReceiptText size={15} className="text-[var(--acct-blue)]" />
              <div>
                <p className="acct-kicker">Payment state</p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">How this checkpoint affects delivery</h3>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4">
                <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Checkpoint</div>
                <div className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">{payment.label}</div>
              </div>
              <div className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4">
                <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Status</div>
                <div className="mt-2">
                  <span className={statusChip(payment.status)}>{payment.status.replaceAll("_", " ")}</span>
                </div>
              </div>
              <div className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4">
                <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Amount</div>
                <div className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">
                  {formatCurrencyAmount(payment.amount, payment.currency)}
                </div>
              </div>
              <div className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4">
                <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Updated</div>
                <div className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">{formatDateTime(payment.updatedAt)}</div>
              </div>
            </div>
          </div>

          {room.project ? (
            <div className="acct-card p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <Sparkles size={15} className="text-[var(--acct-gold)]" />
                <div>
                  <p className="acct-kicker">Linked project room</p>
                  <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">Where this payment lands</h3>
                </div>
              </div>
              <div className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4">
                <p className="text-sm font-semibold text-[var(--acct-ink)]">{room.project.title}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--acct-muted)]">{room.project.nextAction}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={statusChip(room.project.status)}>{room.project.status.replaceAll("_", " ")}</span>
                  <span className="acct-chip acct-chip-gold">{room.project.milestoneProgress}% complete</span>
                </div>
                <Link href={`/studio/projects/${room.project.id}`} className="acct-button-secondary mt-4 rounded-xl">
                  Open project workspace
                </Link>
              </div>
            </div>
          ) : null}

          {room.proposal ? (
            <div className="acct-card p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <ShieldCheck size={15} className="text-[var(--acct-blue)]" />
                <div>
                  <p className="acct-kicker">Commercial source</p>
                  <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">Proposal reference</h3>
                </div>
              </div>
              <div className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4">
                <p className="text-sm font-semibold text-[var(--acct-ink)]">{room.proposal.title}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--acct-muted)]">
                  Original deposit checkpoint: {formatCurrencyAmount(room.proposal.depositAmount, room.proposal.currency)}
                </p>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
