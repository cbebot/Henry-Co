/**
 * V3-13 mock e2e harness — a runnable end-to-end proof of the money triad
 * against the in-memory store + MockProvider, with no database and no live SDK.
 *
 * Proves, in one runnable script:
 *   A1        idempotent create (same idempotency key ⇒ same intent, count stays 1)
 *   route+P9  route via the real createPaymentRouter ⇒ a server-side
 *             providerReference, while the client-facing clientAction names no
 *             provider (ANTI-CLONE Principle 9)
 *   A2        illegal transition rejected (pending ⇏ succeeded)
 *   A3        webhook applied once; a duplicate delivery is an idempotent no-op
 *
 * The unit suite (`pnpm --filter @henryco/payment-router test`) is the exhaustive
 * gate; this harness is the human-runnable smoke that wires the same pieces
 * together the way the account routes do.
 *
 * Run: pnpm --filter @henryco/payment-router exec tsx scripts/mock-payment-webhook.mjs
 * Exits 0 when every check passes, 1 otherwise.
 */

// Read at CALL time by createPaymentRouter (router.ts), not at import time — so
// setting it here, after the hoisted imports, still lands before the route call.
process.env.MOCK_PAYMENT = "1";

import { createPaymentRouter, MockProvider } from "../src/index.ts";
import { InMemoryPaymentStore } from "../src/testing/in-memory-payment-store.ts";

let failed = false;
function check(label, condition) {
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
  if (!condition) failed = true;
}

const store = new InMemoryPaymentStore();
const secret = "mock_e2e_secret";

// ── A1 — idempotent create ────────────────────────────────────────────────
const created = store.createIntent({
  userId: "u1", amountMinor: 50_000, currency: "NGN",
  country: "NG", method: "card", idempotencyKey: "e2e-1",
});
check("A1 create succeeds", created.ok);
if (!created.ok) process.exit(1);
const intentId = created.value.id;

const replay = store.createIntent({
  userId: "u1", amountMinor: 50_000, currency: "NGN",
  country: "NG", method: "card", idempotencyKey: "e2e-1",
});
check("A1 replay returns the same intent", replay.ok && replay.value.id === intentId);
check("A1 no duplicate row created (count === 1)", store.count() === 1);

// ── route + Principle 9 ───────────────────────────────────────────────────
const router = createPaymentRouter();
const routed = await router.route({
  intentId, amountMinor: 50_000, currency: "NGN",
  country: "NG", method: "card", idempotencyKey: "e2e-1",
});
check("route resolves a provider for NG/card", routed.ok);
if (routed.ok) {
  const clientFacing = JSON.stringify(routed.value.clientAction).toLowerCase();
  const leaks = ["mock", "paystack", "flutterwave", "stripe"].some((name) =>
    clientFacing.includes(name),
  );
  check("Principle 9: client-facing clientAction names no provider", !leaks);
  check("provider reference is recorded server-side", Boolean(routed.value.providerReference));
}

// ── A2 — legal transitions ────────────────────────────────────────────────
const illegal = store.transition(intentId, "succeeded"); // pending ⇏ succeeded
check("A2 illegal transition rejected (pending → succeeded)", !illegal.ok);
const advanced = store.transition(intentId, "processing"); // pending → processing
check("A2 legal transition accepted (pending → processing)", advanced.ok);

// ── A3 — webhook dedup (insert-first / effect-second) ─────────────────────
const body = JSON.stringify({
  id: "evt_e2e_1", type: "charge.success",
  reference: `mock_${intentId}`, status: "succeeded",
});
const signature = MockProvider.sign(body, secret);
const adapter = new MockProvider();
const verified = await adapter.verifyWebhook({ rawBody: body, signature, secret });
check("webhook signature verifies", verified.ok);
if (!verified.ok) process.exit(1);

const firstDelivery = store.applyWebhook({
  provider: "mock", providerEventId: verified.value.providerEventId,
  intentId, impliedStatus: "succeeded",
});
const duplicateDelivery = store.applyWebhook({
  provider: "mock", providerEventId: verified.value.providerEventId,
  intentId, impliedStatus: "succeeded",
});
check("A3 first delivery applies the effect", firstDelivery.ok && firstDelivery.value.applied);
check("A3 duplicate delivery is an idempotent no-op", duplicateDelivery.ok && !duplicateDelivery.value.applied);
check("A3 final status is succeeded (effect applied exactly once)", store.getIntent(intentId)?.status === "succeeded");

// ── verdict ───────────────────────────────────────────────────────────────
console.log(failed ? "\nFAIL mock e2e" : "\nPASS mock e2e (A1 · route+P9 · A2 · A3 dedup)");
process.exit(failed ? 1 : 0);
