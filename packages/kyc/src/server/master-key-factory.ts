/**
 * @henryco/kyc — master-key provider selection.
 *
 * Resolves the active {@link MasterKeyProvider} from the environment, preferring
 * AWS KMS (the recommended production target — the master key never leaves the
 * HSM) over the env-var key (the zero-infra dormant default). Returns null /
 * throws when neither is configured, so the vault stays dormant until a key is
 * provisioned.
 *
 * No `import "server-only"` here — that guard lives on the public `./server`
 * barrel; the exports map prevents apps from deep-importing this leaf.
 */
import { EnvMasterKeyProvider, type MasterKeyProvider } from "../crypto/master-key";
import { KmsMasterKeyProvider } from "../crypto/kms-master-key";

export function trySelectMasterKeyProvider(
  env: Record<string, string | undefined> = process.env,
): MasterKeyProvider | null {
  const kms = KmsMasterKeyProvider.tryFromEnv(env);
  if (kms) return kms;
  return EnvMasterKeyProvider.tryFromEnv(env);
}

export function selectMasterKeyProvider(
  env: Record<string, string | undefined> = process.env,
): MasterKeyProvider {
  const provider = trySelectMasterKeyProvider(env);
  if (!provider) {
    throw new Error(
      "kyc: no master key configured — set KYC_VAULT_KMS_KEY_ID (preferred) or KYC_VAULT_MASTER_KEY",
    );
  }
  return provider;
}
