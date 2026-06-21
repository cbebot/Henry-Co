/**
 * V3-73 — Studio Project Suite: payment-truth gate (READ-ONLY).
 *
 * This pass never changes how payment is taken — it only READS confirmed money-truth
 * to gate the final-file unlock. The truth source is the studio invoice roll-up
 * (`getClientProjectDetail(...).paymentSummary`): `totalKobo` is the sum of issued
 * invoices, `outstandingKobo` is what remains after `status='paid'` invoices.
 *
 * A project is "paid" (and only then may a final file unlock) when:
 *   - at least one invoice has been issued (totalKobo > 0), AND
 *   - nothing is outstanding (outstandingKobo <= 0).
 *
 * The first clause is the no-leak rule: a project with no invoices is NOT proof of
 * payment and must never unlock a final, un-watermarked file.
 */
export type PaymentGateInput = {
  totalKobo: number;
  outstandingKobo: number;
};

export type PaymentSummary = {
  totalKobo: number;
  paidKobo: number;
  outstandingKobo: number;
};

export function isProjectPaid(summary: PaymentGateInput): boolean {
  const total = summary?.totalKobo;
  const outstanding = summary?.outstandingKobo;
  if (!Number.isFinite(total) || !Number.isFinite(outstanding)) return false;
  return total > 0 && outstanding <= 0;
}

export type InvoiceRow = { amount_kobo: number | null; status: string | null };

/**
 * Pure money-truth roll-up over a project's invoice rows. Mirrors
 * `getClientProjectDetail(...).paymentSummary` so the gate uses the same logic
 * everywhere: total = Σ amount_kobo, paid = Σ where status='paid'.
 */
export function summarizeInvoices(rows: InvoiceRow[]): PaymentSummary {
  let totalKobo = 0;
  let paidKobo = 0;
  for (const row of rows) {
    const amount = Number(row?.amount_kobo);
    if (!Number.isFinite(amount)) continue;
    totalKobo += amount;
    if (row?.status === "paid") paidKobo += amount;
  }
  return { totalKobo, paidKobo, outstandingKobo: Math.max(0, totalKobo - paidKobo) };
}
