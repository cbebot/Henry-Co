import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALL_MODERATION_REASONS,
  ALL_CONTENT_TYPES,
  ALL_DECISIONS,
  ALL_SCANNERS,
  REPORT_REASON_CODES,
  REPORT_STATUSES,
} from "../reasons";

describe("catalogs are well-formed", () => {
  it("reason codes are unique", () => {
    assert.equal(new Set(ALL_MODERATION_REASONS).size, ALL_MODERATION_REASONS.length);
  });
  it("includes the AI-flagged family", () => {
    for (const r of ["ai_flagged_scam", "ai_flagged_nsfw", "ai_flagged_abuse", "ai_flagged_other"]) {
      assert.ok(ALL_MODERATION_REASONS.includes(r as (typeof ALL_MODERATION_REASONS)[number]));
    }
  });
  it("includes the deterministic family", () => {
    for (const r of ["banned_goods", "hate_speech", "profanity", "pii_leak", "off_platform_contact", "scam_suspected", "image_hash_match"]) {
      assert.ok(ALL_MODERATION_REASONS.includes(r as (typeof ALL_MODERATION_REASONS)[number]));
    }
  });
  it("has the four content domains", () => {
    assert.deepEqual([...ALL_CONTENT_TYPES].sort(), ["job_post", "marketplace_listing", "service_profile", "studio_brief"]);
  });
  it("has the three decisions", () => {
    assert.deepEqual([...ALL_DECISIONS], ["approve", "hold", "reject"]);
  });
  it("has the three scanners", () => {
    assert.deepEqual([...ALL_SCANNERS], ["deterministic_rule", "ai_check", "manual"]);
  });
  it("report reason codes are unique and non-empty", () => {
    assert.ok(REPORT_REASON_CODES.length >= 5);
    assert.equal(new Set(REPORT_REASON_CODES).size, REPORT_REASON_CODES.length);
  });
  it("report statuses match the migration CHECK vocab", () => {
    assert.deepEqual([...REPORT_STATUSES], ["open", "reviewing", "resolved", "dismissed"]);
  });
});
