import Link from "next/link";
import { CreditCard, FileCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  formatAccountTemplate,
  translateSurfaceLabel,
  type AccountCopy,
  type AppLocale,
} from "@henryco/i18n";

import { formatStamp, paymentKind, type PaymentKind, type PaymentRow } from "./helpers";

type StudioCopy = AccountCopy["divisionStudio"];

type Props = {
  payments: ReadonlyArray<PaymentRow>;
  copy: StudioCopy;
  locale: AppLocale;
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

function statusLabel(raw: string | null | undefined, copy: StudioCopy, locale: AppLocale): string {
  const key = String(raw || "").toLowerCase();
  const map = copy.paymentStatusLabels as Record<string, string | undefined>;
  if (key && map[key]) return map[key] as string;
  // Fallback: take the raw label, replace underscores, and route through the runtime translator
  // so the user still sees a localised approximation rather than a snake_case string.
  return translateSurfaceLabel(locale, key.replace(/_/g, " ") || "pending");
}

export function StudioPayments({ payments, copy, locale, limit = 6 }: Props) {
  const rows = payments.slice(0, limit);
  if (rows.length === 0) return null;

  return (
    <div className="acct-stu__list" role="list" aria-label={copy.payments.listAriaLabel}>
      {rows.map((p) => {
        const kind = paymentKind(p.status);
        const Icon = ICON_BY_KIND[kind];
        const statusText = statusLabel(p.status, copy, locale);
        const dueText = p.dueDate
          ? formatAccountTemplate(copy.payments.dueTemplate, { stamp: formatStamp(p.dueDate) })
          : formatAccountTemplate(copy.payments.updatedTemplate, { stamp: formatStamp(p.updatedAt) });
        const methodText = translateSurfaceLabel(locale, p.method.replace(/_/g, " "));
        const sub = formatAccountTemplate(copy.payments.subTemplate, {
          amount: formatAmount(p.amount, p.currency),
          method: methodText,
          due: dueText,
        });
        const aria = formatAccountTemplate(copy.payments.rowAriaLabelTemplate, {
          label: p.label,
          status: statusText,
        });

        return (
          <Link
            key={p.id}
            href={`/studio/payments/${p.id}`}
            className="acct-stu__row"
            role="listitem"
            aria-label={aria}
          >
            <span className="acct-stu__row-icon" data-kind={kind} aria-hidden>
              <Icon size={16} />
            </span>
            <div className="acct-stu__row-meta">
              <span className="acct-stu__row-title">{p.label}</span>
              <span className="acct-stu__row-sub">{sub}</span>
            </div>
            <span className="acct-stu__chip" data-kind={kind}>
              {statusText}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
