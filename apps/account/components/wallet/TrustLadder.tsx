import Link from "next/link";
import { CheckCircle2, FileCheck, KeyRound, ShieldCheck } from "lucide-react";

type Row = {
  title: string;
  desc: string;
  state: "done" | "todo" | "warn";
  cta?: { href: string; label: string };
  icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
};

type Props = {
  verificationLabel: string;
  verificationDone: boolean;
  verificationHref?: string;
  payoutMethodCount: number;
  withdrawalPinConfigured: boolean;
};

export function TrustLadder({
  verificationLabel,
  verificationDone,
  verificationHref = "/verification",
  payoutMethodCount,
  withdrawalPinConfigured,
}: Props) {
  const rows: Row[] = [
    {
      title: "Identity verified",
      desc: verificationDone
        ? `${verificationLabel}. Required for withdrawal payouts.`
        : `${verificationLabel}. Complete it once to unlock withdrawals.`,
      state: verificationDone ? "done" : "todo",
      cta: verificationDone ? undefined : { href: verificationHref, label: "Continue →" },
      icon: ShieldCheck,
    },
    {
      title: "Withdrawal PIN",
      desc: withdrawalPinConfigured
        ? "Your withdrawal PIN is set."
        : "Set a 4-digit PIN to authorise every withdrawal.",
      state: withdrawalPinConfigured ? "done" : "todo",
      cta: withdrawalPinConfigured
        ? undefined
        : { href: "/wallet/withdrawals", label: "Set PIN →" },
      icon: KeyRound,
    },
    {
      title: "Payout method",
      desc:
        payoutMethodCount > 0
          ? `${payoutMethodCount} verified ${payoutMethodCount === 1 ? "method" : "methods"} on file.`
          : "Add a bank account to receive withdrawals.",
      state: payoutMethodCount > 0 ? "done" : "todo",
      cta:
        payoutMethodCount > 0
          ? { href: "/wallet/withdrawals", label: "Manage →" }
          : { href: "/wallet/withdrawals", label: "Add method →" },
      icon: FileCheck,
    },
  ];
  return (
    <div className="acct-wal__trust" aria-label="Withdrawal readiness">
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
        Withdrawal readiness
      </p>
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <div className="acct-wal__trust-row" key={row.title}>
            <span className="acct-wal__trust-icon" data-state={row.state} aria-hidden>
              {row.state === "done" ? <CheckCircle2 size={18} /> : <Icon size={18} />}
            </span>
            <span className="acct-wal__trust-meta">
              <span className="acct-wal__trust-title">{row.title}</span>
              <span className="acct-wal__trust-desc">{row.desc}</span>
            </span>
            {row.cta ? (
              <Link href={row.cta.href} className="acct-wal__trust-cta">
                {row.cta.label}
              </Link>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
