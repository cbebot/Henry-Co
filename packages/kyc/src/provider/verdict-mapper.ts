/**
 * @henryco/kyc — flow a vendor result INTO the vault as a minimized verdict.
 *
 * This is the one-way valve between the (future) live provider and the vault:
 * a {@link VerificationResult} becomes a {@link KycVerdict} via `buildVerdict`,
 * which re-redacts the result JSON defensively — so even an adapter that
 * forgets to strip PII cannot land raw identity data in the vault.
 *
 * Pure + client-safe.
 */
import { buildVerdict, type KycVerdict } from "../verdict";
import type { VerificationResult } from "./adapter-interface";

export function verdictFromVendorResult(
  userId: string,
  vendorKey: string,
  result: VerificationResult,
  decidedAt: string,
): KycVerdict {
  return buildVerdict({
    userId,
    decision: result.decision,
    level: result.achievedLevel,
    provider: vendorKey,
    providerSessionId: result.vendorSessionId,
    reasonCodes: result.reasonCodes,
    resultJson: result.redactedResultJson,
    decidedAt,
  });
}
