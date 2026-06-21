/**
 * @henryco/kyc — internal (manual-review) adapter.
 *
 * The always-on, vendor-free fallback: it mints a verification session without
 * any external call and resolves entirely through the staff review queue
 * (V3-24 / V3-93 wire the queue). It never auto-approves. Also serves as the
 * deterministic test double for the seam.
 *
 * No `import "server-only"` on this leaf (reachable only via the server barrel
 * + the exports map); it uses node:crypto for a deterministic session id.
 */
import { createHash } from "node:crypto";
import type {
  InitiateInput,
  KycDocumentType,
  KycVendorAdapter,
  VerificationResult,
  VerificationSession,
  WebhookResult,
} from "./adapter-interface";

const ALL_DOC_TYPES: ReadonlyArray<KycDocumentType> = [
  "bvn",
  "nin",
  "passport",
  "drivers_license",
  "voter_card",
  "national_id",
  "selfie",
];

export class InternalKycAdapter implements KycVendorAdapter {
  readonly vendorKey = "internal" as const;
  /** `"*"` = catch-all: the internal adapter covers any country no vendor handles. */
  readonly supportedCountries: ReadonlyArray<string> = ["*"];
  readonly supportedDocumentTypes = ALL_DOC_TYPES;

  readonly #now: () => Date;
  readonly #ttlMs: number;

  constructor(opts: { now?: () => Date; ttlMs?: number } = {}) {
    this.#now = opts.now ?? (() => new Date());
    this.#ttlMs = opts.ttlMs ?? 24 * 60 * 60 * 1000; // 24h
  }

  async initiateVerification(input: InitiateInput): Promise<VerificationSession> {
    const vendorSessionId =
      "internal-" +
      createHash("sha256")
        .update(`${input.userId}:${input.idempotencyKey}`)
        .digest("hex")
        .slice(0, 32);
    const expiresAt = new Date(this.#now().getTime() + this.#ttlMs).toISOString();
    return { vendorSessionId, clientToken: "internal-manual-review", expiresAt };
  }

  async fetchResult(vendorSessionId: string): Promise<VerificationResult> {
    // Internal verification is never auto-resolved — a human reviewer decides.
    return {
      vendorSessionId,
      decision: "manual_review",
      achievedLevel: "L0",
      redactedResultJson: {},
      reasonCodes: ["manual_review_required"],
    };
  }

  async verifyWebhook(_rawBody: string, _headers: Record<string, string>): Promise<WebhookResult> {
    throw new Error("kyc/internal: the internal adapter has no vendor webhook ingress");
  }
}
