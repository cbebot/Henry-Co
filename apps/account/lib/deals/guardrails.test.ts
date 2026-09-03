import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

/**
 * V3-35 invariants, statically proven over the whole deals path:
 *
 *   1. NO AI and NO wallet debit — this pass has no AI slice at all; the
 *      deterministic floor must never touch the gateway or any money RPC.
 *   2. NO send/dispatch of any kind — V3-35 is ELIGIBILITY ONLY. V3-45/48/61
 *      own multi-channel send; nothing on this path may reference the
 *      newsletter/dispatch rail.
 *
 * Mirrors the V3-34 no-wallet-debit proof (lib/personalization).
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
// apps/account/lib/deals -> repo root
const ROOT = path.resolve(HERE, "..", "..", "..", "..");

const DEALS_PATH_FILES = [
  "apps/account/lib/deals/offers.ts",
  "apps/account/lib/deals/offers-core.ts",
  "apps/account/components/smart-home/DealsRail.tsx",
  "apps/hub/lib/deals/moderation.ts",
  "packages/config/deals.ts",
  "packages/data/src/deals.ts",
  "packages/intelligence/src/deals/engine.ts",
  "packages/intelligence/src/deals/fairness.ts",
  "packages/intelligence/src/deals/impressions.ts",
  "packages/intelligence/src/deals/approval.ts",
  "packages/intelligence/src/deals/types.ts",
];

const FORBIDDEN = [
  // AI / wallet (Prime Directive: the floor can never debit or call AI).
  "@henryco/ai-gateway",
  "runAiTask",
  "payments_private",
  "reserve_wallet_for_ai",
  "post_ai_usage_charge",
  "release_wallet_ai_hold",
  // Dispatch rail (V3-35 emits eligibility only — send is V3-45/48/61).
  "@henryco/newsletter",
  "sendEmail",
  "sendCampaign",
  "messageStream",
  "notification_queue",
];

describe("deals path never calls AI, debits a wallet, or dispatches", () => {
  for (const rel of DEALS_PATH_FILES) {
    it(`${rel} references no AI/wallet/dispatch token`, () => {
      const source = readFileSync(path.join(ROOT, rel), "utf8");
      for (const token of FORBIDDEN) {
        assert.ok(
          !source.includes(token),
          `${rel} must not reference "${token}" (V3-35 is deterministic, eligibility-only)`,
        );
      }
    });
  }
});
