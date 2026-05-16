import Link from "next/link";
import {
  divisionForKey,
  formatKoboMajor,
  invoiceTone,
  type InvoiceRow,
} from "./helpers";

type Props = {
  invoices: ReadonlyArray<InvoiceRow>;
  statusLabel: (status: string) => string;
  fallbackTitle: (invoiceNo: string | null) => string;
  formatDate: (iso: string) => string;
  ariaListLabel: string;
  rowAriaTemplate: string;
  divisionLabels: Record<string, string>;
};

export function InvoicesList({
  invoices,
  statusLabel,
  fallbackTitle,
  formatDate,
  ariaListLabel,
  rowAriaTemplate,
  divisionLabels,
}: Props) {
  return (
    <div className="acct-inv__list" role="list" aria-label={ariaListLabel}>
      {invoices.map((inv) => {
        const palette = divisionForKey(inv.division);
        const localizedDivision =
          (inv.division && divisionLabels[inv.division]) ||
          divisionLabels.fallback ||
          palette.label;
        const tone = invoiceTone(inv.status);
        const initial = (localizedDivision || "·").charAt(0).toUpperCase();
        const invoiceNumber = inv.invoice_no ?? inv.id.slice(0, 8);
        const amount = formatKoboMajor(inv.total_kobo);
        const rowAria = rowAriaTemplate
          .replace("{number}", invoiceNumber)
          .replace("{amount}", amount);
        return (
          <Link
            key={inv.id}
            href={`/invoices/${inv.id}`}
            className="acct-inv__row"
            role="listitem"
            aria-label={rowAria}
          >
            <span className="acct-inv__row-icon" style={{ background: palette.color }} aria-hidden>
              {initial}
            </span>
            <div className="acct-inv__row-meta">
              <span className="acct-inv__row-title">
                {inv.description || fallbackTitle(inv.invoice_no)}
              </span>
              <span className="acct-inv__row-sub">
                {inv.invoice_no || inv.id.slice(0, 8).toUpperCase()} · {localizedDivision} ·{" "}
                {formatDate(inv.created_at)}
              </span>
            </div>
            <span className="acct-inv__chip" data-tone={tone}>
              {statusLabel(inv.status)}
            </span>
            <span className="acct-inv__amount">₦{formatKoboMajor(inv.total_kobo)}</span>
          </Link>
        );
      })}
    </div>
  );
}
