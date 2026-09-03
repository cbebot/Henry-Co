/**
 * V3-73 — Studio Project Suite: payment-truth gate for final-file unlock.
 *
 * This is a READ-ONLY money-truth check (no payment behaviour is changed). Final,
 * un-watermarked deliverable files unlock ONLY when the project is confirmed-paid:
 * there is at least one invoice (totalKobo > 0) AND nothing outstanding. A project
 * with no invoices is NOT "paid" — it must never unlock a final file (no leak).
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { isProjectPaid, summarizeInvoices } from "./project-payment";

test("fully paid project unlocks", () => {
  assert.equal(isProjectPaid({ totalKobo: 100_000, outstandingKobo: 0 }), true);
});

test("partially paid project does NOT unlock", () => {
  assert.equal(isProjectPaid({ totalKobo: 100_000, outstandingKobo: 40_000 }), false);
});

test("fully unpaid project does NOT unlock", () => {
  assert.equal(isProjectPaid({ totalKobo: 100_000, outstandingKobo: 100_000 }), false);
});

test("project with NO invoices does NOT unlock (zero invoices != paid)", () => {
  // The critical no-leak rule: absence of invoices is not proof of payment.
  assert.equal(isProjectPaid({ totalKobo: 0, outstandingKobo: 0 }), false);
});

test("overpaid (negative outstanding) still unlocks", () => {
  assert.equal(isProjectPaid({ totalKobo: 100_000, outstandingKobo: -500 }), true);
});

test("defensive: NaN / missing values never unlock", () => {
  assert.equal(isProjectPaid({ totalKobo: Number.NaN, outstandingKobo: 0 }), false);
  assert.equal(isProjectPaid({ totalKobo: 100_000, outstandingKobo: Number.NaN }), false);
  assert.equal(
    isProjectPaid({ totalKobo: undefined as unknown as number, outstandingKobo: 0 }),
    false,
  );
});

test("summarizeInvoices rolls up total / paid / outstanding from invoice rows", () => {
  const s = summarizeInvoices([
    { amount_kobo: 60_000, status: "paid" },
    { amount_kobo: 40_000, status: "sent" },
  ]);
  assert.equal(s.totalKobo, 100_000);
  assert.equal(s.paidKobo, 60_000);
  assert.equal(s.outstandingKobo, 40_000);
});

test("summarizeInvoices: all paid => zero outstanding (unlockable)", () => {
  const s = summarizeInvoices([
    { amount_kobo: 60_000, status: "paid" },
    { amount_kobo: 40_000, status: "paid" },
  ]);
  assert.equal(s.outstandingKobo, 0);
  assert.equal(isProjectPaid(s), true);
});

test("summarizeInvoices: empty invoice set => total 0, not paid", () => {
  const s = summarizeInvoices([]);
  assert.deepEqual(s, { totalKobo: 0, paidKobo: 0, outstandingKobo: 0 });
  assert.equal(isProjectPaid(s), false);
});

test("summarizeInvoices tolerates null/garbage amounts", () => {
  const s = summarizeInvoices([
    { amount_kobo: null as unknown as number, status: "paid" },
    { amount_kobo: 50_000, status: "paid" },
  ]);
  assert.equal(s.totalKobo, 50_000);
  assert.equal(s.paidKobo, 50_000);
});
