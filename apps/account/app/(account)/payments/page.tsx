import Link from "next/link";
import { CreditCard, Plus } from "lucide-react";
import { getAccountCopy } from "@henryco/i18n/server";
import { requireAccountUser } from "@/lib/auth";
import { getPaymentMethods } from "@/lib/account-data";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";

type PaymentMethodRow = {
  id: string;
  label: string | null;
  type: string | null;
  last_four: string | null;
  bank_name: string | null;
  is_default: boolean | null;
};

export default async function PaymentsPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const accountCopy = getAccountCopy(locale);
  const methods = (await getPaymentMethods(user.id)) as PaymentMethodRow[];
  const copy =
    locale === "fr"
      ? {
          title: "Moyens de paiement",
          description: "Gérez vos options de paiement enregistrées pour un paiement rapide.",
          addMethod: "Ajouter un moyen",
          emptyTitle: "Aucun moyen de paiement",
          emptyDescription:
            "Ajoutez une carte bancaire, un compte bancaire ou un autre moyen de paiement pour un paiement rapide dans les services HenryCo.",
          addPaymentMethod: "Ajouter un moyen de paiement",
          savedMethod: "Moyen enregistré",
          walletKicker: "Portefeuille HenryCo",
          walletBody: "Votre portefeuille HenryCo est toujours disponible comme moyen de paiement.",
          manageWallet: "Gérer le portefeuille",
        }
      : {
          title: "Payment Methods",
          description: "Manage your saved payment options for quick checkout.",
          addMethod: "Add method",
          emptyTitle: "No payment methods",
          emptyDescription:
            "Add a debit card, bank account, or other payment method for quick checkout across all HenryCo services.",
          addPaymentMethod: "Add payment method",
          savedMethod: "Saved method",
          walletKicker: "HenryCo Wallet",
          walletBody: "Your HenryCo Wallet is always available as a payment option.",
          manageWallet: "Manage wallet",
        };

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title={copy.title}
        description={copy.description}
        icon={CreditCard}
        actions={
          <button className="acct-button-primary rounded-xl">
            <Plus size={16} /> {copy.addMethod}
          </button>
        }
      />

      {methods.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={copy.emptyTitle}
          description={copy.emptyDescription}
          action={
            <button className="acct-button-primary rounded-xl">
              <Plus size={16} /> {copy.addPaymentMethod}
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {methods.map((m) => (
            <div key={m.id as string} className="acct-card flex items-center gap-4 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--acct-gold-soft)]">
                <CreditCard size={20} className="text-[var(--acct-gold)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--acct-ink)]">{m.label || copy.savedMethod}</p>
                <p className="text-xs text-[var(--acct-muted)]">
                  {m.type === "card" ? `•••• ${m.last_four}` : m.bank_name || m.type}
                  {m.is_default && (
                    <span className="ml-2 acct-chip acct-chip-green text-[0.6rem]">{accountCopy.common.defaultBadge}</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Wallet info */}
      <div className="acct-card p-5">
        <p className="acct-kicker mb-2">{copy.walletKicker}</p>
        <p className="text-sm text-[var(--acct-muted)]">
          {copy.walletBody}
          <Link href="/wallet" className="ml-1 font-medium text-[var(--acct-gold)] hover:underline">
            {copy.manageWallet}
          </Link>
        </p>
      </div>
    </div>
  );
}
