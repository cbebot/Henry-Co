import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Run from apps/care (so the `@/` path alias resolves):
//   node --conditions=react-server --import tsx --test lib/care-media-store.signing.test.ts
//
// V3-CARE-JOBS-PREAPPLY-FIX-01. signCareClaimEvidenceForOwner drives the
// service-role signer, so this counts the signing requests it actually makes.
// No network: fetch is replaced before the module (and its Supabase client) loads.

const UID = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const ref = (owner: string, n: number) =>
  `media://private/care-documents/claims/${owner}/abcd1234ab${String(n).padStart(2, "0")}-photo.jpg`;

const signRequests: string[] = [];

async function loadStore() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://storage.test";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url.includes("/object/sign/")) {
      signRequests.push(url);
      const path = new URL(url).pathname.replace(/^.*\/object\/sign\//, "");
      return new Response(JSON.stringify({ signedURL: `/object/sign/${path}?token=t` }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  return import("./care-media-store");
}

describe("signCareClaimEvidenceForOwner — signing requests", () => {
  it("signs the owner's own evidence and nothing else", async () => {
    const { signCareClaimEvidenceForOwner } = await loadStore();
    signRequests.length = 0;
    const urls = await signCareClaimEvidenceForOwner([ref(UID, 1), ref(OTHER, 2), ref(UID, 3)], UID);
    assert.equal(urls.length, 2);
    assert.equal(signRequests.length, 2);
    assert.ok(signRequests.every((url) => url.includes(`/claims/${UID}/`)));
  });

  it("makes at most one claim's worth of signing requests, however many refs a row holds", async () => {
    const { signCareClaimEvidenceForOwner, MAX_CLAIM_EVIDENCE } = await loadStore();
    signRequests.length = 0;
    const flood = Array.from({ length: 500 }, (_, n) => ref(UID, n % 100));
    const urls = await signCareClaimEvidenceForOwner(flood, UID);
    assert.equal(urls.length, MAX_CLAIM_EVIDENCE);
    assert.equal(signRequests.length, MAX_CLAIM_EVIDENCE);
  });
});
