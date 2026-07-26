/**
 * SA-2 — PII scrubbing for the frozen spec (SAFETY-MODEL §3). PURE (no server
 * import) so it is unit-testable. Strips emails + phone numbers from any free
 * text before it leaves the product boundary into the sandbox — the agent
 * builds a site, it never needs to know who to contact.
 */

export function scrubContactPii(value: string): string {
  return String(value ?? "")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[contact removed]")
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "[contact removed]")
    .trim();
}
