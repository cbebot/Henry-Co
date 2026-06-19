import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { trackEvent, type AnalyticsSink, type HenryEventEnvelope } from "@henryco/intelligence";
import {
  MODERATION_EVENTS,
  divisionForContentType,
  buildScanEvent,
  buildReportFiledEvent,
  buildStaffOverrideEvent,
} from "../telemetry";

// Capturing sink: trackEvent silently DROPS invalid envelopes, so if the sink
// receives the event, it passed the canonical henryEventEnvelopeSchema.
function capture(): { sink: AnalyticsSink; events: HenryEventEnvelope[] } {
  const events: HenryEventEnvelope[] = [];
  return { sink: { emit: (e) => void events.push(e) }, events };
}

function stamp(input: Omit<HenryEventEnvelope, "version" | "occurredAt">): HenryEventEnvelope {
  return { ...input, version: "1", occurredAt: new Date().toISOString() } as HenryEventEnvelope;
}

describe("event names match the henry.<domain>.<noun>.<verb> grammar", () => {
  const re = /^henry\.[a-z0-9_]+\.[a-z0-9_]+\.[a-z0-9_]+$/;
  for (const [k, v] of Object.entries(MODERATION_EVENTS)) {
    it(`${k} = ${v}`, () => assert.match(v, re));
  }
});

describe("divisionForContentType maps to valid divisions", () => {
  it("marketplace", () => assert.equal(divisionForContentType("marketplace_listing"), "marketplace"));
  it("jobs", () => assert.equal(divisionForContentType("job_post"), "jobs"));
  it("studio", () => assert.equal(divisionForContentType("studio_brief"), "studio"));
  it("care", () => assert.equal(divisionForContentType("service_profile"), "care"));
});

describe("built envelopes pass the canonical schema (via trackEvent)", () => {
  it("scan event (held) validates", () => {
    const { sink, events } = capture();
    trackEvent(
      sink,
      stamp(
        buildScanEvent({
          contentType: "marketplace_listing",
          contentId: "c1",
          decision: "hold",
          scanner: "deterministic_rule",
          reasons: ["pii_leak"],
          latencyMs: 12,
        }),
      ),
    );
    assert.equal(events.length, 1);
    assert.equal(events[0].name, MODERATION_EVENTS.held);
    assert.ok(!JSON.stringify(events[0]).includes("08031234567"));
  });
  it("scan event names rejected/held/scanned by decision", () => {
    assert.equal(buildScanEvent({ contentType: "job_post", contentId: "j", decision: "reject", scanner: "deterministic_rule", reasons: ["banned_goods"], latencyMs: 1 }).name, MODERATION_EVENTS.rejected);
    assert.equal(buildScanEvent({ contentType: "job_post", contentId: "j", decision: "approve", scanner: "deterministic_rule", reasons: [], latencyMs: 1 }).name, MODERATION_EVENTS.scanned);
  });
  it("report-filed event validates", () => {
    const { sink, events } = capture();
    trackEvent(sink, stamp(buildReportFiledEvent({ contentType: "studio_brief", contentId: "s1", reasonCode: "scam_or_fraud", reporterId: "u1" })));
    assert.equal(events.length, 1);
    assert.equal(events[0].name, MODERATION_EVENTS.reportFiled);
  });
  it("staff-override event validates", () => {
    const { sink, events } = capture();
    trackEvent(sink, stamp(buildStaffOverrideEvent({ contentType: "marketplace_listing", contentId: "c1", decision: "approve", staffId: "staff-1", priorDecision: "hold" })));
    assert.equal(events.length, 1);
    assert.equal(events[0].actor?.kind, "staff");
  });
});
