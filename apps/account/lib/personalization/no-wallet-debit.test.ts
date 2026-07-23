import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

/**
 * V3-34 invariant — NO wallet debit from the personalization path.
 *
 * Wave E.1 is deliberately AI-free (ARCHITECTURE §3): the deterministic floor
 * must never touch the AI gateway, the money RPCs, or a customer wallet. This
 * static proof asserts none of the personalization source files reference the
 * gateway or any wallet/AI-billing RPC — so a platform-invoked home render can
 * never debit a customer wallet. When V3-36 later adds a governed AI re-rank it
 * must ride the internal NON-BILLABLE surface, and this list is revisited.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
// apps/account/lib/personalization -> repo root
const ROOT = path.resolve(HERE, "..", "..", "..", "..");

const PERSONALIZATION_FILES = [
  "apps/account/lib/personalization/home.ts",
  "apps/account/lib/personalization/consent.ts",
  "apps/account/lib/personalization/signal-scores.ts",
  "apps/account/lib/personalization/device.ts",
  "apps/account/app/(account)/customize/actions.ts",
  "apps/account/app/(account)/customize/page.tsx",
  "apps/account/components/customize/CustomizeHomeClient.tsx",
  "packages/dashboard-shell/src/personalization/compute-layout.ts",
  "packages/data/src/home-layout.ts",
];

const FORBIDDEN = [
  "@henryco/ai-gateway",
  "payments_private",
  "reserve_wallet_for_ai",
  "post_ai_usage_charge",
  "release_wallet_ai_hold",
  "runAiTask",
];

describe("personalization path never debits a wallet or calls AI", () => {
  for (const rel of PERSONALIZATION_FILES) {
    it(`${rel} references no AI-gateway / wallet-billing RPC`, () => {
      const source = readFileSync(path.join(ROOT, rel), "utf8");
      for (const token of FORBIDDEN) {
        assert.ok(
          !source.includes(token),
          `${rel} must not reference "${token}" (Wave E.1 is AI-free)`,
        );
      }
    });
  }
});
