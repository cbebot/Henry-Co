/**
 * @henryco/kyc — map a vault {@link AuditEntry} to an `@henryco/observability`
 * {@link AuditLogInput}. Pure (no server-only) so it can be unit-tested; the
 * thin adapter that actually calls `writeAuditLog` lives in
 * `observability-audit.ts`.
 *
 * Every vault audit row is `entityType: "kyc_verification"`, division
 * "account", and its `newValues` are run through the KYC redactor so a stray
 * PII value can never land in the audit trail.
 */
import type { AuditLogInput } from "@henryco/observability/audit-log";
import { redactKycPayload, scrubText } from "../redaction";
import type { AuditEntry } from "../vault/ports";

export function toAuditLogInput(entry: AuditEntry): AuditLogInput {
  return {
    action: entry.action,
    entityType: "kyc_verification",
    entityId: entry.entityId,
    // reason is operator/system free-text (incl. legal-hold notes) — scrub digit PII.
    reason: entry.reason ? scrubText(entry.reason) : null,
    division: "account",
    newValues: redactKycPayload({
      userId: entry.userId ?? null,
      actorUserId: entry.actorUserId ?? null,
      ...(entry.metadata ?? {}),
    }),
  };
}
