import { test } from "node:test";
import assert from "node:assert/strict";
import Module from "node:module";
import { createRequire } from "node:module";

import {
  applyInclusiveVat,
  applyOutputVat,
  type PricingBreakdown,
} from "@henryco/pricing";

// `@henryco/branded-documents/render` (pulled in transitively by ./payment-documents)
// does `import "server-only"`, a bundler-only guard that THROWS on import under plain
// Node. tsx transpiles the workspace .ts to CommonJS, so that becomes a `require`.
// Shim it to an empty module BEFORE requiring the module under test — exactly the
// V3-18 proof-harness pattern (test-harness-only; the Next.js bundle guard is untouched).
const SHIMMED = new Set(["server-only", "client-only"]);
const _origLoad = (Module as unknown as { _load: (...a: unknown[]) => unknown })._load;
(Module as unknown as { _load: (...a: unknown[]) => unknown })._load = function (
  request: unknown,
  ...rest: unknown[]
) {
  if (typeof request === "string" && SHIMMED.has(request)) return {};
  return _origLoad.call(this, request, ...rest);
};

const require = createRequire(import.meta.url);
const {
  splitDocumentMoney,
  buildReceiptProps,
}: typeof import("./payment-documents") = require("./payment-documents");
type ConfirmedPayment = import("./payment-documents").ConfirmedPayment;

/* -------------------------------------------------------------------------- */
/*  Test fixtures                                                              */
/* -------------------------------------------------------------------------- */

// 7.5% standard rate, mirroring @henryco/config TAX.vat (passed explicitly so the
// test never depends on a global and never hardcodes the rate at a call site).
const POLICY = { standardRate: 0.075, rateVersion: "TEST" } as const;

/** A bare NGN breakdown carrying a single non-tax line in KOBO. */
function baseBreakdown(amountKobo: number): PricingBreakdown {
  return {
    currency: "NGN",
    lines: [{ code: "items_subtotal", label: "Items", amount: { currency: "NGN", amount: amountKobo } }],
    totals: {
      customerTotal: { currency: "NGN", amount: amountKobo },
      vendorGross: { currency: "NGN", amount: amountKobo },
      platformNet: { currency: "NGN", amount: 0 },
      vendorNet: { currency: "NGN", amount: amountKobo },
    },
    meta: { division: "marketplace", ruleBookKey: "test", ruleVersion: "test", computedAt: "2026-01-01T00:00:00.000Z" },
  };
}

function payment(amountKobo: number): ConfirmedPayment {
  return {
    intentId: "pi-1",
    amountMinor: amountKobo,
    currency: "NGN",
    ledgerEntryId: "je-1",
    ledgerDebitMinor: amountKobo,
    division: "marketplace",
    paymentMethod: "card",
    paymentReference: "ref-1",
    paidAt: "2026-01-15T12:00:00.000Z",
    receiptNo: "HO-RCT-2026-000001",
  };
}

/* -------------------------------------------------------------------------- */
/*  splitDocumentMoney — INCLUSIVE VAT (V3-VAT-CLASSIFICATION-01)              */
/* -------------------------------------------------------------------------- */

test("inclusive: base = total − tax (fees NOT subtracted twice), reconciles to total", () => {
  // ₦100,000 = 10,000,000 kobo, VAT carved INCLUSIVE at 7.5%.
  const gross = 10_000_000;
  const breakdown = applyInclusiveVat(baseBreakdown(gross), { treatment: "standard" }, POLICY);
  // customerTotal stays the gross (VAT is inside it).
  assert.equal(breakdown.totals.customerTotal.amount, gross);

  const split = splitDocumentMoney(gross, breakdown);
  // exVat = round(gross / 1.075) = 9,302,326 ; vat = gross − exVat = 697,674.
  assert.equal(split.taxInclusive, true);
  assert.equal(split.taxMinor, gross - Math.round(gross / 1.075));
  assert.equal(split.feesMinor, 0, "inclusive path must not carve fees out of the base again");
  // The structured NRS triad reconciles: base + tax === total.
  assert.equal(split.subtotalMinor + split.taxMinor, split.totalMinor);
  assert.equal(split.totalMinor, gross);
  assert.equal(split.taxRate, 0.075);
  assert.equal(split.taxTreatment, "standard");
});

test("inclusive WITH a fee line: fee stays inside the base, base + tax === total", () => {
  const gross = 5_000_000;
  const withFee: PricingBreakdown = {
    ...baseBreakdown(gross - 200_000),
    lines: [
      { code: "items_subtotal", label: "Items", amount: { currency: "NGN", amount: gross - 200_000 } },
      { code: "platform_fee", label: "Platform fee", amount: { currency: "NGN", amount: 200_000 } },
    ],
  };
  const breakdown = applyInclusiveVat(withFee, { treatment: "standard" }, POLICY);
  assert.equal(breakdown.totals.customerTotal.amount, gross);

  const split = splitDocumentMoney(gross, breakdown);
  // The inclusive path must report feesMinor=0 and fold the fee into the VAT-exclusive
  // base — otherwise base + tax would understate the total by the fee amount.
  assert.equal(split.feesMinor, 0);
  assert.equal(split.taxInclusive, true);
  assert.equal(split.subtotalMinor + split.taxMinor, gross);
});

/* -------------------------------------------------------------------------- */
/*  splitDocumentMoney — ADD-ON-TOP VAT (legacy applyOutputVat)               */
/* -------------------------------------------------------------------------- */

test("add-on-top: base = total − fees − tax, reconciles to total", () => {
  const subtotal = 1_000_000;
  const fee = 50_000;
  const withFee: PricingBreakdown = {
    ...baseBreakdown(subtotal),
    lines: [
      { code: "items_subtotal", label: "Items", amount: { currency: "NGN", amount: subtotal } },
      { code: "platform_fee", label: "Platform fee", amount: { currency: "NGN", amount: fee } },
    ],
  };
  const breakdown = applyOutputVat(withFee, { treatment: "standard" }, POLICY);
  // VAT was ADDED on top: customerTotal = (subtotal+fee) + vat.
  const gross = breakdown.totals.customerTotal.amount;
  const expectedVat = Math.round((subtotal + fee) * 0.075);
  assert.equal(gross, subtotal + fee + expectedVat);

  const split = splitDocumentMoney(gross, breakdown);
  assert.equal(split.taxInclusive, false);
  assert.equal(split.feesMinor, fee);
  assert.equal(split.taxMinor, expectedVat);
  // base + fees + tax === total on the add-on path.
  assert.equal(split.subtotalMinor + split.feesMinor + split.taxMinor, gross);
  assert.equal(split.subtotalMinor, subtotal);
});

test("no tax line: subtotal = total, no VAT, reconciles", () => {
  const gross = 750_000;
  const split = splitDocumentMoney(gross, baseBreakdown(gross));
  assert.equal(split.taxMinor, 0);
  assert.equal(split.taxInclusive, false);
  assert.equal(split.taxTreatment, null);
  assert.equal(split.subtotalMinor, gross);
});

/* -------------------------------------------------------------------------- */
/*  buildReceiptProps — NRS structured-triad propagation                      */
/* -------------------------------------------------------------------------- */

test("buildReceiptProps: inclusive VAT props carry rate + treatment for the rated label", () => {
  const gross = 10_000_000;
  const breakdown = applyInclusiveVat(baseBreakdown(gross), { treatment: "standard" }, POLICY);
  const props = buildReceiptProps({ payment: payment(gross), breakdown, buyer: { name: "Test Buyer" }, locale: "en" });

  assert.equal(props.receipt.totalKobo, gross);
  assert.equal(props.receipt.taxRate, 0.075, "rate must flow to the receipt so it prints 'VAT (7.5%)'");
  assert.equal(props.receipt.taxTreatment, "standard");
  // The structured triad reconciles on the rendered receipt object.
  assert.equal((props.receipt.subtotalKobo ?? 0) + props.receipt.taxKobo, props.receipt.totalKobo);
  // Issuer VAT number is always present on a VATable document.
  assert.ok(props.issuer.vatNumber, "issuer VAT No. (TIN) must print on a VATable receipt");
});

test("buildReceiptProps: non-standard treatment override survives onto the props (classification note)", () => {
  // An exempt supply produces a breakdown with NO tax line (vatMinor=0), so the
  // caller passes the resolved treatment so a classification NOTE can still render.
  const gross = 4_000_000;
  const props = buildReceiptProps({
    payment: payment(gross),
    breakdown: baseBreakdown(gross),
    buyer: { name: "Test Buyer" },
    locale: "en",
    taxTreatment: "exempt",
  });
  assert.equal(props.receipt.taxKobo, 0);
  assert.equal(props.receipt.taxTreatment, "exempt");
  assert.equal(props.receipt.totalKobo, gross);
});
