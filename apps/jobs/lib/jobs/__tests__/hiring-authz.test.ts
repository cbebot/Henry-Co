// JOB-1/2/3 hardening — proofs for the pure authorization + payload-hardening
// seam shared by the hiring routes.
//
// The route handlers themselves import `server-only` (via @/lib/jobs/hiring,
// @/lib/supabase, getJobsViewer, …) and therefore cannot be imported under bare
// `tsx --test`. Following the repo convention (see candidate-home.test.ts), the
// authorization DECISIONS are extracted into this pure module which imports only
// types, so the exact allow/deny logic the routes rely on is unit-tested here
// with the precise shapes the mocked getApplicationContext /
// resolveHiringActingContext / createAdminSupabase reads return:
//   - anonymous (no viewer / personal context)      -> denied
//   - cross-business employer (business mismatch)    -> denied
//   - owning employer (business id matches)          -> allowed
//   - non-https / malformed meetingUrl               -> rejected (phishing gate)
// The route-level platform-staff bypass is asserted by the route source (isStaff
// short-circuits before these gates) and noted in the PR.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  parseHttpsUrl,
  clampDuration,
  normalizeInterviewType,
  normalizeScheduleInterviewInput,
  actingBusinessOwnsApplication,
  decideHiringConvoRole,
} from "../hiring-authz";

describe("parseHttpsUrl", () => {
  it("accepts a valid https url and returns the normalized string", () => {
    assert.equal(parseHttpsUrl("https://meet.example.com/abc"), "https://meet.example.com/abc");
  });
  it("rejects http, javascript:, data:, non-url, and non-string", () => {
    assert.equal(parseHttpsUrl("http://meet.example.com/abc"), null);
    assert.equal(parseHttpsUrl("javascript:alert(1)"), null);
    assert.equal(parseHttpsUrl("data:text/html,<script>"), null);
    assert.equal(parseHttpsUrl("not a url"), null);
    assert.equal(parseHttpsUrl(""), null);
    assert.equal(parseHttpsUrl(undefined), null);
    assert.equal(parseHttpsUrl(123), null);
  });
});

describe("clampDuration", () => {
  it("clamps to 5..480 and rounds", () => {
    assert.equal(clampDuration(1), 5);
    assert.equal(clampDuration(99999), 480);
    assert.equal(clampDuration(30.6), 31);
    assert.equal(clampDuration("45"), 45);
  });
  it("falls back to 30 on non-finite", () => {
    assert.equal(clampDuration("nope"), 30);
    assert.equal(clampDuration(undefined), 30);
    assert.equal(clampDuration(Number.NaN), 30);
  });
});

describe("normalizeInterviewType", () => {
  it("passes through the allowlist and normalizes in_person -> in-person", () => {
    assert.equal(normalizeInterviewType("video"), "video");
    assert.equal(normalizeInterviewType("phone"), "phone");
    assert.equal(normalizeInterviewType("in-person"), "in-person");
    assert.equal(normalizeInterviewType("in_person"), "in-person");
  });
  it("defaults unknown / non-string to video", () => {
    assert.equal(normalizeInterviewType("malware"), "video");
    assert.equal(normalizeInterviewType(undefined), "video");
    assert.equal(normalizeInterviewType(42), "video");
  });
});

describe("normalizeScheduleInterviewInput", () => {
  const base = {
    applicationId: "app-1",
    title: "Onsite",
    scheduledAt: "2026-07-01T10:00:00.000Z",
    meetingUrl: "https://meet.example.com/x",
  };

  it("rejects missing required fields", () => {
    assert.equal(normalizeScheduleInterviewInput({ ...base, applicationId: "" }).ok, false);
    assert.equal(normalizeScheduleInterviewInput({ ...base, title: "   " }).ok, false);
    assert.equal(normalizeScheduleInterviewInput({ ...base, scheduledAt: "" }).ok, false);
  });

  it("rejects an unparseable scheduledAt", () => {
    const res = normalizeScheduleInterviewInput({ ...base, scheduledAt: "not-a-date" });
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.error, "invalid_scheduled_at");
  });

  it("rejects a PRESENT non-https meetingUrl (phishing / scheme-injection gate)", () => {
    const http = normalizeScheduleInterviewInput({ ...base, meetingUrl: "http://evil.example.com" });
    assert.equal(http.ok, false);
    if (!http.ok) assert.equal(http.error, "invalid_meeting_url");

    const js = normalizeScheduleInterviewInput({ ...base, meetingUrl: "javascript:alert(1)" });
    assert.equal(js.ok, false);

    const data = normalizeScheduleInterviewInput({ ...base, meetingUrl: "data:text/html,x" });
    assert.equal(data.ok, false);
  });

  it("allows an absent / empty meetingUrl (phone / in-person interviews)", () => {
    const absent = normalizeScheduleInterviewInput({
      applicationId: "app-1",
      title: "Phone screen",
      scheduledAt: "2026-07-01T10:00:00.000Z",
      interviewType: "phone",
    });
    assert.equal(absent.ok, true);
    if (absent.ok) assert.equal(absent.value.meetingUrl, null);

    const empty = normalizeScheduleInterviewInput({ ...base, meetingUrl: "   " });
    assert.equal(empty.ok, true);
    if (empty.ok) assert.equal(empty.value.meetingUrl, null);
  });

  it("normalizes a valid payload: clamps duration, allowlists type, applies defaults", () => {
    const res = normalizeScheduleInterviewInput({
      ...base,
      durationMinutes: 99999,
      interviewType: "in_person",
    });
    assert.equal(res.ok, true);
    if (res.ok) {
      assert.equal(res.value.applicationId, "app-1");
      assert.equal(res.value.title, "Onsite");
      assert.equal(res.value.durationMinutes, 480);
      assert.equal(res.value.interviewType, "in-person");
      assert.equal(res.value.timezone, "Africa/Lagos");
      assert.equal(res.value.meetingUrl, "https://meet.example.com/x");
      assert.equal(res.value.location, null);
      assert.equal(res.value.notes, null);
    }
  });
});

describe("actingBusinessOwnsApplication (JOB-1 / JOB-3 ownership gate)", () => {
  const owning = { kind: "business" as const, userId: "u1", businessId: "biz-1", role: "owner" as const };
  const other = { kind: "business" as const, userId: "u2", businessId: "biz-2", role: "owner" as const };
  const personal = { kind: "personal" as const, userId: "u1" };

  it("allows the owning business", () => {
    assert.equal(actingBusinessOwnsApplication(owning, { businessId: "biz-1" }), true);
  });
  it("denies a cross-business employer", () => {
    assert.equal(actingBusinessOwnsApplication(other, { businessId: "biz-1" }), false);
  });
  it("denies a personal (anonymous-equivalent) context", () => {
    assert.equal(actingBusinessOwnsApplication(personal, { businessId: "biz-1" }), false);
  });
  it("denies when the application is missing or has no business", () => {
    assert.equal(actingBusinessOwnsApplication(owning, null), false);
    assert.equal(actingBusinessOwnsApplication(owning, { businessId: null }), false);
  });
});

describe("decideHiringConvoRole (JOB-2 participant/flagger gate)", () => {
  it("grants candidate when the viewer is the conversation/application candidate", () => {
    assert.equal(
      decideHiringConvoRole({
        viewerId: "cand-1",
        candidateIds: [null, "cand-1"],
        owningBusinessId: "biz-1",
        actingBusinessId: null,
      }),
      "candidate",
    );
  });

  it("grants employer ONLY when the acting business owns the conversation pipeline", () => {
    assert.equal(
      decideHiringConvoRole({
        viewerId: "emp-1",
        candidateIds: [null],
        owningBusinessId: "biz-1",
        actingBusinessId: "biz-1",
      }),
      "employer",
    );
  });

  it("denies a cross-business employer (business mismatch)", () => {
    assert.equal(
      decideHiringConvoRole({
        viewerId: "emp-9",
        candidateIds: [null],
        owningBusinessId: "biz-1",
        actingBusinessId: "biz-2",
      }),
      null,
    );
  });

  it("denies when the viewer is personal / has no acting business", () => {
    assert.equal(
      decideHiringConvoRole({
        viewerId: "emp-1",
        candidateIds: [null],
        owningBusinessId: "biz-1",
        actingBusinessId: null,
      }),
      null,
    );
  });

  it("denies an anonymous viewer (empty id) even if ids are nullish", () => {
    assert.equal(
      decideHiringConvoRole({
        viewerId: "",
        candidateIds: [null, ""],
        owningBusinessId: null,
        actingBusinessId: null,
      }),
      null,
    );
  });

  it("denies when the pipeline has no owning business id", () => {
    assert.equal(
      decideHiringConvoRole({
        viewerId: "emp-1",
        candidateIds: [null],
        owningBusinessId: null,
        actingBusinessId: "biz-1",
      }),
      null,
    );
  });
});
