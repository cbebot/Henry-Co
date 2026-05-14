import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Plus, Receipt } from "lucide-react";

type Action = {
  href: string;
  label: string;
  desc: string;
  tone?: "green" | "blue" | "orange";
  icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
};

const ACTIONS: Action[] = [
  {
    href: "/wallet/funding",
    label: "Add funds",
    desc: "Bank transfer with proof upload and instant confirmation.",
    tone: "green",
    icon: Plus,
  },
  {
    href: "/wallet/withdrawals",
    label: "Withdraw",
    desc: "Move available balance to a verified bank account.",
    tone: "orange",
    icon: ArrowUpRight,
  },
  {
    href: "/payments",
    label: "Payments",
    desc: "Recent charges, refunds and saved methods.",
    tone: "blue",
    icon: ArrowDownLeft,
  },
  {
    href: "/invoices",
    label: "Receipts & invoices",
    desc: "Branded PDFs across every division.",
    icon: Receipt,
  },
];

export function QuickActions() {
  return (
    <div className="acct-wal__actions" role="list" aria-label="Wallet quick actions">
      {ACTIONS.map((a) => {
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
