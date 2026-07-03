import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { approvalStatusLabel, listingGuidance } from "./listing-guidance";

const t = (label: string) => label;

describe("approvalStatusLabel — humanized listing states", () => {
  it("maps every approval state to human copy", () => {
    assert.equal(approvalStatusLabel("draft", t), "Draft");
    assert.equal(approvalStatusLabel("submitted", t), "Submitted");
    assert.equal(approvalStatusLabel("under_review", t), "Under review");
    assert.equal(approvalStatusLabel("approved", t), "Live");
    assert.equal(approvalStatusLabel("changes_requested", t), "Changes requested");
    assert.equal(approvalStatusLabel("rejected", t), "Rejected");
  });
});

describe("listingGuidance — governance thresholds as human copy", () => {
  it("flags risk review at the governance threshold (riskScore >= 35)", () => {
    assert.match(listingGuidance({ qualityScore: 90, riskScore: 35 }, t), /risk review/i);
    assert.doesNotMatch(listingGuidance({ qualityScore: 90, riskScore: 34 }, t), /risk review/i);
  });
  it("recognises the high-quality badge threshold (qualityScore >= 80)", () => {
    assert.match(listingGuidance({ qualityScore: 80, riskScore: 0 }, t), /Strong listing/);
  });
  it("marks the manual-review band (qualityScore < 68) as needing detail", () => {
    assert.match(listingGuidance({ qualityScore: 67, riskScore: 0 }, t), /Needs more detail/);
    assert.match(listingGuidance({ qualityScore: 68, riskScore: 0 }, t), /Solid listing/);
  });
  it("handles unassessed drafts and stringly-typed scores", () => {
    assert.match(listingGuidance({}, t), /Not yet assessed/);
    assert.match(listingGuidance({ qualityScore: "72", riskScore: "10" }, t), /Solid listing/);
  });
});
