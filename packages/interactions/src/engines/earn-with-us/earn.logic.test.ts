import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldShowInvite } from "./earn.logic";

test("shown to a demand-side user not enrolled in the role", () => {
  assert.equal(shouldShowInvite("care_provider", []), true);
  assert.equal(shouldShowInvite("care_provider", ["marketplace_seller"]), true);
});

test("never shown to a user already enrolled as that role", () => {
  assert.equal(shouldShowInvite("care_provider", ["care_provider"]), false);
});

test("empty role → never shown (nothing to invite into)", () => {
  assert.equal(shouldShowInvite("", []), false);
});
