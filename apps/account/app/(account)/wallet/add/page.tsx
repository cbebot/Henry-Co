import { Wallet, CreditCard, Building2, Smartphone } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getWalletSummary } from "@/lib/account-data";
import { formatNaira } from "@/lib/format";
import PageHeader from "@/components/layout/PageHeader";
import AddMoneyForm from "@/components/wallet/AddMoneyForm";

export const dynamic = "force-dynamic";

export default async function AddMoneyPage() {
  const user = await requireAccountUser();
  const wallet = await getWalletSummary(user.id);

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Add Money"
        description="Fund your HenryCo wallet"
        icon={Wallet}
      />

      <div className="acct-card p-5">
        <p className="text-sm text-[var(--acct-muted)]">Current balance</p>
        <p className="mt-1 text-2xl font-bold">{formatNaira(wallet.balance_kobo)}</p>
      </div>

      <AddMoneyForm />

      {/* Payment methods */}
      <section className="acct-card p-5">
        <p className="acct-kicker mb-4">Payment methods</p>
        <div className="space-y-3">
          {[
            { icon: CreditCard, label: "Debit / Credit Card", desc: "Visa, Mastercard, Verve" },
            { icon: Building2, label: "Bank Transfer", desc: "Direct transfer from your bank" },
            { icon: Smartphone, label: "USSD", desc: "Dial from any phone" },
          ].map((m) => (
            <div
              key={m.label}
              className="flex items-center gap-4 rounded-xl bg-[var(--acct-surface)] p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--acct-bg-elevated)]">
                <m.icon size={20} className="text-[var(--acct-gold)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--acct-ink)]">{m.label}</p>
                <p className="text-xs text-[var(--acct-muted)]">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
