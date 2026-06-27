import { Mail, ShieldCheck, Smartphone } from "lucide-react";
import { HenryCoHeroCard } from "@henryco/ui/public-shell";
import { getStudioMiscCopy } from "@henryco/i18n";
import { formatCurrency } from "@/lib/env";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { StudioCopyButton } from "@/components/studio/copy-button";

function supportWhatsappHref(value: string | null) {
  if (!value) return null;
  const digits = value.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

/**
 * StudioPaymentGuide — focused payment surface, mobile-first.
 *
 * Replaces the previous panel-on-panel composition (one outer studio-panel
 * containing a 3-column inner grid of nested panels) with a single
 * HenryCoHeroCard for context + 3 compact hairline sections beneath. No
 * oversized rounded panels, no nested chrome. Same data contract so existing
 * call sites (proposal page + project workspace ProjectPaymentsStack)
 * continue to work without changes.
 */
export async function StudioPaymentGuide({
  title,
  amount,
  currency,
  statusLabel,
  dueLabel,
  instructions,
  bankName,
  accountName,
  accountNumber,
  supportEmail,
  supportWhatsApp,
  proofHint,
}: {
  title: string;
  amount: number;
  currency: string;
  statusLabel: string;
  dueLabel: string;
  instructions: string;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  supportEmail: string | null;
  supportWhatsApp: string | null;
  proofHint: string;
}) {
  const locale = await getStudioPublicLocale();
  const copy = getStudioMiscCopy(locale);
  const whatsappHref = supportWhatsappHref(supportWhatsApp);
  const formattedAmount = formatCurrency(amount, currency);

  return (
    <section className="space-y-5">
      <HenryCoHeroCard
        tone="contrast"
        accentVar="var(--studio-signal, #97f4f3)"
        eyebrow={statusLabel}
        title={title}
        body={instructions}
        rows={[
          {
            key: "amount",
            label: copy.paymentGuide.amountDueLabel,
            value: formattedAmount,
          },
          {
            key: "due",
            label: copy.paymentGuide.dueLabel,
            value: dueLabel,
          },
        ]}
        footer={
          <div className="flex flex-wrap items-center gap-2">
            <span>{copy.paymentGuide.footerReference}</span>
            <StudioCopyButton value={String(Math.round(amount))} label={copy.paymentGuide.copyAmount} />
          </div>
        }
      />

      {/* Bank details — divided list, no nested cards. */}
      <div className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
          <ShieldCheck className="h-3.5 w-3.5" />
          {copy.paymentGuide.verifiedPayee}
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--studio-ink-soft)]">
          {copy.paymentGuide.transferIntro}
        </p>
        <dl className="mt-4 divide-y divide-[var(--studio-line)] border-y border-[var(--studio-line)]">
          {[
            { key: "bank", label: copy.paymentGuide.bankLabel, value: bankName, copyLabel: copy.paymentGuide.copyBank },
            { key: "account-name", label: copy.paymentGuide.accountNameLabel, value: accountName, copyLabel: copy.paymentGuide.copyName },
            { key: "account-number", label: copy.paymentGuide.accountNumberLabel, value: accountNumber, copyLabel: copy.paymentGuide.copyNumber },
          ].map((item) => (
            <div
              key={item.key}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)] sm:w-40 sm:shrink-0">
                {item.label}
              </dt>
              <dd className="flex min-w-0 flex-1 items-center justify-between gap-3 sm:justify-end">
                <span className="min-w-0 flex-1 truncate font-mono text-sm font-semibold text-[var(--studio-ink)] sm:flex-initial sm:text-right">
                  {item.value || copy.paymentGuide.awaitingFinance}
                </span>
                {item.value ? (
                  <StudioCopyButton value={item.value} label={item.copyLabel} />
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Step-by-step — single divided list with numbered prefixes, no
          nested cards, no oversized chrome. */}
      <div className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-5 sm:p-6">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
          {copy.paymentGuide.stepsHeading}
        </div>
        <ol className="mt-3 divide-y divide-[var(--studio-line)] border-y border-[var(--studio-line)]">
          {[
            copy.paymentGuide.step1,
            copy.paymentGuide.step2,
            copy.paymentGuide.step3,
            copy.paymentGuide.step4,
          ].map((step, index) => (
            <li key={step} className="flex items-start gap-3 py-3 text-sm leading-6 text-[var(--studio-ink-soft)]">
              <span
                aria-hidden
                className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--studio-line)] font-mono text-[11px] font-semibold text-[var(--studio-signal)]"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[12.5px] leading-6 text-[var(--studio-ink-soft)]">{proofHint}</p>
      </div>

      {/* Support — quiet two-line list with hairline rule. */}
      {supportEmail || (supportWhatsApp && whatsappHref) ? (
        <div className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-5 sm:p-6">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
            {copy.paymentGuide.needHelpHeading}
          </div>
          <ul className="mt-3 divide-y divide-[var(--studio-line)] border-y border-[var(--studio-line)]">
            {supportEmail ? (
              <li>
                <a
                  href={`mailto:${supportEmail}`}
                  className="flex items-center justify-between gap-3 py-3 text-sm font-medium text-[var(--studio-ink)] transition outline-none active:translate-y-[0.5px] focus-visible:ring-2 focus-visible:ring-[var(--studio-signal)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 [@media(hover:hover)]:hover:text-[var(--studio-signal)]"
                >
                  <span className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-[var(--studio-signal)]" />
                    <span className="min-w-0 break-all">{supportEmail}</span>
                  </span>
                  <span className="shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)]">
                    {copy.paymentGuide.emailTag}
                  </span>
                </a>
              </li>
            ) : null}
            {supportWhatsApp && whatsappHref ? (
              <li>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 py-3 text-sm font-medium text-[var(--studio-ink)] transition outline-none active:translate-y-[0.5px] focus-visible:ring-2 focus-visible:ring-[var(--studio-signal)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 [@media(hover:hover)]:hover:text-[var(--studio-signal)]"
                >
                  <span className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-[var(--studio-signal)]" />
                    <span className="min-w-0 break-all">{supportWhatsApp}</span>
                  </span>
                  <span className="shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)]">
                    {copy.paymentGuide.whatsappTag}
                  </span>
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
