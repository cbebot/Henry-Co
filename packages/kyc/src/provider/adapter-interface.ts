/**
 * @henryco/kyc — vendor-neutral provider seam.
 *
 * The contract a KYC verification provider implements. Intentionally identical
 * in shape to the V3-24 spec so its Smile Identity / Onfido adapters drop into
 * this seam without redefining it. This package ships ONLY the dormant
 * `internal` stub — no live vendor call, no vendor key.
 *
 * Types only — client-safe.
 */
import type { VerificationLevel } from "../levels";
import type { VerificationDecision } from "../verdict";

export type KycVendorKey = "smile_identity" | "onfido" | "internal";

export type KycDocumentType =
  | "bvn"
  | "nin"
  | "passport"
  | "drivers_license"
  | "voter_card"
  | "national_id"
  | "selfie";

/** Vendor decision vocabulary — same set as the vault's {@link VerificationDecision}. */
export type VendorDecision = VerificationDecision;

export interface InitiateInput {
  userId: string;
  /** ISO 3166-1 alpha-2 country. */
  country: string;
  documentTypes: ReadonlyArray<KycDocumentType>;
  requestedLevel: VerificationLevel;
  /** Dedupes vendor session creation (prevents double-billing). */
  idempotencyKey: string;
}

export interface VerificationSession {
  vendorSessionId: string;
  /** Opaque client token the web/Expo SDK consumes — NOT a provider API key. */
  clientToken: string;
  expiresAt: string;
}

export interface VerificationResult {
  vendorSessionId: string;
  decision: VendorDecision;
  achievedLevel: VerificationLevel;
  /** PII-stripped result; the vault re-redacts defensively before persistence. */
  redactedResultJson: Record<string, unknown>;
  reasonCodes: ReadonlyArray<string>;
}

export interface WebhookResult {
  vendorSessionId: string;
  result: VerificationResult;
}

export interface KycVendorAdapter {
  readonly vendorKey: KycVendorKey;
  /** ISO alpha-2 list, or `"*"` for the catch-all internal fallback. */
  readonly supportedCountries: ReadonlyArray<string>;
  readonly supportedDocumentTypes: ReadonlyArray<KycDocumentType>;
  /** Server-only. Returns a vendor session the client SDK consumes. Never returns raw PII. */
  initiateVerification(input: InitiateInput): Promise<VerificationSession>;
  /** Polls the vendor for a final decision. Result PII is redacted before persistence. */
  fetchResult(vendorSessionId: string): Promise<VerificationResult>;
  /** HMAC/signature-verified webhook parse. Throws on signature mismatch. */
  verifyWebhook(rawBody: string, headers: Record<string, string>): Promise<WebhookResult>;
}
