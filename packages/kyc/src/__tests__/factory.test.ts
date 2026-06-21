import { test } from "node:test";
import assert from "node:assert/strict";

import { selectMasterKeyProvider, trySelectMasterKeyProvider } from "../server/master-key-factory";
import { buildRetentionPolicyFromEnv } from "../server/retention-config";

const envKey = Buffer.from(new Uint8Array(32).map((_, i) => i)).toString("base64");

test("KMS is preferred when configured (the recommended production target)", () => {
  const p = selectMasterKeyProvider({
    KYC_VAULT_KMS_KEY_ID: "arn:aws:kms:us-east-1:544011261114:key/abc",
    AWS_ACCESS_KEY_ID: "AKIA",
    AWS_SECRET_ACCESS_KEY: "secret",
    AWS_REGION: "us-east-1",
    KYC_VAULT_MASTER_KEY: envKey, // also present — KMS must still win
  });
  assert.equal(p.providerKey, "aws-kms");
});

test("falls back to the env-key provider when KMS is not configured", () => {
  const p = selectMasterKeyProvider({ KYC_VAULT_MASTER_KEY: envKey });
  assert.equal(p.providerKey, "env");
});

test("trySelect returns null when no master key is configured (dormant)", () => {
  assert.equal(trySelectMasterKeyProvider({}), null);
});

test("select throws when no master key is configured", () => {
  assert.throws(() => selectMasterKeyProvider({}));
});

test("retention policy is no-op by default: retentionDays null until configured", () => {
  const p = buildRetentionPolicyFromEnv({});
  assert.equal(p.retentionDays, null, "unconfigured window → scheduled shred no-ops");
  assert.equal(p.destructiveShredAllowed, true);
});

test("retention policy reads the configured window + AML floor", () => {
  const p = buildRetentionPolicyFromEnv({
    KYC_VAULT_RETENTION_DAYS: "1825",
    KYC_VAULT_AML_FLOOR_DAYS: "1825",
  });
  assert.equal(p.retentionDays, 1825);
  assert.equal(p.amlFloorDays, 1825);
});

test("destructive shred can be disabled by config", () => {
  const p = buildRetentionPolicyFromEnv({ KYC_VAULT_DESTRUCTIVE_SHRED: "false" });
  assert.equal(p.destructiveShredAllowed, false);
});

test("ignores a non-numeric retention window (stays no-op)", () => {
  const p = buildRetentionPolicyFromEnv({ KYC_VAULT_RETENTION_DAYS: "not-a-number" });
  assert.equal(p.retentionDays, null);
});
