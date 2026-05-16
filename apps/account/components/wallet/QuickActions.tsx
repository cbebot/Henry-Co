import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Plus, Receipt } from "lucide-react";
import type { AccountCopy } from "@henryco/i18n/server";

type Action = {
  href: string;
  label: string;
  desc: string;
  tone?: "green" | "blue" | "orange";
  icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
};

type Props = {
  copy: AccountCopy["wallet"]["quickActions"];
};

export function QuickActions({ copy }: Props) {
  const actions: Action[] = [
    {
      href: "/wallet/funding",
      label: copy.addFundsLabel,
      desc: copy.addFundsDesc,
      tone: "green",
      icon: Plus,
    },
    {
      href: "/wallet/withdrawals",
      label: copy.withdrawLabel,
      desc: copy.withdrawDesc,
      tone: "orange",
      icon: ArrowUpRight,
    },
    {
      href: "/payments",
      label: copy.paymentsLabel,
      desc: copy.paymentsDesc,
      tone: "blue",
      icon: ArrowDownLeft,
    },
    {
      href: "/invoices",
      label: copy.receiptsLabel,
      desc: copy.receiptsDesc,
      icon: Receipt,
    },
  ];
  return (
    <div className="acct-wal__actions" role="list" aria-label={copy.ariaLabel}>
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link key={a.label} href={a.href} className="acct-wal__action" role="listitem">
            <span className="acct-wal__action-icon" data-tone={a.tone || undefined} aria-hidden>
              <Icon size={18} aria-hidden />
            </span>
            <h4 className="acct-wal__action-label">{a.label}</h4>
            <p className="acct-wal__action-desc">{a.desc}</p>
          </Link>
        );
      })}
    </div>
  );
}
