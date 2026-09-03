import { test } from "node:test";
import assert from "node:assert/strict";

import {
  resolvePublicAccountIdentity,
  shortNameForChip,
} from "../public/account-identity";

// The chip trigger shows ONE name part (a full name overflows the ≤64px
// mobile chrome); the dropdown identity header keeps the full name.

test("shortNameForChip takes the first name part", () => {
  assert.equal(shortNameForChip("Onah Chukwuemeka Blessed"), "Onah");
  assert.equal(shortNameForChip("Ada Obi"), "Ada");
  assert.equal(shortNameForChip("Ada"), "Ada");
});

test("shortNameForChip falls back past bare initials", () => {
  assert.equal(shortNameForChip("J. Chukwuemeka"), "Chukwuemeka");
  assert.equal(shortNameForChip("A B Chukwuemeka"), "Chukwuemeka");
});

test("shortNameForChip tolerates messy input", () => {
  assert.equal(shortNameForChip("  Onah   Blessed  "), "Onah");
  assert.equal(shortNameForChip(""), "");
});

test("resolvePublicAccountIdentity keeps the full primaryLabel and adds chipLabel", () => {
  const id = resolvePublicAccountIdentity({
    displayName: "Onah Chukwuemeka Blessed",
    email: "onah@example.com",
  });
  assert.equal(id.primaryLabel, "Onah Chukwuemeka Blessed");
  assert.equal(id.chipLabel, "Onah");
  assert.equal(id.emailLine, "onah@example.com");
});

test("email-derived identities also get a single-part chip label", () => {
  const id = resolvePublicAccountIdentity({
    displayName: "",
    email: "john.doe@example.com",
  });
  assert.equal(id.primaryLabel, "John Doe");
  assert.equal(id.chipLabel, "John");
});
