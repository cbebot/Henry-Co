import { Building2, Landmark, ShieldCheck, User } from "lucide-react";
import { CopyButton } from "@/components/portal/copy-button";

export function BankDetails({
  bankName,
  accountName,
  accountNumber,
  amountLabel,
}: {
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  amountLabel: string;
}) {
  const rows = [
    { icon: Landmark, label: "Bank", value: bankName, copy: false },
    { icon: User, label: "Account name", value: accountName, copy: false },
    { icon: Building2, label: "Account number", value: accountNumber, copy: true },
  ];

  return (
    <div className="portal-card-elev p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border border-[var(--studio-line-strong)] bg-[rgba(217,168,109,0.1)] text-[#f0c89a]">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-[var(--studio-ink)]">
            Pay {amountLabel} into the verified HenryCo account
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-[var(--studio-ink-soft)]">
            Bank transfer is the active method for this invoice. Card payments are coming soon.
          </p>
        </div>
      </div>

      <div className="mt-5 divide-y divide-[var(--studio-line)] rounded-2xl border border-[var(--studio-line)] bg-[rgba(255,255,255,0.03)]">
        {rows.map(({ icon: Icon, label, value, copy }) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Icon className="h-4 w-4 flex-shrink-0 text-[var(--studio-ink-soft)]" />
              <div className="min-w-0">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                  {label}
                </div>
                <div className="mt-1 truncate text-[15px] font-semibold tracking-[-0.005em] text-[var(--studio-ink)]">
                  {value || "Pending — contact support"}
                </div>
              </div>
            </div>
            {copy && value ? <CopyButton value={value} label="Copy number" /> : null}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-[var(--studio-line)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-[12.5px] leading-5 text-[var(--studio-ink-soft)]">
        Use your invoice number as the transfer reference. After the transfer, attach your proof
        below — finance verifies within one business day.
      </div>
    </div>
  );
}
