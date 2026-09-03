/**
 * @henryco/kyc — the minimized verification VERDICT model.
 *
 * Data-minimization #1 control: the vault's default unit of storage is the
 * *outcome* of verification, never the raw identity input. A verdict holds the
 * status, level, decision, an opaque provider session ref/token, reason codes,
 * and a PII-redacted result JSON — and explicitly NO raw BVN/NIN/document
 * number. The provider verifies; we keep the verdict.
 *
 * Status maps onto `@henryco/trust`'s shared vocabulary so every existing gate
 * (account, jobs, business, property) keeps working with zero rewrites.
 *
 * Pure + client-safe.
 */
import type { SharedVerificationStatus } from "@henryco/trust/verification";
import { isVerificationLevel, type VerificationLevel } from "./levels";
import { minimizeVerdictJson } from "./redaction";

export type VerificationDecision = "approved" | "rejected" | "manual_review" | "pending";

export type KycVerdict = {
  userId: string;
  status: SharedVerificationStatus;
  level: VerificationLevel;
  decision: VerificationDecision;
  provider: string;
  /** Opaque vendor session id/token — NOT identity PII. */
  providerSessionId: string | null;
  reasonCodes: string[];
  /** PII-stripped vendor result. */
  redactedResultJson: Record<string, unknown>;
  decidedAt: string;
};

/** Map a vendor decision onto the shared trust status vocabulary. */
export function decisionToStatus(decision: VerificationDecision): SharedVerificationStatus {
  switch (decision) {
    case "approved":
      return "verified";
    case "rejected":
      return "rejected";
    case "manual_review":
    case "pending":
      return "pending";
  }
}

export type BuildVerdictInput = {
  userId: string;
  decision: VerificationDecision;
  level: VerificationLevel;
  provider: string;
  providerSessionId?: string | null;
  reasonCodes?: ReadonlyArray<string>;
  /** May contain PII — it is redacted before being stored on the verdict. */
  resultJson?: Record<string, unknown>;
  decidedAt: string;
};

/** Assemble a minimized, redacted verdict. Throws on an invalid level. */
export function buildVerdict(input: BuildVerdictInput): KycVerdict {
  if (!isVerificationLevel(input.level)) {
    throw new Error(`kyc/verdict: invalid level '${String(input.level)}'`);
  }
  return {
    userId: input.userId,
    status: decisionToStatus(input.decision),
    level: input.level,
    decision: input.decision,
    provider: input.provider,
    providerSessionId: input.providerSessionId ?? null,
    reasonCodes: input.reasonCodes ? [...input.reasonCodes] : [],
    redactedResultJson: minimizeVerdictJson(input.resultJson ?? {}),
    decidedAt: input.decidedAt,
  };
}
