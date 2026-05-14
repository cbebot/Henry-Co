import { Building2 } from "lucide-react";
import CopyValueButton from "@/components/ui/CopyValueButton";

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

export function AccountDetailsCard({
  rail,
  copyLabel = "Copy",
  copiedLabel = "Copied",
}: Props) {
  const rows: Array<{ label: string; value: string | null | undefined; mono?: boolean }> = [
    { label: "Bank", value: rail.bankName },
    { label: "Account name", value: rail.accountName },
    { label: "Account number", value: rail.accountNumber, mono: true },
  ];
  return (
    <div className="acct-wal__rail" aria-label="HenryCo finance account">
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
            Transfer details
          </p>
          <h3 className="acct-wal__rail-title">HenryCo finance account</h3>
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
              {row.value || "Pending"}
            </p>
          </div>
          {row.value ? (
            <CopyValueButton value={row.value} label={copyLabel} copiedLabel={copiedLabel} />
          ) : null}
        </div>
      ))}
    </div>
  );
}
