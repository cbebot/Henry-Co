import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { mapSignalToTelemetry } from "../telemetry-map";
import type { AiUsageSignal } from "../orchestrator";

const base = { surface: "marketplace.listing.draft" as const, tier: "standard" as const, billable: true };

describe("mapSignalToTelemetry — every AI call maps to an auditable record", () => {
  it("estimated → henry.ai.usage.estimated / started, no audit row", () => {
    const r = mapSignalToTelemetry({ kind: "estimated", ...base, totalKobo: 3758, vatKobo: 262 });
    assert.equal(r.eventName, "henry.ai.usage.estimated");
    assert.equal(r.outcome, "started");
    assert.equal(r.audit, false);
  });

  it("metered + billed → henry.ai.usage.metered / paid, audited", () => {
    const r = mapSignalToTelemetry({ kind: "metered", ...base, totalKobo: 2554, vatKobo: 178, usageEventId: "evt-1" });
    assert.equal(r.eventName, "henry.ai.usage.metered");
    assert.equal(r.outcome, "paid");
    assert.equal(r.audit, true);
    assert.equal(r.auditAction, "ai.usage.metered");
  });

  it("metered + FREE (total 0) → completed, still audited", () => {
    const r = mapSignalToTelemetry({ kind: "metered", surface: "support.message.assist", tier: "fast", billable: false, totalKobo: 0, vatKobo: 0, usageEventId: "evt-2" });
    assert.equal(r.outcome, "completed");
    assert.equal(r.audit, true);
  });

  it("blocked → henry.ai.usage.blocked / blocked, audited with the code", () => {
    const r = mapSignalToTelemetry({ kind: "blocked", ...base, code: "auth_required" });
    assert.equal(r.eventName, "henry.ai.usage.blocked");
    assert.equal(r.outcome, "blocked");
    assert.equal(r.audit, true);
    assert.equal(r.payload.code, "auth_required");
  });

  it("provider_failed → henry.ai.provider.failed / failed, audited", () => {
    const r = mapSignalToTelemetry({ kind: "provider_failed", ...base, code: "provider_timeout" });
    assert.equal(r.eventName, "henry.ai.provider.failed");
    assert.equal(r.outcome, "failed");
    assert.equal(r.audit, true);
  });

  it("the telemetry payload NEVER carries provider/model/cost/margin", () => {
    const r = mapSignalToTelemetry({ kind: "metered", ...base, totalKobo: 2554, vatKobo: 178, usageEventId: "evt-1" });
    const serialized = JSON.stringify(r.payload);
    assert.ok(!/provider|model|cost|margin/i.test(serialized), `payload must be clean: ${serialized}`);
  });
});
