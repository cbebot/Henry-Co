import { test } from "node:test";
import assert from "node:assert/strict";
import { clipBody, screenMessageBody } from "../screen-message";

// The screen is a pure function of the text — it runs identically whether the
// candidate or the employer sent the message. We exercise each adversarial input
// "as the candidate" and "as the employer" (same call, twice) to make the
// direction-agnostic guarantee explicit: neither side can leak a contact detail
// to the other. Jobs is NOT identity-minimized (names are visible in a hiring
// conversation) but contact details must stay inside Henry & Co.
function bothDirections(text: string) {
  return [screenMessageBody(text), screenMessageBody(text)] as const;
}

test("blocks a phone number (candidate- and employer-sent)", () => {
  for (const verdict of bothDirections("Call me on 0801 234 5678 to set up the interview")) {
    assert.equal(verdict.action, "block");
  }
});

test("blocks an email address (candidate- and employer-sent)", () => {
  for (const verdict of bothDirections("Email me at jane.doe@gmail.com and we'll arrange it")) {
    assert.equal(verdict.action, "block");
  }
});

test("blocks an off-platform contact attempt (candidate- and employer-sent)", () => {
  for (const verdict of bothDirections("Please contact me outside the platform")) {
    assert.equal(verdict.action, "block");
  }
});

test("masks a medium social handle (returns masked body, not original)", () => {
  const verdict = screenMessageBody("ping me @janedev for the rest");
  assert.equal(verdict.action, "mask");
  assert.notEqual(verdict.body, "ping me @janedev for the rest");
  assert.match(verdict.body, /@\*\*\*/);
});

test("masks a medium off-platform link (returns masked body, not original)", () => {
  const verdict = screenMessageBody("Check t.me/janedev for details");
  assert.equal(verdict.action, "mask");
  assert.notEqual(verdict.body, "Check t.me/janedev for details");
  assert.match(verdict.body, /\[link removed\]/);
});

test("allows clean text unchanged", () => {
  const clean = "Thanks for applying — are you available for a video interview on Friday?";
  const verdict = screenMessageBody(clean);
  assert.equal(verdict.action, "allow");
  assert.equal(verdict.body, clean);
});

test("clipBody clamps an oversized body to 8000 chars and leaves a normal one intact", () => {
  const huge = "a".repeat(20000);
  assert.equal(clipBody(huge).length, 8000);
  const normal = "Are you available for a video interview on Friday?";
  assert.equal(clipBody(normal), normal);
  assert.equal(clipBody(""), "");
  // CRLF is normalized so the limit is content-based, not line-ending-inflated.
  assert.equal(clipBody("line1\r\nline2"), "line1\nline2");
});
