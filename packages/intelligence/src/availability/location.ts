/**
 * V3-38 — coarse viewer-location resolution (PRIVACY-NDPR §1 geo split).
 *
 * Precedence is fixed and tested: the viewer's OWN saved address (a
 * viewer-scoped read the CALLER performs against `user_addresses` — this
 * module never touches a table) always beats IP inference. The IP fallback is
 * COARSE + ADVISORY + DISCLOSED: country, and for Nigeria the state mapped
 * from the ISO-3166-2 region header — NEVER a city, never coordinates, and
 * never persisted per-user. The `source` flag rides to the surface so copy
 * can disclose an approximate location honestly.
 */

import { SUPPORTED_COUNTRIES } from "@henryco/config";
import type { AvailabilityLocation } from "./engine";

/** ISO-3166-2:NG subdivision code → state name (matches `@henryco/config`
 *  geography-ng names, which the coverage seeds also use). */
const NG_SUBDIVISION_NAMES: Record<string, string> = {
  AB: "Abia",
  AD: "Adamawa",
  AK: "Akwa Ibom",
  AN: "Anambra",
  BA: "Bauchi",
  BE: "Benue",
  BO: "Borno",
  BY: "Bayelsa",
  CR: "Cross River",
  DE: "Delta",
  EB: "Ebonyi",
  ED: "Edo",
  EK: "Ekiti",
  EN: "Enugu",
  FC: "Federal Capital Territory",
  GO: "Gombe",
  IM: "Imo",
  JI: "Jigawa",
  KD: "Kaduna",
  KE: "Kebbi",
  KN: "Kano",
  KO: "Kogi",
  KT: "Katsina",
  KW: "Kwara",
  LA: "Lagos",
  NA: "Nasarawa",
  NI: "Niger",
  OG: "Ogun",
  ON: "Ondo",
  OS: "Osun",
  OY: "Oyo",
  PL: "Plateau",
  RI: "Rivers",
  SO: "Sokoto",
  TA: "Taraba",
  YO: "Yobe",
  ZA: "Zamfara",
};

/**
 * Normalize a country value to ISO-3166-1 alpha-2 uppercase. Accepts a code
 * ("ng", "NG") or a supported-country name ("Nigeria" — `user_addresses`
 * stores what the address form collected). Unknown values return null.
 */
export function normalizeCountryCode(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^[a-z]{2}$/i.test(trimmed)) return trimmed.toUpperCase();
  const byName = SUPPORTED_COUNTRIES.find(
    (country) => country.name.toLowerCase() === trimmed.toLowerCase(),
  );
  return byName ? byName.code : null;
}

export interface SavedAddressLocationInput {
  country: string | null;
  state: string | null;
  city: string | null;
}

export interface IpGeoHeadersInput {
  /** e.g. the `x-vercel-ip-country` header value. */
  country: string | null;
  /** e.g. the `x-vercel-ip-country-region` header value (ISO-3166-2 code). */
  region: string | null;
}

/**
 * Resolve the viewer's coarse location. Saved address (viewer-scoped, read by
 * the caller under the session identity) wins; IP geo is the coarse advisory
 * fallback; neither resolvable ⇒ null (and the engine resolves `unknown`).
 */
export function resolveViewerLocation(input: {
  savedAddress?: SavedAddressLocationInput | null;
  ipGeo?: IpGeoHeadersInput | null;
}): AvailabilityLocation | null {
  const saved = input.savedAddress;
  if (saved) {
    const country = normalizeCountryCode(saved.country);
    if (country) {
      return {
        country,
        region: saved.state?.trim() || null,
        city: saved.city?.trim() || null,
        source: "saved_address",
      };
    }
  }

  const ip = input.ipGeo;
  if (ip) {
    const country = normalizeCountryCode(ip.country);
    if (country) {
      const regionCode = ip.region?.trim().toUpperCase() || null;
      const region =
        country === "NG" && regionCode && NG_SUBDIVISION_NAMES[regionCode]
          ? NG_SUBDIVISION_NAMES[regionCode]
          : null;
      // City-precision is deliberately never taken from IP headers.
      return { country, region, city: null, source: "ip_approximate" };
    }
  }

  return null;
}

/**
 * A short, human area label for the viewer's OWN resolved location (used in
 * disclosed copy like "Not available in {area} yet"). City only when the
 * viewer saved it themselves; IP inference labels at region/country grain.
 */
export function describeLocationArea(location: AvailabilityLocation | null): string | null {
  if (!location) return null;
  if (location.source === "saved_address" && location.city) return location.city;
  if (location.region) return location.region;
  const country = SUPPORTED_COUNTRIES.find((entry) => entry.code === location.country);
  return country ? country.name : location.country;
}
