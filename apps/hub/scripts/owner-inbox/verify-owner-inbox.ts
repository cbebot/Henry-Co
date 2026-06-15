/**
 * Proof harness for the owner-inbox trust boundary (run with tsx).
 *   pnpm dlx tsx apps/hub/scripts/owner-inbox/verify-owner-inbox.ts
 *
 * Verifies the pure, security-critical logic: HMAC signing/verification (incl.
 * tamper + replay), idempotency key, payload validation, body sanitization,
 * and row mapping. No DB / network — deterministic.
 */
import {
  signInboundPayload,
  verifyInboundSignature,
  isFreshTimestamp,
} from "../../lib/owner-inbox/signature";
import {
  parseInboundPayload,
  computeDedupeKey,
  buildEmailInsert,
  inboundEmailPayloadSchema,
} from "../../lib/owner-inbox/payload";
import { sanitizeEmailHtml, htmlToText, buildSnippet } from "../../lib/owner-inbox/sanitize";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) {
    passed++;
    console.log("  ✓", name);
  } else {
    failed++;
    console.error("  ✗ FAIL:", name);
  }
}

const SECRET = "test-secret-deadbeefcafef00d";
const now = 1_750_000_000_000; // fixed ms
const ts = Math.floor(now / 1000).toString();

console.log("\n[1] HMAC signing + verification");
{
  const body = JSON.stringify({ a: 1, b: "two" });
  const sig = signInboundPayload(SECRET, ts, body);
  check("valid signature verifies", verifyInboundSignature({ secret: SECRET, timestamp: ts, signature: sig, rawBody: body, now }).ok);
  check(
    "sha256= prefix tolerated",
    verifyInboundSignature({ secret: SECRET, timestamp: ts, signature: `sha256=${sig}`, rawBody: body, now }).ok,
  );
  const tampered = verifyInboundSignature({ secret: SECRET, timestamp: ts, signature: sig, rawBody: body + "x", now });
  check("tampered body rejected", !tampered.ok && tampered.reason === "bad_signature");
  const wrongSecret = verifyInboundSignature({ secret: "other", timestamp: ts, signature: sig, rawBody: body, now });
  check("wrong secret rejected", !wrongSecret.ok && wrongSecret.reason === "bad_signature");
  const stale = verifyInboundSignature({ secret: SECRET, timestamp: "1000", signature: sig, rawBody: body, now });
  check("stale timestamp rejected (replay guard)", !stale.ok && stale.reason === "stale_timestamp");
  const noHeaders = verifyInboundSignature({ secret: SECRET, timestamp: "", signature: "", rawBody: body, now });
  check("missing headers rejected", !noHeaders.ok && noHeaders.reason === "headers_missing");
  const noSecret = verifyInboundSignature({ secret: "", timestamp: ts, signature: sig, rawBody: body, now });
  check("missing secret rejected", !noSecret.ok && noSecret.reason === "secret_missing");
  check("freshness window honored", isFreshTimestamp(ts, 300, now) && !isFreshTimestamp("1", 300, now));
}

console.log("\n[2] Idempotency key");
{
  const base = inboundEmailPayloadSchema.parse({ fromAddress: "a@x.com", toAddress: "support@henryonyx.com", messageId: "<abc@x.com>" });
  check("message-id keyed", computeDedupeKey(base) === "mid:<abc@x.com>");
  check("stable across calls", computeDedupeKey(base) === computeDedupeKey(base));
  const noMid = inboundEmailPayloadSchema.parse({ fromAddress: "a@x.com", toAddress: "support@henryonyx.com", subject: "Hi", date: "2026-06-15T10:00:00Z", sizeBytes: 42 });
  const k1 = computeDedupeKey(noMid);
  check("content hash when no message-id", k1.startsWith("hash:") && k1.length > 10);
  const noMid2 = inboundEmailPayloadSchema.parse({ fromAddress: "a@x.com", toAddress: "support@henryonyx.com", subject: "Different", date: "2026-06-15T10:00:00Z", sizeBytes: 42 });
  check("different content -> different hash", computeDedupeKey(noMid2) !== k1);
}

console.log("\n[3] Payload validation");
{
  const good = parseInboundPayload({ fromAddress: "Sender@X.com", toAddress: "Contact@HenryOnyx.com", subject: "Hello" });
  check("valid payload accepted", good.ok);
  const noFrom = parseInboundPayload({ toAddress: "support@henryonyx.com" });
  check("missing from rejected", !noFrom.ok);
  const noTo = parseInboundPayload({ fromAddress: "a@x.com" });
  check("missing to rejected", !noTo.ok);
  const headerToFallback = parseInboundPayload({ fromAddress: "a@x.com", headerTo: "owner@henryonyx.com" });
  check("headerTo used when envelope toAddress absent", headerToFallback.ok);
  const junk = parseInboundPayload("not an object");
  check("non-object rejected", !junk.ok);
}

console.log("\n[4] Row mapping + sanitization integration");
{
  const parsed = parseInboundPayload({
    fromAddress: "Customer@Example.com",
    fromName: "Jane Customer",
    toAddress: "Support@HenryOnyx.com",
    subject: "Need help",
    text: "Hello there, please help.",
    html: `<p>Hello there</p><script>steal()</script><a href="javascript:evil()">x</a><img src=x onerror="hack()">`,
    date: "2026-06-15T09:30:00Z",
    dmarc: "fail",
    attachments: [
      { filename: "a.pdf", contentType: "application/pdf", sizeBytes: 100, captured: true, contentBase64: "AAAA" },
      { filename: "big.zip", contentType: "application/zip", sizeBytes: 99999999, captured: false, contentBase64: null },
    ],
  });
  if (!parsed.ok) throw new Error("expected ok payload");
  const row = buildEmailInsert(parsed.payload, new Date(now).toISOString());
  check("to_address lowercased", row.to_address === "support@henryonyx.com");
  check("from_address lowercased", row.from_address === "customer@example.com");
  check("html sanitized: no <script>", !/<script/i.test(row.html_body ?? ""));
  check("html sanitized: no onerror", !/onerror/i.test(row.html_body ?? ""));
  check("html sanitized: javascript: neutralized", !/href=["']?javascript:/i.test(row.html_body ?? ""));
  check("snippet derived from text", (row.snippet ?? "").startsWith("Hello there"));
  check("attachment count = 2", row.attachment_count === 2);
  check("has_attachments true", row.has_attachments === true);
  check("attachments_truncated true (one not captured)", row.attachments_truncated === true);
  check("dmarc=fail -> is_spam", row.is_spam === true);
  check("sent_at parsed to ISO", row.sent_at === new Date("2026-06-15T09:30:00Z").toISOString());
}

console.log("\n[5] Sanitizer units");
{
  check("strips script block", sanitizeEmailHtml("<b>ok</b><script>x()</script>") === "<b>ok</b>");
  check("strips iframe", !/iframe/i.test(sanitizeEmailHtml('<iframe src="evil"></iframe><p>hi</p>')));
  check("strips on* handlers", !/onclick/i.test(sanitizeEmailHtml('<div onclick="x()">hi</div>')));
  check("keeps safe anchor", /href=/i.test(sanitizeEmailHtml('<a href="https://ok.com">ok</a>')));
  check("htmlToText collapses", htmlToText("<p>Hello</p><p>World</p>").includes("Hello"));
  check("snippet truncates long", buildSnippet("x".repeat(500), null).endsWith("…"));
  check("snippet from html when no text", buildSnippet(null, "<p>From html</p>").includes("From html"));
}

console.log(`\n${"=".repeat(48)}\nowner-inbox verify: ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
