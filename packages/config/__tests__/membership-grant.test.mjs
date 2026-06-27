// V3-FIX-EMAIL-OR-SEEDS — behavioural contract for the role-membership grant
// predicate that closes the email-only privilege-escalation class. Imports the
// real TypeScript (Node 24 strips types) so the rule is verified by EXECUTION.
//
// Rule under test:
//   A membership row grants its role to a viewer iff it is active AND
//     - it is bound to the viewer's user_id, OR
//     - it is UNCLAIMED (user_id null) AND the viewer's email is VERIFIED and
//       equal to the row's normalized_email.
//   A row bound to a different user is never matched by email.

import { test } from "node:test";
import assert from "node:assert/strict";
import { membershipGrantsViewer, filterGrantedMemberships } from "../membership-grant.ts";

const VIEWER = {
  userId: "user-1",
  normalizedEmail: "staff@henryonyx.com",
  emailVerified: true,
};

test("inactive row never grants, even when user_id matches", () => {
  assert.equal(
    membershipGrantsViewer(
      { user_id: "user-1", normalized_email: "staff@henryonyx.com", is_active: false },
      VIEWER
    ),
    false
  );
});

test("active row bound to the viewer's user_id grants", () => {
  assert.equal(
    membershipGrantsViewer({ user_id: "user-1", normalized_email: null, is_active: true }, VIEWER),
    true
  );
});

test("active row bound to a DIFFERENT user does not grant, even if email matches", () => {
  assert.equal(
    membershipGrantsViewer(
      { user_id: "someone-else", normalized_email: "staff@henryonyx.com", is_active: true },
      VIEWER
    ),
    false
  );
});

test("unclaimed seed (user_id null) grants when the email matches AND is verified", () => {
  assert.equal(
    membershipGrantsViewer(
      { user_id: null, normalized_email: "staff@henryonyx.com", is_active: true },
      VIEWER
    ),
    true
  );
});

test("unclaimed seed does NOT grant when the viewer's email is unverified (the core fix)", () => {
  assert.equal(
    membershipGrantsViewer(
      { user_id: null, normalized_email: "staff@henryonyx.com", is_active: true },
      { ...VIEWER, emailVerified: false }
    ),
    false
  );
});

test("unclaimed seed does not grant when the emails differ", () => {
  assert.equal(
    membershipGrantsViewer(
      { user_id: null, normalized_email: "other@henryonyx.com", is_active: true },
      VIEWER
    ),
    false
  );
});

test("unclaimed seed does not grant when the viewer has no email", () => {
  assert.equal(
    membershipGrantsViewer(
      { user_id: null, normalized_email: "staff@henryonyx.com", is_active: true },
      { ...VIEWER, normalizedEmail: null }
    ),
    false
  );
});

test("missing is_active (undefined) is treated as active for a user_id match", () => {
  assert.equal(
    membershipGrantsViewer({ user_id: "user-1", normalized_email: null }, VIEWER),
    true
  );
});

test("filterGrantedMemberships keeps only rows that grant", () => {
  const rows = [
    { id: "a", user_id: "user-1", normalized_email: null, is_active: true },
    { id: "b", user_id: null, normalized_email: "staff@henryonyx.com", is_active: true },
    { id: "c", user_id: "someone-else", normalized_email: "staff@henryonyx.com", is_active: true },
    { id: "d", user_id: null, normalized_email: "staff@henryonyx.com", is_active: false },
  ];
  const granted = filterGrantedMemberships(rows, VIEWER);
  assert.deepEqual(
    granted.map((r) => r.id),
    ["a", "b"]
  );
});
