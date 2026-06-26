import { test } from "node:test";
import assert from "node:assert/strict";
import { clipBody, screenMessageBody } from "../screen-message";

// The screen is a pure function of the text — it runs identically whether the
// buyer or the vendor sent the message. We exercise each adversarial input
// "as the buyer" and "as the vendor" (same call, twice) to make the
// direction-agnostic guarantee explicit: neither side can leak a contact detail
// to the other.
function bothDirections(text: string) {
  return [screenMessageBody(text), screenMessageBody(text)] as const;
}

test("blocks a phone number (buyer- and vendor-sent)", () => {
  for (const verdict of bothDirections("Call me on 0801 234 5678 to sort delivery")) {
    assert.equal(verdict.action, "block");
  }
});

test("blocks an email address (buyer- and vendor-sent)", () => {
  for (const verdict of bothDirections("Reach me at jane.doe@gmail.com and we'll sort it")) {
    assert.equal(verdict.action, "block");
  }
});

test("blocks an off-platform contact attempt (buyer- and vendor-sent)", () => {
  for (const verdict of bothDirections("Please contact me outside the platform")) {
    assert.equal(verdict.action, "block");
  }
});

test("masks a medium social handle (returns masked body, not original)", () => {
  const verdict = screenMessageBody("ping me @janestore for the rest");
  assert.equal(verdict.action, "mask");
  assert.notEqual(verdict.body, "ping me @janestore for the rest");
  assert.match(verdict.body, /@\*\*\*/);
});

test("masks a medium off-platform link (returns masked body, not original)", () => {
  const verdict = screenMessageBody("Check t.me/janestore for details");
  assert.equal(verdict.action, "mask");
  assert.notEqual(verdict.body, "Check t.me/janestore for details");
  assert.match(verdict.body, /\[link removed\]/);
});

test("allows clean text unchanged", () => {
  const clean = "Hi, is this still available and can you deliver to Lekki by Friday?";
  const verdict = screenMessageBody(clean);
  assert.equal(verdict.action, "allow");
  assert.equal(verdict.body, clean);
});

test("clipBody clamps an oversized body to 8000 chars and leaves a normal one intact", () => {
  const huge = "a".repeat(20000);
  assert.equal(clipBody(huge).length, 8000);
  const normal = "Hi, can you deliver to Lekki by Friday?";
  assert.equal(clipBody(normal), normal);
  assert.equal(clipBody(""), "");
  // CRLF is normalized so the limit is content-based, not line-ending-inflated.
  assert.equal(clipBody("line1\r\nline2"), "line1\nline2");
});
