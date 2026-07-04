import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { coercePaymentStatus } from "@henryco/payment-surface/adapter";
import { formatPaymentAmount } from "@henryco/payment-surface/format";

import {
  invoiceProofOnFile,
  koboToMajorUnits,
  latestSubmissionForInvoice,
  portalInvoiceToPaymentRecordView,
} from "./portal-payment-mapping";
import type { StudioInvoice, StudioPaymentSubmission } from "@/types/portal";

function makeInvoice(overrides: Partial<StudioInvoice> = {}): StudioInvoice {
  return {
    id: "inv-0001",
    projectId: "proj-0001",
    milestoneId: null,
    clientUserId: "user-0001",
    normalizedEmail: "client@example.com",
    invoiceNumber: "HOS-2026-0042",
    amountKobo: 4495000,
    currency: "NGN",
    description: "Brand identity — deposit",
    dueDate: "2026-07-15",
    status: "sent",
    invoiceToken: null,
    issuedAt: "2026-07-01T09:00:00Z",
    paidAt: null,
    createdAt: "2026-07-01T09:00:00Z",
    updatedAt: "2026-07-01T09:00:00Z",
    ...overrides,
  };
}

function makeSubmission(
  overrides: Partial<StudioPaymentSubmission> = {},
): StudioPaymentSubmission {
  return {
    id: "pay-0001",
    invoiceId: "inv-0001",
    projectId: "proj-0001",
    clientUserId: "user-0001",
    amountKobo: 4495000,
    currency: "NGN",
    paymentReference: "NIB/2026/07/001234",
    proofUrl: "https://res.example.com/proof.pdf",
    proofPublicId: "proof-public-id",
    proofName: "transfer-receipt.pdf",
    submittedAt: "2026-07-02T10:00:00Z",
    verifiedAt: null,
    verifiedBy: null,
    status: "submitted",
    rejectionReason: null,
    notes: null,
    ...overrides,
  };
}

describe("koboToMajorUnits", () => {
  it("divides by 100 without rounding — kobo precision is preserved", () => {
    assert.equal(koboToMajorUnits(4495000), 44950);
    assert.equal(koboToMajorUnits(4495055), 44950.55);
    assert.equal(koboToMajorUnits(1), 0.01);
    assert.equal(koboToMajorUnits(0), 0);
  });

  it("treats non-finite input as zero", () => {
    assert.equal(koboToMajorUnits(Number.NaN), 0);
    assert.equal(koboToMajorUnits(Number.POSITIVE_INFINITY), 0);
  });
});

describe("portalInvoiceToPaymentRecordView", () => {
  it("maps the portal invoice shape onto the canonical record view", () => {
    const view = portalInvoiceToPaymentRecordView(makeInvoice());
    assert.equal(view.id, "inv-0001");
    assert.equal(view.label, "Brand identity — deposit");
    assert.equal(view.amount, 44950);
    assert.equal(view.currency, "NGN");
    assert.equal(view.dueDate, "2026-07-15");
    assert.equal(view.reference, "HOS-2026-0042");
    assert.equal(view.proofName, null);
    assert.equal(view.proofUrl, null);
  });

  it("coerces every portal invoice status through coercePaymentStatus", () => {
    const cases: Array<[StudioInvoice["status"], string]> = [
      ["sent", "pending"],
      ["overdue", "pending"],
      ["draft", "pending"],
      ["pending_verification", "processing"],
      ["paid", "paid"],
      ["cancelled", "cancelled"],
    ];
    for (const [portalStatus, expected] of cases) {
      const view = portalInvoiceToPaymentRecordView(makeInvoice({ status: portalStatus }));
      assert.equal(view.status, expected, `status ${portalStatus}`);
      assert.equal(view.status, coercePaymentStatus(portalStatus));
    }
  });

  it("never reformats kobo amounts lossily — exact strings via the shared format helper", () => {
    const even = portalInvoiceToPaymentRecordView(makeInvoice({ amountKobo: 4495000 }));
    assert.equal(formatPaymentAmount(even.amount, even.currency), "₦44,950");

    const fractional = portalInvoiceToPaymentRecordView(makeInvoice({ amountKobo: 4495055 }));
    // The view keeps full kobo precision; only the format helper rounds for display.
    assert.equal(fractional.amount * 100, 4495055);
    assert.equal(formatPaymentAmount(fractional.amount, fractional.currency), "₦44,951");

    const half = portalInvoiceToPaymentRecordView(makeInvoice({ amountKobo: 4495050 }));
    assert.equal(formatPaymentAmount(half.amount, half.currency), "₦44,951");

    const zero = portalInvoiceToPaymentRecordView(makeInvoice({ amountKobo: 0 }));
    assert.equal(formatPaymentAmount(zero.amount, zero.currency), "₦0");
  });

  it("prefers the caller's localized label and falls back calmly", () => {
    const localized = portalInvoiceToPaymentRecordView(makeInvoice(), {
      label: "Identité de marque — acompte",
    });
    assert.equal(localized.label, "Identité de marque — acompte");

    const empty = portalInvoiceToPaymentRecordView(makeInvoice({ description: "" }));
    assert.equal(empty.label, "Studio invoice");
  });

  it("passes the caller's status label through untouched — status is record truth", () => {
    const view = portalInvoiceToPaymentRecordView(makeInvoice({ status: "pending_verification" }), {
      statusLabel: "Verifying",
    });
    assert.equal(view.statusLabel, "Verifying");
    assert.equal(view.status, "processing");
  });

  it("uses paidAt for the receipt date when settled, updatedAt otherwise", () => {
    const paid = portalInvoiceToPaymentRecordView(
      makeInvoice({ status: "paid", paidAt: "2026-07-03T12:00:00Z" }),
    );
    assert.equal(paid.updatedAt, "2026-07-03T12:00:00Z");

    const open = portalInvoiceToPaymentRecordView(makeInvoice());
    assert.equal(open.updatedAt, "2026-07-01T09:00:00Z");
  });

  it("attaches proof fields only when the caller resolved real proof", () => {
    const withProof = portalInvoiceToPaymentRecordView(
      makeInvoice({ status: "pending_verification" }),
      { proof: { proofName: "transfer-receipt.pdf", proofUrl: "https://res.example.com/proof.pdf" } },
    );
    assert.equal(withProof.proofName, "transfer-receipt.pdf");
    assert.equal(withProof.proofUrl, "https://res.example.com/proof.pdf");
  });
});

describe("invoiceProofOnFile", () => {
  it("returns proof only while the record says verification is in progress", () => {
    const submission = makeSubmission();
    const proof = invoiceProofOnFile(makeInvoice({ status: "pending_verification" }), submission);
    assert.deepEqual(proof, {
      proofName: "transfer-receipt.pdf",
      proofUrl: "https://res.example.com/proof.pdf",
    });
  });

  it("never resurfaces old proof on a payable or settled invoice", () => {
    const submission = makeSubmission();
    for (const status of ["sent", "overdue", "draft", "paid", "cancelled"] as const) {
      assert.equal(invoiceProofOnFile(makeInvoice({ status }), submission), null, status);
    }
  });

  it("returns null when there is no submission or no proof fields", () => {
    const invoice = makeInvoice({ status: "pending_verification" });
    assert.equal(invoiceProofOnFile(invoice, null), null);
    assert.equal(invoiceProofOnFile(invoice, undefined), null);
    assert.equal(
      invoiceProofOnFile(invoice, makeSubmission({ proofName: null, proofUrl: null })),
      null,
    );
  });
});

describe("latestSubmissionForInvoice", () => {
  it("picks the newest submission for the invoice by submittedAt", () => {
    const older = makeSubmission({ id: "pay-old", submittedAt: "2026-07-01T08:00:00Z" });
    const newest = makeSubmission({ id: "pay-new", submittedAt: "2026-07-02T10:00:00Z" });
    const otherInvoice = makeSubmission({
      id: "pay-other",
      invoiceId: "inv-9999",
      submittedAt: "2026-07-03T10:00:00Z",
    });
    const picked = latestSubmissionForInvoice([older, otherInvoice, newest], "inv-0001");
    assert.equal(picked?.id, "pay-new");
  });

  it("returns null when the invoice has no submissions", () => {
    assert.equal(latestSubmissionForInvoice([], "inv-0001"), null);
    assert.equal(
      latestSubmissionForInvoice([makeSubmission({ invoiceId: "inv-9999" })], "inv-0001"),
      null,
    );
  });

  it("does not mutate the caller's list", () => {
    const list = [
      makeSubmission({ id: "a", submittedAt: "2026-07-01T08:00:00Z" }),
      makeSubmission({ id: "b", submittedAt: "2026-07-02T08:00:00Z" }),
    ];
    latestSubmissionForInvoice(list, "inv-0001");
    assert.deepEqual(
      list.map((item) => item.id),
      ["a", "b"],
    );
  });
});
