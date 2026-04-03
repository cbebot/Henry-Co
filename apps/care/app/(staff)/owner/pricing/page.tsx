import type { ComponentType } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, ShieldCheck, Sparkles, Tags, XCircle } from "lucide-react";
import ConfirmButton from "@/components/feedback/ConfirmButton";
import PendingSubmitButton from "@/components/forms/PendingSubmitButton";
import {
  deletePricingAction,
  reviewPricingProposalAction,
  savePricingAction,
} from "../actions";
import { requireRoles } from "@/lib/auth/server";
import { logProtectedPageAccess } from "@/lib/security/logger";
import { getPricingGovernanceSnapshot } from "@/lib/pricing-governance";

const inputCls =
  "h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 outline-none shadow-sm transition focus:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white";

const textareaCls =
  "rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none shadow-sm transition focus:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white";

function currency(value: number) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

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

function proposalTone(status: string) {
  if (status === "approved") {
    return "border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100";
  }
  if (status === "rejected" || status === "superseded") {
    return "border-red-300/30 bg-red-500/10 text-red-700 dark:text-red-100";
  }
  if (status === "submitted") {
    return "border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-100";
  }

  return "border-cyan-300/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-100";
}

export default async function OwnerPricingPage() {
  await requireRoles(["owner"]);
  await logProtectedPageAccess("/owner/pricing");

  const snapshot = await getPricingGovernanceSnapshot();
  const pendingProposals = snapshot.proposals.filter((proposal) => proposal.status === "submitted");
  const draftProposals = snapshot.proposals.filter((proposal) => proposal.status === "draft");

  return (
    <div className="space-y-8">
      <section className="rounded-[38px] border border-black/10 bg-white/80 p-8 shadow-[0_22px_80px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
          Pricing authority
        </div>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white sm:text-5xl">
          Publish live prices only after owner review.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600 dark:text-white/65">
          Managers can now draft and submit price changes without publishing them. This owner desk keeps the live
          pricing table authoritative while exposing proposal history, approval context, and clean override control.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/manager/pricing"
            className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
          >
            Open manager proposal desk
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-secondary)] px-5 py-3 text-sm font-semibold text-[#07111F]"
          >
            Review public pricing
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Tags} label="Published items" value={String(snapshot.publishedPricing.length)} note="Authoritative rows live on the public pricing page." />
        <MetricCard icon={Clock3} label="Pending approval" value={String(pendingProposals.length)} note="Manager proposals waiting on an owner decision." />
        <MetricCard icon={Sparkles} label="Draft proposals" value={String(draftProposals.length)} note="Changes still being refined before submission." />
        <MetricCard icon={ShieldCheck} label="Governed publishing" value="Owner" note="Managers can propose. Owner alone publishes final authority." />
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
            Approval inbox
          </div>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white">
            Proposed price changes waiting on a decision
          </h2>
          <div className="mt-6 grid gap-4">
            {pendingProposals.length > 0 ? (
              pendingProposals.map((proposal) => (
                <article
                  key={proposal.proposalId}
                  className="rounded-[1.9rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                        {proposal.payload.category}
                      </div>
                      <h3 className="mt-1 text-xl font-bold text-zinc-950 dark:text-white">
                        {proposal.payload.itemName}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/64">
                        {proposal.payload.description || "No manager note was added to this pricing line yet."}
                      </p>
                    </div>

                    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${proposalTone(proposal.status)}`}>
                      {proposal.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <InfoTile label="Proposed price" value={currency(proposal.payload.price)} />
                    <InfoTile label="Unit" value={proposal.payload.unit} />
                    <InfoTile label="Requested by" value={proposal.createdByName} note={proposal.createdByRole || "manager"} />
                    <InfoTile label="Submitted" value={formatDateTime(proposal.submittedAt || proposal.updatedAt)} />
                    <InfoTile label="Featured" value={proposal.payload.isFeatured ? "Yes" : "No"} />
                    <InfoTile label="Public state" value={proposal.payload.isActive ? "Active" : "Hidden"} />
                  </div>

                  <form action={reviewPricingProposalAction} className="mt-5 grid gap-4">
                    <input type="hidden" name="proposal_id" value={proposal.proposalId} />
                    <input type="hidden" name="source_route" value="/owner/pricing" />
                    <textarea
                      name="decision_note"
                      rows={3}
                      className={textareaCls}
                      placeholder="Optional owner decision note for operations and audit history."
                    />

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        name="decision"
                        value="approved"
                        className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-100"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve and publish
                      </button>
                      <button
                        type="submit"
                        name="decision"
                        value="rejected"
                        className="inline-flex items-center gap-2 rounded-2xl border border-red-300/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-700 dark:text-red-100"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                      <button
                        type="submit"
                        name="decision"
                        value="superseded"
                        className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-700 dark:text-cyan-100"
                      >
                        <Sparkles className="h-4 w-4" />
                        Mark superseded
                      </button>
                    </div>
                  </form>
                </article>
              ))
            ) : (
              <EmptyState text="No manager proposals are waiting right now. New submissions will land here with full audit context before anything goes live." />
            )}
          </div>
        </section>

        <section className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
            Direct owner override
          </div>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white">
            Authoritative live pricing
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-white/64">
            Use this form only when the owner needs to create, correct, or override the price that customers see immediately.
          </p>

          <form action={savePricingAction} className="mt-6 grid gap-4 rounded-[1.9rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-2 xl:grid-cols-4">
            <input type="hidden" name="source_route" value="/owner/pricing" />
            <input name="category" placeholder="Category" className={inputCls} required />
            <input name="item_name" placeholder="Item name" className={inputCls} required />
            <input name="unit" placeholder="Unit" className={inputCls} defaultValue="item" />
            <input name="price" type="number" step="0.01" placeholder="Price" className={inputCls} required />
            <input name="description" placeholder="Customer-facing description" className={`${inputCls} md:col-span-2 xl:col-span-2`} />
            <input name="sort_order" type="number" defaultValue={100} placeholder="Sort order" className={inputCls} />
            <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-zinc-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/78">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" name="is_featured" className="accent-[color:var(--accent)]" />
                Featured
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" name="is_active" defaultChecked className="accent-[color:var(--accent)]" />
                Active
              </label>
            </div>

            <div className="md:col-span-2 xl:col-span-4">
              <PendingSubmitButton
                label="Publish pricing item"
                pendingLabel="Publishing pricing item..."
                className="h-12 rounded-2xl px-6 text-sm font-semibold"
              />
            </div>
          </form>

          <div className="mt-6 grid gap-4">
            {snapshot.publishedPricing.map((item) => (
              <article
                key={item.id}
                className="rounded-[1.9rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <form action={savePricingAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="source_route" value="/owner/pricing" />

                  <input name="category" defaultValue={item.category} className={inputCls} required />
                  <input name="item_name" defaultValue={item.item_name} className={inputCls} required />
                  <input name="unit" defaultValue={item.unit} className={inputCls} />
                  <input name="price" type="number" step="0.01" defaultValue={item.price} className={inputCls} required />
                  <input name="description" defaultValue={item.description ?? ""} className={`${inputCls} md:col-span-2 xl:col-span-2`} />
                  <input name="sort_order" type="number" defaultValue={item.sort_order} className={inputCls} />
                  <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-zinc-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/78">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" name="is_featured" defaultChecked={item.is_featured} className="accent-[color:var(--accent)]" />
                      Featured
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" name="is_active" defaultChecked={item.is_active} className="accent-[color:var(--accent)]" />
                      Active
                    </label>
                  </div>

                  <div className="md:col-span-2 xl:col-span-4 flex flex-wrap gap-3">
                    <PendingSubmitButton
                      label="Save live changes"
                      pendingLabel="Saving live pricing..."
                      className="h-12 rounded-2xl px-5 text-sm font-semibold"
                    />
                  </div>
                </form>

                <form action={deletePricingAction} className="mt-3">
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="source_route" value="/owner/pricing" />
                  <ConfirmButton
                    type="submit"
                    confirmTitle="Delete this live pricing item?"
                    confirmDescription="This removes the customer-visible pricing row immediately."
                    pendingLabel="Deleting pricing..."
                    className="rounded-2xl border border-red-300/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-700 dark:text-red-100"
                  >
                    Delete live pricing
                  </ConfirmButton>
                </form>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
          Pricing audit history
        </div>
        <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white">
          Proposal and decision trail
        </h2>
        <div className="mt-6 grid gap-4">
          {snapshot.history.length > 0 ? (
            snapshot.history.slice(0, 24).map((event) => (
              <article
                key={event.id}
                className="rounded-[1.7rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${proposalTone(event.eventType.replace("pricing_proposal_", ""))}`}>
                    {event.eventType.replaceAll("_", " ")}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                    {formatDateTime(event.createdAt)}
                  </span>
                </div>
                <div className="mt-3 text-sm font-semibold text-zinc-950 dark:text-white">
                  {event.payload ? `${event.payload.category} • ${event.payload.itemName}` : "Pricing proposal"}
                </div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-white/65">
                  {event.actorName || "System"} {event.actorRole ? `• ${event.actorRole}` : ""}
                </div>
                {event.note ? (
                  <div className="mt-3 rounded-2xl border border-black/10 bg-white/75 px-4 py-3 text-sm leading-7 text-zinc-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70">
                    {event.note}
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <EmptyState text="Pricing proposal history will appear here once managers start drafting changes or the owner records a decision." />
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04]">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
        <Icon className="h-6 w-6 text-[color:var(--accent)]" />
      </div>
      <div className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
        {label}
      </div>
      <div className="mt-2 text-4xl font-black text-zinc-950 dark:text-white">{value}</div>
      <div className="mt-2 text-sm text-zinc-600 dark:text-white/60">{note}</div>
    </article>
  );
}

function InfoTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-zinc-950 dark:text-white">{value}</div>
      {note ? <div className="mt-1 text-xs leading-6 text-zinc-500 dark:text-white/50">{note}</div> : null}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[1.8rem] border border-black/10 bg-black/[0.03] px-5 py-8 text-sm leading-7 text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/62">
      {text}
    </div>
  );
}
