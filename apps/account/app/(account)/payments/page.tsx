import Link from "next/link";
import { CreditCard } from "lucide-react";
import { formatAccountTemplate, getAccountCopy } from "@henryco/i18n/server";
import {
  HeroCard,
  EmptyStateCard,
  DivisionLanding,
} from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { getPaymentMethods } from "@/lib/account-data";
import { getAccountAppLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

type PaymentMethodRow = {
  id: string;
  label: string | null;
  type: string | null;
  last_four: string | null;
  bank_name: string | null;
  is_default: boolean | null;
};

/**
 * Payments landing.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2D).
 *
 * Critical bug fixed: the previous page rendered an `<button>` "Add method"
 * CTA with no onClick handler. Wired through HeroCard's ctaPrimary to
 * `/wallet/funding` (the funding lane is the canonical add-money flow).
 *
 * Wallet remains documented as a payment option via a card-level CTA.
 */
export default async function PaymentsPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const accountCopy = getAccountCopy(locale);
  const copy = accountCopy.payments;
  const methods = (await getPaymentMethods(user.id)) as PaymentMethodRow[];

  return (
    <DivisionLanding
      className="acct-fade-in"
      hero={
        <HeroCard
          variant="compact"
          tone={methods.length === 0 ? "empty" : "calm"}
          eyebrow={copy.wallet.eyebrow}
          headline={copy.hero.title}
          blurb={copy.hero.description}
          // BUG FIX: was a no-op <button>; now routes to the canonical
          // add-funds / saved-method route under /wallet/funding.
          ctaPrimary={{ label: copy.hero.addMethodCta, href: "/wallet/funding" }}
        />
      }
      sections={[
        {
          id: "payments-methods",
          title: copy.hero.title,
          meta: `${methods.length}`,
          content:
            methods.length === 0 ? (
              <EmptyStateCard
                kicker={copy.wallet.eyebrow}
                title={copy.empty.title}
                body={copy.empty.description}
                cta={{ label: copy.empty.cta, href: "/wallet/funding" }}
              />
            ) : (
              <div className="space-y-3">
                {methods.map((m) => (
                  <div
                    key={m.id as string}
                    className="acct-card flex items-center gap-4 p-4"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--acct-gold-soft)]">
                      <CreditCard size={20} className="text-[var(--acct-gold)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--acct-ink)]">
                        {m.label || copy.card.savedMethodFallback}
                      </p>
                      <p className="text-xs text-[var(--acct-muted)]">
                        {m.type === "card"
                          ? formatAccountTemplate(copy.card.cardLastFourTemplate, {
                              last4: m.last_four ?? "",
                            })
                          : m.bank_name || m.type}
                        {m.is_default && (
                          <span className="ml-2 acct-chip acct-chip-green text-[0.6rem]">
                            {accountCopy.common.defaultBadge}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ),
        },
        {
          id: "payments-wallet",
          title: copy.wallet.eyebrow,
          meta: copy.wallet.body,
          content: (
            <div className="acct-card p-5">
              <p className="acct-kicker mb-2">{copy.wallet.eyebrow}</p>
              <p className="text-sm text-[var(--acct-muted)]">
                {copy.wallet.body}
                <Link
                  href="/wallet"
                  className="ml-1 font-medium text-[var(--acct-gold)] hover:underline"
                >
                  {copy.wallet.manageCta}
                </Link>
              </p>
            </div>
          ),
        },
      ]}
    />
  );
}
