import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  sealImpersonationSession,
  openImpersonationSession,
  safeRelativeRedirect,
  IMPERSONATION_MAX_AGE_SECONDS,
} from "./impersonation-session";

const SECRET = "test-secret-please-rotate";
const session = {
  ownerUserId: "owner-1",
  targetUserId: "staff-9",
  targetName: "Ada",
  targetRole: "staff",
  startedAt: "2026-09-25T10:00:00.000Z",
};
const NOW = Date.parse("2026-09-25T10:10:00.000Z");

describe("impersonation session cookie — sealed, bound, expiring", () => {
  it("round-trips a sealed session", () => {
    const sealed = sealImpersonationSession(session, SECRET);
    assert.deepEqual(openImpersonationSession(sealed, SECRET, NOW), session);
  });

  it("THE HOLE: a forged plain-JSON cookie naming the owner is rejected", () => {
    const forged = JSON.stringify({ ownerUserId: "owner-1", targetUserId: "me" });
    assert.equal(openImpersonationSession(forged, SECRET, NOW), null);
  });

  it("rejects any tampering with the payload or signature", () => {
    const sealed = sealImpersonationSession(session, SECRET);
    const [payload, sig] = sealed.split(".");
    const evil = Buffer.from(JSON.stringify({ ...session, ownerUserId: "someone-else" })).toString("base64url");
    assert.equal(openImpersonationSession(`${evil}.${sig}`, SECRET, NOW), null);
    assert.equal(openImpersonationSession(`${payload}.${"0".repeat(sig.length)}`, SECRET, NOW), null);
    assert.equal(openImpersonationSession(sealed, "another-secret", NOW), null);
  });

  it("expires after the cookie lifetime", () => {
    const sealed = sealImpersonationSession(session, SECRET);
    const late = Date.parse(session.startedAt) + (IMPERSONATION_MAX_AGE_SECONDS + 1) * 1000;
    assert.equal(openImpersonationSession(sealed, SECRET, late), null);
  });

  it("refuses to seal or open without a secret (fail closed)", () => {
    assert.throws(() => sealImpersonationSession(session, ""));
    assert.equal(openImpersonationSession(sealImpersonationSession(session, SECRET), "", NOW), null);
  });

  it("garbage in, null out", () => {
    for (const bad of ["", "x", "a.b.c", ".", "%%%.%%%", undefined, null]) {
      assert.equal(openImpersonationSession(bad as string, SECRET, NOW), null);
    }
  });
});

describe("safeRelativeRedirect — no open redirect from the callback", () => {
  it("keeps same-origin absolute paths", () => {
    assert.equal(safeRelativeRedirect("/owner"), "/owner");
    assert.equal(safeRelativeRedirect("/staff?tab=1"), "/staff?tab=1");
  });
  it("falls back for anything that can leave the origin", () => {
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "\\\\evil", "javascript:alert(1)", "evil", "", null]) {
      assert.equal(safeRelativeRedirect(bad as string), "/");
    }
  });
});
