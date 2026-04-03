import type { Metadata } from "next";
import type { ComponentType } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, ShieldCheck, Sparkles, Tags } from "lucide-react";
import PendingSubmitButton from "@/components/forms/PendingSubmitButton";
import { requireRoles } from "@/lib/auth/server";
import { logProtectedPageAccess } from "@/lib/security/logger";
import { getPricingGovernanceSnapshot } from "@/lib/pricing-governance";
import {
  savePricingProposalAction,
  submitPricingProposalAction,
} from "../../owner/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manager Pricing | Henry & Co. Fabric Care",
  description:
    "Manager proposal desk for price drafts, approval handoff, and live pricing visibility.",
};

const inputCls =
  "h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 outline-none shadow-sm transition focus:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white";

const textareaCls =
  "rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none shadow-sm transition focus:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white";

function currency(value: number) {
  return `₦${Number(value || 0).toLocaleString()}`;
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

export default async function ManagerPricingPage() {
  await requireRoles(["owner", "manager"]);
  await logProtectedPageAccess("/manager/pricing");

  const snapshot = await getPricingGovernanceSnapshot();
  const myQueue = snapshot.proposals.filter((proposal) =>
    ["draft", "submitted", "rejected"].includes(proposal.status)
  );

  return (
    <div className="space-y-8">
      <section className="rounded-[38px] border border-black/10 bg-white/80 p-8 shadow-[0_22px_80px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
          Manager pricing desk
        </div>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white sm:text-5xl">
          Draft pricing confidently, then hand final authority to the owner.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600 dark:text-white/65">
          Managers can model new prices, propose adjustments, and submit them for approval. Nothing goes live until an
          owner publishes it, so operational experimentation stays controlled and auditable.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/owner/pricing"
            className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
          >
            Open owner approval desk
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
        <MetricCard icon={Tags} label="Published items" value={String(snapshot.publishedPricing.length)} note="Current customer-visible pricing lines." />
        <MetricCard icon={Clock3} label="Submitted" value={String(snapshot.proposals.filter((item) => item.status === "submitted").length)} note="Awaiting owner approval." />
        <MetricCard icon={Sparkles} label="Drafts" value={String(snapshot.proposals.filter((item) => item.status === "draft").length)} note="Still being shaped before review." />
        <MetricCard icon={ShieldCheck} label="Authority boundary" value="Owner publish" note="Managers propose changes; owner approves the live outcome." />
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
            Proposal composer
          </div>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white">
            Draft a new price or adjustment
          </h2>
          <form action={savePricingProposalAction} className="mt-6 grid gap-4 rounded-[1.9rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-2 xl:grid-cols-4">
            <input type="hidden" name="source_route" value="/manager/pricing" />
            <input name="category" placeholder="Category" className={inputCls} required />
            <input name="item_name" placeholder="Item name" className={inputCls} required />
            <input name="unit" placeholder="Unit" className={inputCls} defaultValue="item" />
            <input name="price" type="number" step="0.01" placeholder="Proposed price" className={inputCls} required />
            <input name="description" placeholder="Customer-facing description" className={`${inputCls} md:col-span-2 xl:col-span-2`} />
            <input name="sort_order" type="number" defaultValue={100} placeholder="Sort order" className={inputCls} />
            <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-zinc-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/78">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" name="is_featured" className="accent-[color:var(--accent)]" />
                Featured
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" name="is_active" defaultChecked className="accent-[color:var(--accent)]" />
                Active when approved
              </label>
            </div>
            <textarea
              name="note"
              rows={3}
              placeholder="Explain why this change is needed, what changed operationally, or what the owner should evaluate before approving."
              className={`${textareaCls} md:col-span-2 xl:col-span-4`}
            />

            <div className="md:col-span-2 xl:col-span-4 flex flex-wrap gap-3">
              <button
                type="submit"
                name="proposal_intent"
                value="draft"
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-700 dark:text-cyan-100"
              >
                Save as draft
              </button>
              <PendingSubmitButton
                name="proposal_intent"
                value="submitted"
                label="Submit for owner approval"
                pendingLabel="Submitting proposal..."
                className="h-12 rounded-2xl px-6 text-sm font-semibold"
              />
            </div>
          </form>
        </section>

        <section className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
            Proposal queue
          </div>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white">
            Track every proposed change
          </h2>
          <div className="mt-6 grid gap-4">
            {myQueue.length > 0 ? (
              myQueue.map((proposal) => (
                <article
                  key={proposal.proposalId}
                  className="rounded-[1.8rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                        {proposal.payload.category}
                      </div>
                      <h3 className="mt-1 text-xl font-bold text-zinc-950 dark:text-white">
                        {proposal.payload.itemName}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/65">
                        {proposal.payload.description || "No description added yet."}
                      </p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${proposalTone(proposal.status)}`}>
                      {proposal.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <InfoTile label="Proposed price" value={currency(proposal.payload.price)} />
                    <InfoTile label="Unit" value={proposal.payload.unit} />
                    <InfoTile label="Updated" value={formatDateTime(proposal.updatedAt)} />
                    <InfoTile label="Owner note" value={proposal.decisionNote || "No owner note yet."} />
                  </div>

                  {proposal.status === "draft" ? (
                    <form action={submitPricingProposalAction} className="mt-5 flex flex-wrap gap-3">
                      <input type="hidden" name="proposal_id" value={proposal.proposalId} />
                      <input type="hidden" name="source_route" value="/manager/pricing" />
                      <PendingSubmitButton
                        label="Submit draft for approval"
                        pendingLabel="Submitting draft..."
                        className="h-12 rounded-2xl px-5 text-sm font-semibold"
                      />
                    </form>
                  ) : null}
                </article>
              ))
            ) : (
              <EmptyState text="No draft or pending pricing proposals are in your queue yet." />
            )}
          </div>
        </section>
      </section>

      <section className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
          Published reference
        </div>
        <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white">
          Current live pricing
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {snapshot.publishedPricing.map((item) => (
            <article
              key={item.id}
              className="rounded-[1.7rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                {item.category}
              </div>
              <div className="mt-1 text-xl font-bold text-zinc-950 dark:text-white">{item.item_name}</div>
              <div className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/65">
                {item.description || "No public description on this line."}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-black/10 bg-white px-3 py-1 font-semibold text-zinc-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70">
                  {currency(item.price)}
                </span>
                <span className="rounded-full border border-black/10 bg-white px-3 py-1 font-semibold text-zinc-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70">
                  {item.unit}
                </span>
                {item.is_featured ? (
                  <span className="rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 font-semibold text-amber-700 dark:text-amber-100">
                    Featured
                  </span>
                ) : null}
              </div>
            </article>
          ))}
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

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-zinc-950 dark:text-white">{value}</div>
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
