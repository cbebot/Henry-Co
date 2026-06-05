import { test } from "node:test";
import assert from "node:assert/strict";

import { buildSignInSecurityLayout } from "./security-email-content";

const BASE = {
  brandName: "Henry Onyx",
  deviceSummary: "Chrome on Windows",
  locationSummary: "Lagos, Nigeria",
  whenLabel: "5 June 2026 · 14:32 WAT",
  reviewUrl: "https://account.henryonyx.com/security?review=evt-123",
} as const;

/**
 * The single most important guarantee of this email: it must never disclose
 * internal architecture or vendors to an attacker who triggered the alert, and
 * it must never leak the recipient's raw network identifiers. We assert against
 * the serialized layout (every string the email is built from).
 */
const FORBIDDEN = [
  "supabase",
  "postgres",
  "resend",
  "brevo",
  "vercel",
  "cloudinary",
  "onesignal",
  "fingerprint",
  "row-level",
  "rls",
  "edge function",
  "serverless",
  "cross division",
  "cross-division",
  "division", // our copy never frames account security as crossing divisions
  "ip address",
];

function serialize(layout: unknown): string {
  return JSON.stringify(layout).toLowerCase();
}

test("the layout is a security-purpose email naming the brand", () => {
  const layout = buildSignInSecurityLayout({ ...BASE, reason: "new_device" });
  assert.equal(layout.purpose, "security");
  assert.match(layout.subject.toLowerCase(), /sign-in/);
  assert.match(layout.subject, /Henry Onyx/);
});

test("the single CTA points at the authenticated review surface", () => {
  const layout = buildSignInSecurityLayout({ ...BASE, reason: "new_device" });
  assert.equal(layout.actionHref, BASE.reviewUrl);
  assert.ok(layout.actionLabel && layout.actionLabel.length > 0);
});

test("the facts appear as labelled sections (when + device + place)", () => {
  const layout = buildSignInSecurityLayout({ ...BASE, reason: "new_device_and_country" });
  const labels = (layout.sections ?? []).map((s) => s.label.toLowerCase());
  const values = (layout.sections ?? []).map((s) => s.value);
  assert.ok(labels.some((l) => l.includes("when")));
  assert.ok(labels.some((l) => l.includes("device")));
  assert.ok(values.includes("Chrome on Windows"));
  assert.ok(values.includes("Lagos, Nigeria"));
});

test("a missing location does not produce an empty or broken row", () => {
  const layout = buildSignInSecurityLayout({
    ...BASE,
    locationSummary: null,
    reason: "new_device",
  });
  for (const s of layout.sections ?? []) {
    assert.ok(s.value.trim().length > 0, `section ${s.label} must not be empty`);
  }
});

test("the reason tunes the headline (device / location / both)", () => {
  const device = buildSignInSecurityLayout({ ...BASE, reason: "new_device" });
  const country = buildSignInSecurityLayout({ ...BASE, reason: "new_country" });
  const both = buildSignInSecurityLayout({ ...BASE, reason: "new_device_and_country" });
  assert.match(String(device.highlightLabel).toLowerCase(), /device/);
  assert.match(String(country.highlightLabel).toLowerCase(), /location|place/);
  assert.match(String(both.highlightLabel).toLowerCase(), /device/);
  assert.match(String(both.highlightLabel).toLowerCase(), /location|place/);
});

test("NO build of this email leaks a vendor name, architecture, or raw IP", () => {
  for (const reason of ["new_device", "new_country", "new_device_and_country"] as const) {
    const withLoc = serialize(buildSignInSecurityLayout({ ...BASE, reason }));
    const noLoc = serialize(buildSignInSecurityLayout({ ...BASE, locationSummary: null, reason }));
    for (const term of FORBIDDEN) {
      assert.ok(!withLoc.includes(term), `forbidden term leaked (${reason}): ${term}`);
      assert.ok(!noLoc.includes(term), `forbidden term leaked (${reason}, no loc): ${term}`);
    }
  }
});

test("the email carries the single-use/expiry reassurance and a 'no action needed' note", () => {
  const layout = buildSignInSecurityLayout({ ...BASE, reason: "new_device" });
  assert.match(String(layout.secureNote).toLowerCase(), /single-use|secure/);
  assert.match(String(layout.footnote).toLowerCase(), /no action/);
});
