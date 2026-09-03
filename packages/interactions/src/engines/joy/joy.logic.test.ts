import { test } from "node:test";
import assert from "node:assert/strict";
import { joyContentFor, JOY_ENVELOPE_MS } from "./joy.logic";

const labels = {
  detailTemplate: "Booked with {subject} for {when} — we'll text reminders the day before",
};

test("joy envelope never exceeds 600ms (confetti is a tell of insecurity)", () => {
  const c = joyContentFor("care", { subject: "Adaeze", when: "Saturday 10am" }, labels);
  assert.ok(c.envelopeMs <= JOY_ENVELOPE_MS);
  assert.equal(c.envelopeMs, 600);
});

test("haptic is a single 10ms tap, never long", () => {
  assert.equal(joyContentFor("marketplace", {}, labels).hapticMs, 10);
});

test("care variant names subject + when via the injected template", () => {
  const c = joyContentFor("care", { subject: "Adaeze", when: "Saturday 10am" }, labels);
  assert.match(c.detail, /Adaeze/);
  assert.match(c.detail, /Saturday/);
});

test("missing outcome fields never render 'undefined'", () => {
  const c = joyContentFor("jobs", {}, { detailTemplate: "Application sent for {subject}" });
  assert.doesNotMatch(c.detail, /undefined/);
});
