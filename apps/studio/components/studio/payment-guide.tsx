import { ArrowRight, Mail, ShieldCheck, Smartphone } from "lucide-react";
import { formatCurrency } from "@/lib/env";
import { StudioCopyButton } from "@/components/studio/copy-button";

function supportWhatsappHref(value: string | null) {
  if (!value) return null;
  const digits = value.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

export function StudioPaymentGuide({
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
  const whatsappHref = supportWhatsappHref(supportWhatsApp);

  return (
    <section className="studio-panel rounded-[1.9rem] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="studio-kicker">Payment guidance</div>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--studio-ink)]">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{instructions}</p>
        </div>

        <div className="rounded-[1.6rem] border border-[var(--studio-line)] bg-black/10 p-5 text-right">
          <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
            Amount due
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)]">
            {formatCurrency(amount, currency)}
          </div>
          <div className="mt-2 text-sm text-[var(--studio-ink-soft)]">
            {statusLabel} · {dueLabel}
          </div>
          <div className="mt-4 flex justify-end">
            <StudioCopyButton value={String(Math.round(amount))} label="Copy amount" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Bank", value: bankName, copyLabel: "Copy bank" },
              { label: "Account name", value: accountName, copyLabel: "Copy name" },
              { label: "Account number", value: accountNumber, copyLabel: "Copy number" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-4"
              >
                <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                  {item.label}
                </div>
                <div className="mt-3 break-words text-sm font-semibold text-[var(--studio-ink)]">
                  {item.value || "Awaiting finance configuration"}
                </div>
                {item.value ? (
                  <div className="mt-4">
                    <StudioCopyButton value={item.value} label={item.copyLabel} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
              Proof and confirmation
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{proofHint}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
              What happens next
            </div>
            <div className="mt-4 space-y-4">
              {[
                "Copy the amount and account details exactly as shown.",
                "Make the transfer from your bank or company account.",
                "Upload proof in the payment lane so finance can verify the transfer.",
                "HenryCo confirms the payment, updates the workspace, and messages you with the next milestone.",
              ].map((step, index) => (
                <div key={step} className="flex gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--studio-line)] text-xs font-semibold text-[var(--studio-signal)]">
                    {index + 1}
                  </div>
                  <div className="text-sm leading-7 text-[var(--studio-ink-soft)]">{step}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
            <div className="flex items-center gap-3 text-[var(--studio-ink)]">
              <ShieldCheck className="h-4 w-4 text-[var(--studio-signal)]" />
              <div className="text-sm font-semibold">Need help before or after payment?</div>
            </div>
            <div className="mt-4 space-y-3">
              {supportEmail ? (
                <a
                  href={`mailto:${supportEmail}`}
                  className="flex items-center justify-between gap-3 rounded-[1.1rem] border border-[var(--studio-line)] px-4 py-3 text-sm text-[var(--studio-ink-soft)] transition hover:border-[rgba(151,244,243,0.24)]"
                >
                  <span className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-[var(--studio-signal)]" />
                    {supportEmail}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              ) : null}
              {supportWhatsApp && whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-[1.1rem] border border-[var(--studio-line)] px-4 py-3 text-sm text-[var(--studio-ink-soft)] transition hover:border-[rgba(151,244,243,0.24)]"
                >
                  <span className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-[var(--studio-signal)]" />
                    {supportWhatsApp}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
