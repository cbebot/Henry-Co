import Link from "next/link";
import { CreditCard } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getPaymentMethods } from "@/lib/account-data";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";
export default async function PaymentsPage() {
  const user = await requireAccountUser();
  const methods = await getPaymentMethods(user.id);
  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader title="Payment Methods" description="Saved methods that divisions have already published into the shared account ledger." icon={CreditCard} actions={<span className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-surface)] px-3 py-2 text-xs font-medium text-[var(--acct-muted)]">Self-serve add is not exposed here yet</span>} />
      {methods.length === 0 ? (
        <EmptyState icon={CreditCard} title="No saved payment methods" description="A saved method appears here only after a division stores it in the shared ledger. Wallet top-up is the current account-hub self-serve option." action={<Link href="/wallet" className="acct-button-primary rounded-xl">Open wallet</Link>} />
      ) : (
        <div className="space-y-3">
          {methods.map((method: Record<string, string | boolean>) => (
            <div key={method.id as string} className="acct-card flex items-center gap-4 p-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--acct-gold-soft)]"><CreditCard size={20} className="text-[var(--acct-gold)]" /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--acct-ink)]">{method.label}</p><p className="text-xs text-[var(--acct-muted)]">{method.type === "card" ? `•••• ${method.last_four}` : method.bank_name || method.type}{method.is_default ? <span className="ml-2 acct-chip acct-chip-green text-[0.6rem]">Default</span> : null}</p></div></div>
          ))}
        </div>
      )}
      <div className="acct-card p-5"><p className="acct-kicker mb-2">HenryCo Wallet</p><p className="text-sm text-[var(--acct-muted)]">Your HenryCo Wallet is always available as a payment option.<Link href="/wallet" className="ml-1 font-medium text-[var(--acct-gold)] hover:underline">Manage wallet</Link></p></div>
    </div>
  );
}
