/**
 * The static-label + legal-issuer contract the receipt/invoice templates consume.
 *
 * This package is intentionally i18n-AGNOSTIC: it renders whatever labels it is
 * handed. The app layer resolves a locale's copy (`getPaymentDocumentCopy(locale)`
 * from `@henryco/i18n`) and the issuer (`buildDocumentIssuer(division)` from
 * `@henryco/config`) and passes them in. TypeScript checks compatibility at that
 * call site.
 *
 * ►► LOCKSTEP: `PaymentDocumentLabels` mirrors `PaymentDocumentCopy` in
 *    `packages/i18n/src/payment-document-copy.ts`. Keep the two in sync — a drift
 *    is a compile error at the route that bridges them (by design).
 *    `DocumentIssuerDetails` mirrors `DocumentIssuer` in
 *    `packages/config/issuer.ts`.
 */

export type PaymentDocumentLabels = {
  // Document-type kickers
  receiptType: string;
  invoiceType: string;

  // Party section headers
  issuedBy: string;
  from: string;
  billedTo: string;
  billTo: string;

  // Issuer detail labels
  rc: string;
  vatId: string;

  // Customer rows
  customerName: string;
  customerEmail: string;
  delivery: string;

  // Header meta labels
  metaPaid: string;
  metaIssued: string;
  metaDue: string;
  metaOnReceipt: string;
  metaMethod: string;
  metaReference: string;
  metaStatus: string;

  // Banner
  totalPaid: string;

  // Items tables
  receiptItemsSection: string;
  invoiceItemsSection: string;
  colItem: string;
  colQty: string;
  colUnit: string;
  colAmount: string;
  receiptItemsEmpty: string;
  invoiceItemsEmpty: string;

  // Settlement / totals
  settlement: string;
  subtotal: string;
  discount: string;
  fees: string;
  vat: string;
  total: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentReference: string;
  paidAt: string;

  notes: string;
  auditReference: string;

  // Status values
  statusPaid: string;
  statusIssued: string;
  statusVoid: string;
  statusPending: string;
  statusRefunded: string;

  // Payment-method values
  methodCard: string;
  methodBank: string;
  methodTransfer: string;
  methodWallet: string;
  methodUssd: string;

  // Legal-footer lines ({issuer}/{email} interpolated from config)
  receiptLegal1: string;
  receiptLegal2: string;
  invoiceLegal1: string;
  invoiceLegal2: string;

  // Default invoice subtitle when none is provided
  defaultInvoiceDescription: string;

  // Credit note (V3-19) — the legal face of a confirmed refund.
  creditNoteType: string;
  totalCredited: string;
  metaRefunded: string;
  refundOf: string;
  creditNoteItemsSection: string;
  creditNoteItemsEmpty: string;
  creditNoteLegal1: string;
  creditNoteLegal2: string;
};

/** Legal issuer block (mirrors `DocumentIssuer` from `@henryco/config`). */
export type DocumentIssuerDetails = {
  /** Legal entity that issues the document (COMPANY.group.legalName). */
  name: string;
  /** Trading label shown as the division header ("Henry Onyx <Division>"). */
  divisionLabel?: string;
  /** Registered-office lines, already filtered of unconfirmed placeholders. */
  addressLines: string[];
  rcNumber?: string | null;
  vatNumber?: string | null;
  contactEmail: string;
  contactPhone?: string | null;
};

/**
 * Resolve a payment-method enum value to its localized label, falling back to the
 * raw value when unknown. Keeps a payment instrument (card/bank/wallet/USSD)
 * localized WITHOUT ever naming the underlying processor.
 */
export function resolvePaymentMethodLabel(
  method: string | null | undefined,
  labels: PaymentDocumentLabels,
): string {
  const key = String(method ?? "").trim().toLowerCase();
  switch (key) {
    case "card":
      return labels.methodCard;
    case "bank":
    case "bank_transfer":
    case "banktransfer":
      return labels.methodBank;
    case "transfer":
      return labels.methodTransfer;
    case "wallet":
      return labels.methodWallet;
    case "ussd":
      return labels.methodUssd;
    default:
      return String(method ?? "").trim() || "—";
  }
}

/**
 * Resolve a document status value to its localized label, falling back to the raw
 * value when unknown.
 */
export function resolveStatusLabel(
  status: string | null | undefined,
  labels: PaymentDocumentLabels,
): string {
  const key = String(status ?? "").trim().toLowerCase();
  switch (key) {
    case "paid":
    case "succeeded":
      return labels.statusPaid;
    case "issued":
      return labels.statusIssued;
    case "void":
      return labels.statusVoid;
    case "pending":
      return labels.statusPending;
    case "refunded":
      return labels.statusRefunded;
    default:
      return String(status ?? "").trim() || "—";
  }
}

/** Interpolate `{issuer}` / `{email}` placeholders in a legal-footer line. */
export function interpolateLegalLine(
  template: string,
  values: { issuer: string; email: string },
): string {
  return String(template ?? "")
    .replace(/\{issuer\}/g, values.issuer)
    .replace(/\{email\}/g, values.email);
}
