import { test } from "node:test";
import assert from "node:assert/strict";
import { MOTION } from "./motion";
import { interpolate } from "./labels";
import { defaultCurrencyFormatter } from "./pricing";

test("MOTION encodes the doctrine 98% press feedback and 600ms joy envelope", () => {
  assert.equal(MOTION.cta.pressScale, 0.98);
  assert.equal(MOTION.joy.envelopeMs, 600);
  assert.equal(MOTION.cta.successMs, 1500);
});

test("interpolate fills named tokens", () => {
  assert.equal(
    interpolate("Booked with {subject} for {when}", { subject: "Adaeze", when: "Saturday 10am" }),
    "Booked with Adaeze for Saturday 10am",
  );
});

test("interpolate leaves unknown tokens intact (never renders 'undefined')", () => {
  assert.equal(interpolate("Hi {name}", {}), "Hi {name}");
});

test("default currency formatter renders minor units honestly", () => {
  const out = defaultCurrencyFormatter(123456, "NGN"); // 1,234.56
  assert.match(out, /1,234/);
});
