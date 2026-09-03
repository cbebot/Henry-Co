/**
 * Domain-lookup mode resolution — PURE (no server-only import) so the gate
 * that decides whether the "Check this name" affordance exists at all is
 * unit-testable. `domain-intelligence.ts` (server-only) delegates here and
 * the request pages plumb the resolved mode down as a boolean prop; the
 * client component itself never reads env.
 */

export type DomainLookupMode = "off" | "rdap_com";

export function resolveDomainLookupMode(raw: string | undefined | null): DomainLookupMode {
  const value = String(raw ?? "").trim().toLowerCase();
  if (value === "1" || value === "true" || value === "yes") return "rdap_com";
  return "off";
}
