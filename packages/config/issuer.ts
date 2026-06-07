/**
 * buildDocumentIssuer — the SINGLE config-sourced legal issuer for every branded
 * money document (receipt, invoice, future credit note). This is the at-source fix
 * for the V3-18 brand bug: the document route used to stamp the RETIRED brand
 * `Henry & Co. — <division>`, a hardcoded `["Plot 14B, Admiralty Way", ...]`
 * address, and `rcNumber: null` into every PDF. None of those literals exist any
 * more — the legal issuer is derived here, once, from `@henryco/config`:
 *
 *   - `name`          → COMPANY.group.legalName  ("Henry Onyx Limited") — the
 *                       registered entity that issues the document for Paystack/CAC
 *                       settlement compliance. NEVER a division string.
 *   - `divisionLabel` → COMPANY.divisions[division].name ("Henry Onyx <Division>")
 *                       — the trading label shown as the document's division header.
 *   - `addressLines`  → LEGAL.entity.registeredOffice, with any still-unconfirmed
 *                       `[OWNER-TO-CONFIRM]` field OMITTED (never printed as a
 *                       placeholder, never invented). The office auto-appears the
 *                       moment the registry is filled — zero code change.
 *   - `rcNumber`      → LEGAL.entity.rcNumber (RC 9594234), or null while unconfirmed.
 *   - `vatNumber`     → a confirmed FIRS TIN if present, else null. VAT is
 *                       represented (V3-18) but not computed (V3-21); the line only
 *                       renders when real.
 *   - `contactEmail`  → BRAND_EMAILS.billing (group billing inbox).
 *   - `contactPhone`  → COMPANY.group.supportPhone.
 *
 * The premium-bar rubric in `legal.ts` forbids inventing entity facts, so the only
 * honest behaviour for an unconfirmed value is to omit it. That is exactly what the
 * placeholder guard below does.
 */

import { BRAND_EMAILS } from "./brand-emails";
import { COMPANY, type DivisionKey } from "./company";
import { LEGAL } from "./legal";

export type DocumentIssuer = {
  /** Legal entity that issues the document — COMPANY.group.legalName. */
  name: string;
  /** Trading label shown as the document's division header — "Henry Onyx <Division>". */
  divisionLabel: string;
  /** Registered-office lines, with unconfirmed fields omitted (never a placeholder). */
  addressLines: string[];
  /** CAC RC number, or null while unconfirmed. */
  rcNumber: string | null;
  /** FIRS TIN / VAT identifier, or null while unconfirmed. */
  vatNumber: string | null;
  /** Billing contact inbox (config-sourced). */
  contactEmail: string;
  /** Group support phone (config-sourced). */
  contactPhone: string | null;
};

/**
 * A registry value is "confirmed" only when it is a non-empty string that does not
 * carry the `[OWNER-TO-CONFIRM …]` sentinel. Anything else is omitted from the
 * rendered document rather than printed — the rubric forbids publishing a
 * placeholder as if it were a fact.
 */
export function isConfirmedLegalValue(value: string | null | undefined): value is string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return false;
  return !/\[OWNER-TO-CONFIRM/i.test(trimmed);
}

function confirmedOrNull(value: string | null | undefined): string | null {
  return isConfirmedLegalValue(value) ? value.trim() : null;
}

/**
 * Compose the registered-office address into display lines, dropping any
 * unconfirmed component. Order: street · "city, state postalCode" · country.
 *
 * The STREET is the anchor: with no confirmed street the office is not meaningfully
 * set, so the whole block is omitted (we never print a lonely "Nigeria"). This is
 * the "ship RC-only now" behaviour — the office block appears in full the moment the
 * registered office is filled in `LEGAL.entity.registeredOffice`, with zero code change.
 */
function buildRegisteredOfficeLines(): string[] {
  const office = LEGAL.entity.registeredOffice;

  const street = confirmedOrNull(office.street);
  if (!street) return [];

  const lines: string[] = [street];

  const city = confirmedOrNull(office.city);
  const state = confirmedOrNull(office.state);
  const postalCode = confirmedOrNull(office.postalCode);
  const locality = [city, state].filter(Boolean).join(", ");
  const localityLine = [locality, postalCode].filter(Boolean).join(" ").trim();
  if (localityLine) lines.push(localityLine);

  const country = confirmedOrNull(office.country);
  if (country) lines.push(country);

  return lines;
}

/**
 * Build the legal issuer for a branded money document. `division` falls back to the
 * group ("hub") when null/unknown, so a group-level document still issues correctly.
 */
export function buildDocumentIssuer(division?: string | null): DocumentIssuer {
  const key = (division ?? "") as DivisionKey;
  const divisionConfig = COMPANY.divisions[key] ?? COMPANY.divisions.hub;

  return {
    name: COMPANY.group.legalName,
    divisionLabel: divisionConfig.name,
    addressLines: buildRegisteredOfficeLines(),
    rcNumber: confirmedOrNull(LEGAL.entity.rcNumber),
    vatNumber: confirmedOrNull(LEGAL.entity.tin),
    contactEmail: BRAND_EMAILS.billing,
    contactPhone: confirmedOrNull(COMPANY.group.supportPhone),
  };
}
