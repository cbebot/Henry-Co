/**
 * @henryco/kyc — audit sink backed by `@henryco/observability` writeAuditLog.
 *
 * Composes the canonical audit primitive (the `add_audit_log_v2` SECURITY
 * DEFINER RPC) rather than writing a bespoke audit table. Every vault op lands
 * an `entityType: "kyc_verification"` row attributed to the acting operator
 * (the injected client's `auth.uid()`; service-role ⇒ NULL = system action).
 *
 * Imports the server-only writeAuditLog, so it is reachable only via the
 * server barrel.
 */
import { writeAuditLog, type AuditLogSupabaseClient } from "@henryco/observability/audit-log";
import { toAuditLogInput } from "./audit-map";
import type { AuditEntry, VaultAudit } from "../vault/ports";

export class ObservabilityVaultAudit implements VaultAudit {
  readonly #client: AuditLogSupabaseClient;
  constructor(opts: { client: AuditLogSupabaseClient }) {
    this.#client = opts.client;
  }
  async record(entry: AuditEntry): Promise<void> {
    await writeAuditLog(this.#client, toAuditLogInput(entry));
  }
}
