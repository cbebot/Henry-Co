import Link from "next/link";
import { CreditCard, FileCheck, AlertTriangle, CheckCircle2 } from "lucide-react";

import { formatStamp, paymentKind, type PaymentKind, type PaymentRow } from "./helpers";

type Props = {
  payments: ReadonlyArray<PaymentRow>;
  limit?: number;
};

const ICON_BY_KIND: Record<PaymentKind, typeof CreditCard> = {
  pending: CreditCard,
  proof: FileCheck,
  approved: CheckCircle2,
  issue: AlertTriangle,
};

const NF = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

function formatAmount(amount: number, currency: string): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  if (currency === "NGN" || !currency) return `₦${NF.format(n)}`;
  return `${currency} ${NF.format(n)}`;
}

export function StudioPayments({ payments, limit = 6 }: Props) {
  const rows = payments.slice(0, limit);
  if (rows.length === 0) return null;

  return (
    <div className="acct-stu__list" role="list" aria-label="Studio payments">
      {rows.map((p) => {
        const kind = paymentKind(p.status);
        const Icon = ICON_BY_KIND[kind];
        const status = String(p.status || "pending").replace(/_/g, " ");
        const due = p.dueDate ? `Due ${formatStamp(p.dueDate)}` : `Updated ${formatStamp(p.updatedAt)}`;

        return (
          <Link
            key={p.id}
            href={`/studio/payments/${p.id}`}
            className="acct-stu__row"
            role="listitem"
            aria-label={`${p.label} · ${status}`}
          >
            <span className="acct-stu__row-icon" data-kind={kind} aria-hidden>
              <Icon size={16} />
            </span>
            <div className="acct-stu__row-meta">
              <span className="acct-stu__row-title">{p.label}</span>
              <span className="acct-stu__row-sub">
                {formatAmount(p.amount, p.currency)} · {p.method.replace(/_/g, " ")} · {due}
              </span>
            </div>
            <span className="acct-stu__chip" data-kind={kind}>
              {status}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
