/**
 * V3-73 — Studio Project Suite: tamper-evident approval signatures.
 *
 * ANTI-CLONE Principle 12 (audit at depth): when a client approves a deliverable,
 * we HMAC-sign a canonical snapshot of the EXACT approved state. The signature is
 * verifiable server-side and detects any later mutation of the snapshot — defence-
 * in-depth proof of what the client approved and when.
 *
 * The HMAC secret is a server-side value (`STUDIO_APPROVAL_SIGNATURE_SECRET`). The
 * core functions take the secret as an argument so the logic is pure + testable;
 * `resolveApprovalSecret()` reads the env for callers.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

import { getOptionalEnv } from "@/lib/env";

export type ApprovalSnapshot = {
  /** the deliverable being approved */
  deliverableId: string;
  /** its parent project */
  projectId: string;
  /** 1-based revision round this approval closes */
  revisionNumber: number;
  /** the client (auth.users id) who approved */
  approvedByUserId: string;
  /** ISO timestamp of approval */
  approvedAt: string;
  /** the exact deliverable state approved (label, version, status, file ref, …) */
  deliverableState: Record<string, unknown>;
};

/**
 * Deterministic JSON: object keys sorted recursively so the signature is
 * independent of key insertion order but sensitive to every value.
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const entries = Object.keys(value as Record<string, unknown>)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`);
  return `{${entries.join(",")}}`;
}

export function canonicalizeSnapshot(snapshot: ApprovalSnapshot): string {
  // Pin the field set so adding an unrelated property to the object can't
  // silently change (or skip) signed bytes — only these fields are signed.
  return stableStringify({
    deliverableId: snapshot.deliverableId,
    projectId: snapshot.projectId,
    revisionNumber: snapshot.revisionNumber,
    approvedByUserId: snapshot.approvedByUserId,
    approvedAt: snapshot.approvedAt,
    deliverableState: snapshot.deliverableState,
  });
}

export function signApprovalSnapshot(snapshot: ApprovalSnapshot, secret: string): string {
  return createHmac("sha256", secret).update(canonicalizeSnapshot(snapshot)).digest("hex");
}

export function verifyApprovalSignature(
  snapshot: ApprovalSnapshot,
  signature: string,
  secret: string,
): boolean {
  if (!signature || typeof signature !== "string") return false;
  const expected = signApprovalSnapshot(snapshot, secret);
  // Constant-time compare; length check first so timingSafeEqual never throws on
  // a malformed (wrong-length) candidate.
  if (signature.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

/** Read the server-side HMAC secret. Returns null when unconfigured. */
export function resolveApprovalSecret(): string | null {
  return getOptionalEnv("STUDIO_APPROVAL_SIGNATURE_SECRET");
}
