# Pass 2 — "Henry Onyx Intelligence Review" (the metered listing trust review)

**Status:** ✅ BUILT for marketplace (flag-dark), generalises to every division. The verdict
engine, the multimodal adapter path, the deep-tier metered flow, and the marketplace mount
are implemented and verified; cross-division mounts + a persisted badge column are the
remaining follow-ons.

**What's built:**
- `packages/ai-gateway/src/verify.ts` — the fail-safe verdict parser + the badge gate
  (`resolveVerdictDecision`): awards "Henry Onyx Verified" ONLY when honest + real (not
  AI-generated) + on-standard + safe + score ≥ threshold + model-pass; unsafe → reject;
  else → human review. Missing flags coerce to the SAFE side; an unknown verdict never
  becomes a pass. 12 tests, incl. hostile-output cases.
- The `marketplace.listing.verify` surface (deep tier, METERED) + its prompt builder
  (doctrine + the honesty/AI-media/standards/safety rubric → strict JSON).
- Multimodal: `ProviderRequest.images` + the Anthropic adapter sends image content blocks
  (server-only; provider/model still opaque). The review reads the listing's media.
- Marketplace mount: `verify-listing-action.ts` (metered, audited, returns only the decision
  + reasons + redacted receipt) and `VerifyListingPanel.tsx` (Register-L), flag-dark behind
  `MARKETPLACE_AI_LISTING_VERIFY`.

**Remaining follow-ons:** a persisted `Henry Onyx Verified` badge column + buyer-facing
filter; cross-division mounts (`jobs/learn/property/studio .listing.verify`) via the assist
kit; reconcile the deep-tier rate to live provider price before enabling.

---

## The idea (owner's words, distilled)

Before any listing goes live — in **any division** (marketplace, jobs, learn, property, …)
— the poster can **opt in** (tick a button) to a **Henry Onyx Intelligence Review**. It
**charges their wallet** (a metered AI call), then the AI **reads the images and the copy**
and **verifies**:

- the listing is **honest** and nothing is **fake** (claims match what's shown),
- the media is **not AI-generated** (real product/photos, not synthetic),
- it **matches Henry Onyx standards**,
- the product is **safe to post**.

If it passes, the listing earns a **"Henry Onyx Verified"** trust badge. Buyers trust a
verified listing more than an unverified one — so the seller pays a little, **for their own
goods' credibility**. Because nothing should slip through, the review runs on the **strongest
model** (the `deep` tier).

## Why this rides Pass 1 cleanly

It is **another metered surface** — the money path is identical to draft-a-listing:

```
runAiTask({ surface: "marketplace.listing.verify", actorId, input, idempotencyKey })
  → resolve policy (deep tier, METERED)
  → estimate (provable upper bound) → reserve against the seller's wallet (refuse if zero)
  → dispatch to the (vision-capable) Anthropic adapter — server-only, model opaque
  → meter actual tokens → price (cost + deep margin % + VAT)
  → settle: ONE atomic, idempotent, guarded payments_private RPC
            (DR customer_wallet_liability / CR platform_revenue / CR vat_output_payable)
  → redacted receipt (no provider/model/cost/margin) + a VERDICT
```

Everything that makes Pass 1 money-grade — the prepaid gate, the structural charge cap, the
balanced double-entry post, idempotent settle, provider/model opacity — applies unchanged.

## What Pass 2 adds (the build list)

1. **Vision in the adapter.** Extend `ProviderRequest` with an optional `images` field and
   the Anthropic adapter to send image content blocks. The metering already counts the
   provider's reported tokens, so image tokens bill correctly with no pricing change. The
   `deep` tier (Opus-class) is the routed model.
2. **A verdict schema** (constrained output, the studio JSON-in-prompt precedent):
   ```
   { honest: boolean, aiGeneratedMedia: boolean, matchesStandards: boolean,
     safeToPost: boolean, trustScore: 0..100, reasons: string[], verdict: "pass"|"review"|"reject" }
   ```
   Provider/model never named; only the verdict + a redacted receipt reach the client.
3. **The trust-badge + go-live gate.** A `pass` verdict earns a persisted **Henry Onyx
   Verified** badge on the listing; `review`/`reject` route to human moderation. This is
   **additive** — it AUGMENTS, never replaces, the existing always-on `evaluateListingSubmission`
   and the human moderation queue (the AI is a paid trust signal + triage, not the sole gate).
4. **Cross-division surfaces.** `jobs.listing.verify`, `learn.listing.verify`,
   `property.listing.verify` — the same policy shape (METERED, `deep`), the same gateway call,
   each mounted on that division's create/publish flow behind the same flag-dark discipline.
5. **A billing port per division.** Each division supplies its own
   `createPgBillingPort(getPaymentsSqlExecutor())` over its `PAYMENTS_DATABASE_URL`, exactly
   as marketplace does in Pass 1.

## Money & trust model

- **Who pays:** the poster (seller/employer/educator), from their shared `customer_wallets`
  balance — for their own goods' credibility. Pre-paid: a wallet-zero poster is refused
  before any provider call.
- **Tier:** `deep` (the strongest model) so the review is thorough; it bills higher than a
  draft, by construction (the per-tier rate card), and the pre-flight price is shown before
  it runs.
- **Trust outcome:** a verified listing carries the badge; the verdict's reasons are kept
  server-side for moderation/audit. Buyers see only the badge, never the provider/model.

## Guardrails carried forward

- The AI verdict is **advisory + triage**, layered on top of the existing moderation — it
  must never silently auto-publish unsafe content. A `reject` blocks; a `review` escalates.
- Provider/model opacity, balanced/idempotent/guarded settlement, RLS default-deny, and the
  flag-dark launch all apply exactly as in Pass 1.
- Reconcile the `deep`-tier per-token cost to the live provider list price before enabling.
