import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sectionsNeedingAttention } from "@/lib/studio/brief-attention";

describe("sectionsNeedingAttention — copilot doubts become open cards", () => {
  it("routes the copilot's stock uncertainties to the right sections", () => {
    const attention = sectionsNeedingAttention([
      "Confirm budget range.",
      "Confirm launch deadline and priority features.",
      "Confirm preferred technology stack.",
    ]);
    assert.equal(attention.business, "Confirm budget range.");
    assert.equal(attention.stack, "Confirm preferred technology stack.");
    // "deadline" wins the business rule but business is already taken by the
    // first uncertainty — first match per section is kept.
    assert.ok(attention.business);
  });

  it("routes scope and domain doubts", () => {
    const attention = sectionsNeedingAttention([
      "Which pages does the checkout need?",
      "Is the .com web address settled?",
    ]);
    assert.equal(attention.scope, "Which pages does the checkout need?");
    assert.equal(attention.domain, "Is the .com web address settled?");
  });

  it("drops vague doubts instead of opening random cards", () => {
    const attention = sectionsNeedingAttention(["Hmm, several unknowns remain."]);
    assert.deepEqual(attention, {});
  });

  it("handles empty and junk input", () => {
    assert.deepEqual(sectionsNeedingAttention([]), {});
    assert.deepEqual(sectionsNeedingAttention(["", "   "]), {});
  });
});
