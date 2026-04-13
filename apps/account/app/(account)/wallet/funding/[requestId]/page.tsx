import Link from "next/link";
import { ArrowLeft, Building2, Clock3, ShieldCheck, Wallet } from "lucide-react";
import { RouteLiveRefresh } from "@henryco/ui";
import { requireAccountUser } from "@/lib/auth";
import { getProfile, getWalletFundingRequestById } from "@/lib/account-data";
import { formatCurrencyAmount, formatDateTime } from "@/lib/format";
import { resolveAccountRegionalContext } from "@/lib/regional-context";
import PageHeader from "@/components/layout/PageHeader";
import FundingProofUpload from "@/components/wallet/FundingProofUpload";
import CopyValueButton from "@/components/ui/CopyValueButton";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ requestId: string }>;
};

function statusChip(status: string) {
  if (status === "completed" || status === "verified") {
    return "acct-chip acct-chip-green";
  }
  if (status === "rejected") {
    return "acct-chip acct-chip-red";
  }
  return "acct-chip acct-chip-orange";
}

export default async function WalletFundingRequestPage({ params }: Props) {
  const { requestId } = await params;
  const user = await requireAccountUser();
  const [request, profile] = await Promise.all([
    getWalletFundingRequestById(user.id, requestId),
    getProfile(user.id),
  ]);
  const region = resolveAccountRegionalContext({
    country: profile?.country as string | null | undefined,
    currency: profile?.currency as string | null | undefined,
    timezone: profile?.timezone as string | null | undefined,
    language: profile?.language as string | null | undefined,
  });

  if (!request) {
    return (
      <div className="acct-empty py-20">
        <p className="text-sm text-[var(--acct-muted)]">Funding request not found.</p>
        <Link href="/wallet/funding" className="acct-button-secondary mt-4 rounded-2xl">
          Back to funding
        </Link>
      </div>
    );
  }

  const settlementAmount = formatCurrencyAmount(request.amount_kobo, region.settlementCurrency, {
    unit: "kobo",
    locale: region.locale,
  });

  return (
    <div className="space-y-6 acct-fade-in">
      <RouteLiveRefresh />
      <PageHeader
        title="Funding Request"
        description="Transfer details, proof status, and review progress for this wallet funding request."
        icon={Wallet}
        actions={
          <Link href="/wallet/funding" className="acct-button-secondary rounded-2xl">
            <ArrowLeft size={16} /> Back
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_22rem]">
        <div className="space-y-6">
          <section className="acct-card overflow-hidden">
            <div className="bg-[linear-gradient(140deg,#102030_0%,#1D4C63_52%,#C9A227_100%)] px-6 py-7 text-white">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`${statusChip(request.status)} bg-white/14 text-white`}>
                  {request.status.replaceAll("_", " ")}
                </span>
                {request.proof_url ? (
                  <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                    Proof uploaded
                  </span>
                ) : null}
              </div>
              <p className="mt-4 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/72">
                Funding reference
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold">{request.reference || request.id}</h1>
                {(request.reference || request.id) ? (
                  <CopyValueButton value={String(request.reference || request.id)} label="Copy reference" />
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-7 text-white/75">
                {settlementAmount} created on {formatDateTime(request.created_at, { locale: region.locale, timezone: region.timezone })}.
              </p>
              <p className="mt-2 text-xs leading-6 text-white/72">
                Display {region.displayCurrency} · Settlement {region.settlementCurrency}. Funding requests do not convert balances before verification.
              </p>
            </div>

            <div className="grid gap-4 border-t border-[var(--acct-line)] p-5 sm:grid-cols-2">
              <div className="rounded-[1.4rem] bg-[var(--acct-surface)] p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="acct-kicker">Bank</p>
                  {request.bank_name ? <CopyValueButton value={request.bank_name} /> : null}
                </div>
                <p className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">{request.bank_name || "Pending"}</p>
              </div>
              <div className="rounded-[1.4rem] bg-[var(--acct-surface)] p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="acct-kicker">Account name</p>
                  {request.account_name ? <CopyValueButton value={request.account_name} /> : null}
                </div>
                <p className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">{request.account_name || "Pending"}</p>
              </div>
              <div className="rounded-[1.4rem] bg-[var(--acct-surface)] p-4 sm:col-span-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="acct-kicker">Account number</p>
                  {request.account_number ? <CopyValueButton value={request.account_number} /> : null}
                </div>
                <p className="mt-2 text-lg font-semibold tracking-[0.12em] text-[var(--acct-ink)]">
                  {request.account_number || "Pending"}
                </p>
              </div>
            </div>
          </section>

          <FundingProofUpload requestId={request.id} currentProofUrl={request.proof_url} />

          <section className="acct-card p-5 sm:p-6">
            <p className="acct-kicker">Funding steps</p>
            <div className="mt-4 space-y-3">
              {[
                {
                  icon: Building2,
                  label: "Transfer funds",
                  detail: request.proof_url
                    ? "We have a proof file tied to this transfer. Finance will confirm the payment against the bank reference."
                    : request.instructions || "Transfer funds using the account details shown above, then upload proof once the transfer is complete.",
                  complete: Boolean(request.proof_url),
                },
                {
                  icon: ShieldCheck,
                  label: "Upload proof",
                  detail: request.proof_url
                    ? "Proof is attached to this funding request."
                    : "Attach the receipt or transfer confirmation so the HenryCo team can confirm the payment.",
                  complete: Boolean(request.proof_url),
                },
                {
                  icon: Clock3,
                  label: "Payment review",
                  detail:
                    request.status === "completed" || request.status === "verified"
                      ? "The request has been confirmed and the balance can now move into available funds."
                      : "The HenryCo team still needs to confirm the transfer before the funds appear in available balance.",
                  complete: request.status === "completed" || request.status === "verified",
                },
              ].map((step) => (
                <div key={step.label} className="flex items-start gap-3 rounded-[1.4rem] bg-[var(--acct-surface)] p-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                      step.complete ? "bg-[var(--acct-green-soft)] text-[var(--acct-green)]" : "bg-[var(--acct-blue-soft)] text-[var(--acct-blue)]"
                    }`}
                  >
                    <step.icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{step.label}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--acct-muted)]">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="acct-card p-5">
            <p className="acct-kicker">Transfer note</p>
            <p className="mt-3 text-sm leading-6 text-[var(--acct-muted)]">
              {request.note || "No extra note was added for this request."}
            </p>
          </section>

          <section className="acct-card p-5">
            <p className="acct-kicker">Proof status</p>
            <p className="mt-3 text-sm font-semibold text-[var(--acct-ink)]">
              {request.proof_url ? "Proof uploaded" : "Awaiting proof"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">
              {request.proof_uploaded_at
                ? `Uploaded ${formatDateTime(request.proof_uploaded_at)}`
                : "Upload a receipt or PDF confirmation to keep the request moving."}
            </p>
            {request.proof_url ? (
              <a
                href={request.proof_url}
                target="_blank"
                rel="noreferrer"
                className="acct-button-secondary mt-4 rounded-2xl"
              >
                View proof
              </a>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
