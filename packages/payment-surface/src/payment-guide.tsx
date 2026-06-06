import { Mail, ShieldCheck, Smartphone } from "lucide-react";
import { COMPANY } from "@henryco/config";
import { cn } from "@henryco/ui/cn";
import { HenryCoHeroCard } from "@henryco/ui/public-shell";
import { PaymentCopyButton } from "./payment-copy-button";
import { formatPaymentAmount } from "./format";
import type { PaymentPlatformAccount, PaymentSurfaceCopy, PaymentSurfaceTheme } from "./types";

export interface PaymentGuideProps {
  title: string;
  amount: number;
  currency: string;
  statusLabel: string;
  dueLabel: string;
  instructions: string;
  proofHint: string;
  platform: PaymentPlatformAccount;
  copy?: PaymentSurfaceCopy;
  theme?: PaymentSurfaceTheme;
}

function whatsappHrefOf(value: string | null) {
  if (!value) return null;
  const digits = value.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

/**
 * PaymentGuide — bank details + step-by-step + support stack. Same data
 * contract as the V2-HERO-01 StudioPaymentGuide so it's a drop-in
 * replacement, but routed through the canonical hero primitive and
 * theme-agnostic via CSS variables.
 */
export function PaymentGuide({
  title,
  amount,
  currency,
  statusLabel,
  dueLabel,
  instructions,
  proofHint,
  platform,
  copy,
  theme,
}: PaymentGuideProps) {
  const formattedAmount = formatPaymentAmount(amount, currency);
  const whatsapp = whatsappHrefOf(platform.supportWhatsApp);
  const legalEntity = COMPANY.group.legalName;
  const panelClass = cn(
    "rounded-[1.4rem] border border-[color:var(--payment-line,rgba(255,255,255,0.18))] bg-black/10 p-5 sm:p-6",
    theme?.panelClassName,
  );
  const accentTextClass = "text-[color:var(--payment-accent,#97f4f3)]";
  const softClass = cn(
    "text-[color:var(--payment-soft,rgba(255,255,255,0.65))]",
    theme?.softTextClassName,
  );
  const inkClass = cn("text-[color:var(--payment-ink,white)]", theme?.inkTextClassName);

  return (
    <section className="space-y-5">
      <HenryCoHeroCard
        tone={theme?.heroTone ?? "contrast"}
        accentVar={theme?.accentVar ?? "var(--payment-accent, #97f4f3)"}
        eyebrow={statusLabel}
        title={copy?.guideTitle ?? title}
        body={instructions}
        rows={[
          { key: "amount", label: "Amount due", value: formattedAmount },
          { key: "due", label: "Due", value: dueLabel },
        ]}
        footer={
          <div className="flex flex-wrap items-center gap-2">
            <span>Reference this exact amount and your record name when you send proof of payment.</span>
            <PaymentCopyButton value={String(Math.round(amount))} label="Copy amount" />
          </div>
        }
      />

      <div className={panelClass}>
        <div
          className={cn(
            "flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em]",
            accentTextClass,
          )}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Verified company payee
        </div>
        <p className={cn("mt-2 max-w-2xl text-sm leading-6", softClass)}>
          Transfer only to the {legalEntity} company account shown below. Each detail has a copy button so nothing
          has to be retyped.
        </p>
        <dl className="mt-4 divide-y divide-[color:var(--payment-line,rgba(255,255,255,0.18))] border-y border-[color:var(--payment-line,rgba(255,255,255,0.18))]">
          {[
            { key: "bank", label: "Bank", value: platform.bankName, copyLabel: "Copy bank" },
            { key: "name", label: "Account name", value: platform.accountName, copyLabel: "Copy name" },
            { key: "number", label: "Account number", value: platform.accountNumber, copyLabel: "Copy number" },
          ].map((item) => (
            <div
              key={item.key}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <dt
                className={cn(
                  "text-[10.5px] font-semibold uppercase tracking-[0.22em] sm:w-40 sm:shrink-0",
                  softClass,
                )}
              >
                {item.label}
              </dt>
              <dd className="flex min-w-0 flex-1 items-center justify-between gap-3 sm:justify-end">
                <span className={cn("min-w-0 flex-1 truncate font-mono text-sm font-semibold sm:flex-initial sm:text-right", inkClass)}>
                  {item.value || "—"}
                </span>
                {item.value ? <PaymentCopyButton value={item.value} label={item.copyLabel} /> : null}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className={panelClass}>
        <div className={cn("text-[10.5px] font-semibold uppercase tracking-[0.22em]", accentTextClass)}>
          What happens, step by step
        </div>
        <ol className="mt-3 divide-y divide-[color:var(--payment-line,rgba(255,255,255,0.18))] border-y border-[color:var(--payment-line,rgba(255,255,255,0.18))]">
          {[
            "Copy the amount and account details from the section above.",
            "Transfer from your bank or company account using your record name as reference.",
            "Upload your receipt or proof below — finance reviews and confirms within one business day.",
            "Once confirmed, your record advances and you receive an update by email.",
          ].map((step, index) => (
            <li
              key={step}
              className={cn("flex items-start gap-3 py-3 text-sm leading-6", softClass)}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-semibold",
                  "border-[color:var(--payment-line,rgba(255,255,255,0.18))]",
                  accentTextClass,
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">{step}</span>
            </li>
          ))}
        </ol>
        <p className={cn("mt-3 text-[12.5px] leading-6", softClass)}>{proofHint}</p>
      </div>

      {platform.supportEmail || (platform.supportWhatsApp && whatsapp) ? (
        <div className={panelClass}>
          <div className={cn("text-[10.5px] font-semibold uppercase tracking-[0.22em]", accentTextClass)}>
            Need help before or after payment
          </div>
          <ul className="mt-3 divide-y divide-[color:var(--payment-line,rgba(255,255,255,0.18))] border-y border-[color:var(--payment-line,rgba(255,255,255,0.18))]">
            {platform.supportEmail ? (
              <li>
                <a
                  href={`mailto:${platform.supportEmail}`}
                  className={cn(
                    "flex items-center justify-between gap-3 py-3 text-sm font-medium transition outline-none active:translate-y-[0.5px]",
                    "focus-visible:ring-2 focus-visible:ring-[color:var(--payment-accent,#97f4f3)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40",
                    "[@media(hover:hover)]:hover:text-[color:var(--payment-accent,#97f4f3)]",
                    inkClass,
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Mail className={cn("h-4 w-4", accentTextClass)} />
                    <span className="min-w-0 break-all">{platform.supportEmail}</span>
                  </span>
                  <span className={cn("shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.22em]", softClass)}>
                    Email
                  </span>
                </a>
              </li>
            ) : null}
            {platform.supportWhatsApp && whatsapp ? (
              <li>
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "flex items-center justify-between gap-3 py-3 text-sm font-medium transition outline-none active:translate-y-[0.5px]",
                    "focus-visible:ring-2 focus-visible:ring-[color:var(--payment-accent,#97f4f3)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40",
                    "[@media(hover:hover)]:hover:text-[color:var(--payment-accent,#97f4f3)]",
                    inkClass,
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Smartphone className={cn("h-4 w-4", accentTextClass)} />
                    <span className="min-w-0 break-all">{platform.supportWhatsApp}</span>
                  </span>
                  <span className={cn("shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.22em]", softClass)}>
                    WhatsApp
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
