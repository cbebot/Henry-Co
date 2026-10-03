import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { claimEvidenceOwner } from "./care-media-store";

// Run from apps/care (so the `@/` path alias resolves):
//   node --conditions=react-server --import tsx --test lib/care-media-store.test.ts
// (the module is server-only; the react-server condition resolves the no-op guard).
//
// V3-CARE-JOBS-PREAPPLY-FIX-01. claimEvidenceOwner is the owner-binding grammar
// that stands between a service-role signer (which can sign ANY private object)
// and an arbitrary-file read. It must return the owner id ONLY for a ref shaped
// exactly like uploadCareClaimEvidence mints, and null for anything a caller
// could craft to escape that shape.

const UID = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const own = (key: string) => `media://private/care-documents/${key}`;

describe("claimEvidenceOwner — the claim-evidence ownership grammar", () => {
  it("returns the owner id for a well-formed own ref", () => {
    assert.equal(claimEvidenceOwner(own(`claims/${UID}/abcd1234abcd-photo.jpg`)), UID);
    assert.equal(claimEvidenceOwner(own(`claims/${UID}/0f3a-x`)), UID); // short id + no ext
  });

  it("rejects path traversal in the object segment", () => {
    assert.equal(claimEvidenceOwner(own(`claims/${UID}/../../secret.jpg`)), null);
    assert.equal(claimEvidenceOwner(own(`claims/${UID}/..`)), null);
    assert.equal(claimEvidenceOwner(own(`claims/${UID}/%2e%2e-x.jpg`)), null); // % banned
  });

  it("rejects an extra path segment (only claims/<uuid>/<leaf> is valid)", () => {
    assert.equal(claimEvidenceOwner(own(`claims/${UID}/sub/evil.jpg`)), null);
    assert.equal(claimEvidenceOwner(own(`claims/${UID}/a/b-c.jpg`)), null);
  });

  it("rejects a wrong bucket or wrong top-level prefix", () => {
    assert.equal(claimEvidenceOwner(`media://private/kyc-documents/claims/${UID}/abcd1234abcd-x.jpg`), null);
    assert.equal(claimEvidenceOwner(own(`payment-receipts/${UID}/abcd1234abcd-x.pdf`)), null);
    assert.equal(claimEvidenceOwner(own(`expenses/${UID}/abcd1234abcd-x.jpg`)), null);
  });

  it("rejects a public ref, a legacy URL, and junk", () => {
    assert.equal(claimEvidenceOwner(`media://public/care-media/claims/${UID}/abcd1234abcd-x.jpg`), null);
    assert.equal(claimEvidenceOwner("https://legacy.example/photo.jpg"), null);
    assert.equal(claimEvidenceOwner(""), null);
    assert.equal(claimEvidenceOwner(null), null);
    assert.equal(claimEvidenceOwner(42), null);
  });

  it("rejects a non-UUID owner segment", () => {
    assert.equal(claimEvidenceOwner(own("claims/not-a-uuid/abcd1234abcd-x.jpg")), null);
    assert.equal(claimEvidenceOwner(own(`claims/${UID.slice(0, 30)}/abcd1234abcd-x.jpg`)), null);
  });

  it("is case-sensitive on the lowercase shape it mints (no uppercase escape)", () => {
    // A UUID with hex letters, so upper-casing actually changes it.
    const hexUid = "abcdef01-2345-4678-89ab-cdef01234567";
    assert.equal(claimEvidenceOwner(own(`claims/${hexUid}/abcd1234abcd-x.jpg`)), hexUid);
    assert.equal(claimEvidenceOwner(own(`claims/${hexUid.toUpperCase()}/abcd1234abcd-x.jpg`)), null);
    assert.equal(claimEvidenceOwner(`MEDIA://PRIVATE/care-documents/claims/${UID}/abcd1234abcd-x.jpg`), null);
  });

  it("distinguishes owners — B's id never validates A's ref", () => {
    const refA = own(`claims/${UID}/abcd1234abcd-x.jpg`);
    assert.equal(claimEvidenceOwner(refA), UID);
    assert.notEqual(claimEvidenceOwner(refA), OTHER);
  });
});
