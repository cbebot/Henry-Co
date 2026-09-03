import { test } from "node:test";
import assert from "node:assert/strict";

import { resolveDealSubmissionStatus } from "../approval";

/**
 * V3-35 gate — approval rides the V3-25 moderation framework, mapped onto the
 * deal lifecycle with a FAIL-CLOSED floor: auto-approval requires BOTH an
 * explicit moderation approve AND in-envelope terms; everything else queues
 * for staff or is rejected outright.
 */

test("V3-35 approval: moderation reject ⇒ rejected regardless of terms", () => {
  assert.equal(
    resolveDealSubmissionStatus({ moderation: "reject", withinAutoApprove: true }),
    "rejected",
  );
  assert.equal(
    resolveDealSubmissionStatus({ moderation: "reject", withinAutoApprove: false }),
    "rejected",
  );
});

test("V3-35 approval: moderation hold ⇒ staff queue regardless of terms", () => {
  assert.equal(
    resolveDealSubmissionStatus({ moderation: "hold", withinAutoApprove: true }),
    "pending_review",
  );
  assert.equal(
    resolveDealSubmissionStatus({ moderation: "hold", withinAutoApprove: false }),
    "pending_review",
  );
});

test("V3-35 approval: approve + in-envelope terms ⇒ auto-approved", () => {
  assert.equal(
    resolveDealSubmissionStatus({ moderation: "approve", withinAutoApprove: true }),
    "approved",
  );
});

test("V3-35 approval: approve + out-of-envelope terms ⇒ staff review", () => {
  assert.equal(
    resolveDealSubmissionStatus({ moderation: "approve", withinAutoApprove: false }),
    "pending_review",
  );
});

test("V3-35 approval: unknown moderation verdict fails CLOSED to staff review", () => {
  assert.equal(
    resolveDealSubmissionStatus({
      moderation: "definitely-fine" as unknown as "approve",
      withinAutoApprove: true,
    }),
    "pending_review",
  );
});
