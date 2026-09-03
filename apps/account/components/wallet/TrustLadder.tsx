import Link from "next/link";
import { CheckCircle2, FileCheck, KeyRound, ShieldCheck } from "lucide-react";
import type { AccountCopy } from "@henryco/i18n/server";

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
  copy: AccountCopy["wallet"]["trust"];
};

function format(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

export function TrustLadder({
  verificationLabel,
  verificationDone,
  verificationHref = "/verification",
  payoutMethodCount,
  withdrawalPinConfigured,
  copy,
}: Props) {
  const rows: Row[] = [
    {
      title: copy.identityTitle,
      desc: verificationDone
        ? format(copy.identityDescDoneTemplate, { label: verificationLabel })
        : format(copy.identityDescTodoTemplate, { label: verificationLabel }),
      state: verificationDone ? "done" : "todo",
      cta: verificationDone ? undefined : { href: verificationHref, label: copy.identityCta },
      icon: ShieldCheck,
    },
    {
      title: copy.pinTitle,
      desc: withdrawalPinConfigured ? copy.pinDescDone : copy.pinDescTodo,
      state: withdrawalPinConfigured ? "done" : "todo",
      cta: withdrawalPinConfigured
        ? undefined
        : { href: "/wallet/withdrawals", label: copy.pinCta },
      icon: KeyRound,
    },
    {
      title: copy.payoutTitle,
      desc:
        payoutMethodCount > 0
          ? payoutMethodCount === 1
            ? copy.payoutDescSingular
            : format(copy.payoutDescPluralTemplate, { count: payoutMethodCount })
          : copy.payoutDescEmpty,
      state: payoutMethodCount > 0 ? "done" : "todo",
      cta:
        payoutMethodCount > 0
          ? { href: "/wallet/withdrawals", label: copy.payoutCtaManage }
          : { href: "/wallet/withdrawals", label: copy.payoutCtaAdd },
      icon: FileCheck,
    },
  ];
  return (
    <div className="acct-wal__trust" aria-label={copy.ariaLabel}>
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
        {copy.heading}
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
