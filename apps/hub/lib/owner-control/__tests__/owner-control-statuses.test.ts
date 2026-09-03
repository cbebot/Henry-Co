import test from "node:test";
import assert from "node:assert/strict";

import {
  SELLER_APPLICATION_PENDING,
  VENDOR_LIFECYCLE,
  PRODUCT_REVIEW_PENDING,
  KYC_PENDING,
  TEACHER_APPLICATION_PENDING,
  MODERATION_PENDING,
  DISPUTE_OPEN,
} from "../statuses";

/**
 * V3-OWNER-CONTROL-01 — the status vocabularies hold their shape.
 *
 * `statuses.ts` is the file this pass added after discovering that its own
 * queues filtered on status values nothing in the repository writes
 * (`pending` and `flagged` on listings, `in_review` on teaching applications).
 * A wrong column name raises 42703 and somebody notices; a wrong status VALUE
 * returns zero rows and renders "nothing is waiting for review" forever. That
 * is a console which lies quietly, and it is the exact failure that sent the
 * owner to the SQL editor to approve two sellers by hand.
 *
 * These assertions cannot prove a value is real — only a human reading the
 * writer can, which is why every set in that file carries its citation. What
 * they CAN prove is the mechanical properties that make a set usable at all,
 * and the one that actually bit: casing.
 */

const ALL_SETS: ReadonlyArray<readonly [string, readonly string[]]> = [
  ["SELLER_APPLICATION_PENDING", SELLER_APPLICATION_PENDING],
  ["VENDOR_LIFECYCLE", VENDOR_LIFECYCLE],
  ["PRODUCT_REVIEW_PENDING", PRODUCT_REVIEW_PENDING],
  ["KYC_PENDING", KYC_PENDING],
  ["TEACHER_APPLICATION_PENDING", TEACHER_APPLICATION_PENDING],
  ["MODERATION_PENDING", MODERATION_PENDING],
  ["DISPUTE_OPEN", DISPUTE_OPEN],
];

test("V3-OWNER-CONTROL-01: status vocabularies", async (t) => {
  await t.test("every set is non-empty", () => {
    for (const [name, values] of ALL_SETS) {
      assert.ok(
        values.length > 0,
        `${name} is empty — an empty .in() filter matches no rows, so the queue ` +
          `would render as permanently drained rather than as broken.`,
      );
    }
  });

  await t.test("every value is already lowercase and trimmed", () => {
    // NOT cosmetic. The action route normalises live entity state with
    // `state.status.trim().toLowerCase()` and then tests
    // `action.fromStates.includes(currentStatus)`. `includes` is exact. So a
    // fromStates entry carrying an uppercase character or stray whitespace can
    // never match any real row: the owner sees the button, presses it, and the
    // server answers 409 "that record has already moved on" about a record that
    // has not moved at all.
    for (const [name, values] of ALL_SETS) {
      for (const value of values) {
        assert.equal(
          value,
          value.trim().toLowerCase(),
          `${name} contains "${value}", which is not already normalised. The route ` +
            `lowercases live status before an exact includes() test, so this value ` +
            `is unmatchable and its action is unpressable.`,
        );
      }
    }
  });

  await t.test("no set repeats a value", () => {
    for (const [name, values] of ALL_SETS) {
      assert.equal(
        new Set(values).size,
        values.length,
        `${name} repeats a value — harmless in an .in() filter, but it means the ` +
          `list was edited by appending rather than by reading, which is how the ` +
          `invented statuses got in.`,
      );
    }
  });

  await t.test("no set contains a value that is obviously a verdict, not a backlog", () => {
    // A PENDING set naming a terminal verdict means the queue re-lists work it
    // has already finished — an approvals screen that never drains. VENDOR_
    // LIFECYCLE is deliberately exempt: it lists live and suspended stores on
    // purpose, because it is a control surface rather than a backlog.
    const TERMINAL = new Set(["approved", "rejected", "actioned", "dismissed", "resolved"]);
    const backlogs = ALL_SETS.filter(([name]) => name !== "VENDOR_LIFECYCLE");
    for (const [name, values] of backlogs) {
      for (const value of values) {
        assert.ok(
          !TERMINAL.has(value),
          `${name} lists the terminal status "${value}". A backlog that includes its ` +
            `own verdicts never empties.`,
        );
      }
    }
  });

  await t.test("VENDOR_LIFECYCLE is exactly the two states the owner can toggle between", () => {
    // The suspend action goes approved -> suspended and reinstate goes back.
    // Listing a third state here would render a store row whose two buttons are
    // both illegal from where it stands.
    assert.deepEqual([...VENDOR_LIFECYCLE].sort(), ["approved", "suspended"]);
  });

  await t.test("SELLER_APPLICATION_PENDING excludes draft", () => {
    // Approving a draft opens a store its owner never asked to open. This is
    // the one exclusion in the file that is a product decision rather than a
    // reading of what the writers write.
    assert.ok(
      !SELLER_APPLICATION_PENDING.includes("draft" as never),
      "draft must never be approvable — the seller has not submitted anything yet.",
    );
  });

  await t.test("PRODUCT_REVIEW_PENDING carries under_review", () => {
    // `under_review` is what governance.ts assigns when a listing trips manual
    // review (risk >= 35, quality < 68, or a strict-moderation seller). Those
    // are precisely the listings an owner most needs to see, and they are the
    // ones the original ["pending","flagged"] filter dropped.
    assert.ok(
      PRODUCT_REVIEW_PENDING.includes("under_review" as never),
      "listings held for manual review must appear in the owner's queue.",
    );
  });
});
