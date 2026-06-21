import "server-only";

import { tryCreateKycVault, type KycVaultClient } from "@henryco/kyc/server";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3-KYC-VAULT-01 — scheduled KYC retention / crypto-shred sweep.
 *
 * DORMANT until activated: `tryCreateKycVault` returns null when no master key
 * (`KYC_VAULT_KMS_KEY_ID` / `KYC_VAULT_MASTER_KEY`) is configured, and the
 * retention engine itself no-ops until a retention PERIOD is configured
 * (`KYC_VAULT_RETENTION_DAYS`, legal sign-off required). So with no env set this
 * sweep does nothing and destroys nothing.
 */
export type KycRetentionResult =
  | { dormant: true; reason: string; scanned: 0; shredded: 0; kept: 0; failed: 0 }
  | { dormant: false; scanned: number; shredded: number; kept: number; failed: number };

export async function runKycRetentionSweep(): Promise<KycRetentionResult> {
  const admin = createAdminSupabase() as unknown as KycVaultClient;
  const bundle = tryCreateKycVault({ client: admin });
  if (!bundle) {
    return {
      dormant: true,
      reason: "KYC vault master key not configured — sweep is dormant",
      scanned: 0,
      shredded: 0,
      kept: 0,
      failed: 0,
    };
  }
  const summary = await bundle.retentionEngine.runScheduledShred();
  return { dormant: false, ...summary };
}
