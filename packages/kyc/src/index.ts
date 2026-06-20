/**
 * @henryco/kyc — client-safe entry.
 *
 * Pure types + helpers ONLY: the verification level ladder, the minimized
 * verdict model, the KYC redactor, the vendor-neutral provider seam types, and
 * the retention decision logic. NO crypto, storage, secrets, or DB — those live
 * behind the `server-only` `@henryco/kyc/server` entry.
 */
export * from "./levels";
export * from "./verdict";
export * from "./redaction";
export * from "./provider/adapter-interface";
export { verdictFromVendorResult } from "./provider/verdict-mapper";
export {
  resolveScheduledRetention,
  resolveErasureRequest,
  type RetentionPolicy,
  type RetentionRecord,
  type RetentionDecision,
} from "./retention/policy";
