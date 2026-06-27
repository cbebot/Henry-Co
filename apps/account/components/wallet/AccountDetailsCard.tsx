import { Building2 } from "lucide-react";
import CopyValueButton from "@/components/ui/CopyValueButton";
import { getAccountWalletExtraCopy } from "@henryco/i18n";
import { getAccountAppLocale } from "@/lib/locale-server";

type Rail = {
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
};

type Props = {
  rail: Rail;
  copyLabel?: string;
  copiedLabel?: string;
};

export async function AccountDetailsCard({
  rail,
  copyLabel,
  copiedLabel,
}: Props) {
  const locale = await getAccountAppLocale();
  const copy = getAccountWalletExtraCopy(locale).accountDetails;
  const resolvedCopyLabel = copyLabel ?? copy.copy;
  const resolvedCopiedLabel = copiedLabel ?? copy.copied;
  const rows: Array<{ label: string; value: string | null | undefined; mono?: boolean }> = [
    { label: copy.bankLabel, value: rail.bankName },
    { label: copy.accountNameLabel, value: rail.accountName },
    { label: copy.accountNumberLabel, value: rail.accountNumber, mono: true },
  ];
  return (
    <div className="acct-wal__rail" aria-label={copy.ariaLabel}>
      <div className="acct-wal__rail-head">
        <span className="acct-wal__rail-icon" aria-hidden>
          <Building2 size={18} />
        </span>
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--acct-muted)",
              margin: 0,
            }}
          >
            {copy.kicker}
          </p>
          <h3 className="acct-wal__rail-title">{copy.title}</h3>
        </div>
      </div>
      {rows.map((row) => (
        <div className="acct-wal__rail-row" key={row.label}>
          <div style={{ minWidth: 0 }}>
            <p className="acct-wal__rail-row-label">{row.label}</p>
            <p
              className={`acct-wal__rail-row-value${
                row.mono ? " acct-wal__rail-row-value--mono" : ""
              }`}
            >
              {row.value || copy.pending}
            </p>
          </div>
          {row.value ? (
            <CopyValueButton value={row.value} label={resolvedCopyLabel} copiedLabel={resolvedCopiedLabel} />
          ) : null}
        </div>
      ))}
    </div>
  );
}
