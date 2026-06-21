/**
 * @henryco/kyc — build a {@link RetentionPolicy} from the environment.
 *
 * ⚠️ LEGAL SIGN-OFF REQUIRED. The retention window + AML floor are policy values
 * the law decides, not this code. Defaults are deliberately INERT:
 *   - `KYC_VAULT_RETENTION_DAYS` unset → `retentionDays = null` ⇒ the scheduled
 *     crypto-shred does NOTHING (it never invents a legal deletion date).
 *   - `KYC_VAULT_AML_FLOOR_DAYS` unset → `0` (on-request NDPR erasure honored
 *     immediately; legal raises the floor to enforce a mandatory retention).
 *   - `KYC_VAULT_DESTRUCTIVE_SHRED=false` → the surface is never destroyed.
 *
 * Pure (no server-only).
 */
import type { RetentionPolicy } from "../retention/policy";

function intOrNull(value: string | undefined): number | null {
  if (value == null || value.trim() === "") return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function buildRetentionPolicyFromEnv(
  env: Record<string, string | undefined> = process.env,
): RetentionPolicy {
  // A retention window must be a positive number of days. Treat 0 (and blank /
  // invalid) as "not configured" → the scheduled sweep no-ops, so a misconfig
  // can never become an immediate mass crypto-shred of every live artifact.
  const days = intOrNull(env.KYC_VAULT_RETENTION_DAYS);
  return {
    retentionDays: days != null && days >= 1 ? days : null,
    amlFloorDays: intOrNull(env.KYC_VAULT_AML_FLOOR_DAYS) ?? 0,
    destructiveShredAllowed: (env.KYC_VAULT_DESTRUCTIVE_SHRED ?? "true").trim() !== "false",
  };
}
