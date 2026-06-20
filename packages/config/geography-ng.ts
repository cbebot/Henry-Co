// Nigeria delivery geography — the single source of truth for the 36 states + FCT
// and the 6 geopolitical zones. Pure + dependency-free so the marketplace
// checkout, the seller settings UI, and the buyer state picker share one list.
// (V3-FREESHIP-02 — Delivery Promises.)

export type NgZone =
  | "north_central"
  | "north_east"
  | "north_west"
  | "south_east"
  | "south_south"
  | "south_west";

/** Lowercase, hyphenated slug (e.g. "enugu", "akwa-ibom", "fct"). */
export type NgStateCode = string;

export type NgState = { code: NgStateCode; name: string; zone: NgZone };

export const NG_ZONE_LABELS: Record<NgZone, string> = {
  north_central: "North Central",
  north_east: "North East",
  north_west: "North West",
  south_east: "South East",
  south_south: "South South",
  south_west: "South West",
};

/** The 36 states + the Federal Capital Territory (37 entries). */
export const NG_STATES: ReadonlyArray<NgState> = [
  // North Central
  { code: "benue", name: "Benue", zone: "north_central" },
  { code: "fct", name: "Federal Capital Territory", zone: "north_central" },
  { code: "kogi", name: "Kogi", zone: "north_central" },
  { code: "kwara", name: "Kwara", zone: "north_central" },
  { code: "nasarawa", name: "Nasarawa", zone: "north_central" },
  { code: "niger", name: "Niger", zone: "north_central" },
  { code: "plateau", name: "Plateau", zone: "north_central" },
  // North East
  { code: "adamawa", name: "Adamawa", zone: "north_east" },
  { code: "bauchi", name: "Bauchi", zone: "north_east" },
  { code: "borno", name: "Borno", zone: "north_east" },
  { code: "gombe", name: "Gombe", zone: "north_east" },
  { code: "taraba", name: "Taraba", zone: "north_east" },
  { code: "yobe", name: "Yobe", zone: "north_east" },
  // North West
  { code: "jigawa", name: "Jigawa", zone: "north_west" },
  { code: "kaduna", name: "Kaduna", zone: "north_west" },
  { code: "kano", name: "Kano", zone: "north_west" },
  { code: "katsina", name: "Katsina", zone: "north_west" },
  { code: "kebbi", name: "Kebbi", zone: "north_west" },
  { code: "sokoto", name: "Sokoto", zone: "north_west" },
  { code: "zamfara", name: "Zamfara", zone: "north_west" },
  // South East
  { code: "abia", name: "Abia", zone: "south_east" },
  { code: "anambra", name: "Anambra", zone: "south_east" },
  { code: "ebonyi", name: "Ebonyi", zone: "south_east" },
  { code: "enugu", name: "Enugu", zone: "south_east" },
  { code: "imo", name: "Imo", zone: "south_east" },
  // South South
  { code: "akwa-ibom", name: "Akwa Ibom", zone: "south_south" },
  { code: "bayelsa", name: "Bayelsa", zone: "south_south" },
  { code: "cross-river", name: "Cross River", zone: "south_south" },
  { code: "delta", name: "Delta", zone: "south_south" },
  { code: "edo", name: "Edo", zone: "south_south" },
  { code: "rivers", name: "Rivers", zone: "south_south" },
  // South West
  { code: "ekiti", name: "Ekiti", zone: "south_west" },
  { code: "lagos", name: "Lagos", zone: "south_west" },
  { code: "ogun", name: "Ogun", zone: "south_west" },
  { code: "ondo", name: "Ondo", zone: "south_west" },
  { code: "osun", name: "Osun", zone: "south_west" },
  { code: "oyo", name: "Oyo", zone: "south_west" },
];

/** Zone → its label + member state codes (derived from {@link NG_STATES}). */
export const NG_ZONES: Record<NgZone, { label: string; states: NgStateCode[] }> = (() => {
  const out = {} as Record<NgZone, { label: string; states: NgStateCode[] }>;
  for (const zone of Object.keys(NG_ZONE_LABELS) as NgZone[]) {
    out[zone] = { label: NG_ZONE_LABELS[zone], states: [] };
  }
  for (const s of NG_STATES) out[s.zone].states.push(s.code);
  return out;
})();

const BY_CODE = new Map(NG_STATES.map((s) => [s.code, s] as const));
const BY_NAME = new Map(NG_STATES.map((s) => [s.name.toLowerCase(), s.code] as const));
const STATE_ALIASES: Record<string, NgStateCode> = {
  abuja: "fct",
  "fct abuja": "fct",
  "abuja fct": "fct",
};

export function zoneForState(code: NgStateCode): NgZone | null {
  return BY_CODE.get(code)?.zone ?? null;
}

export function statesInZone(zone: NgZone): NgStateCode[] {
  return NG_ZONES[zone]?.states ?? [];
}

/**
 * Map a possibly-messy free-text region to a canonical state code, or `null`
 * when it is not a recognized state. Strict — never guesses (so a town like
 * "Amama" returns null rather than a wrong state).
 */
export function normalizeStateInput(text: string | null | undefined): NgStateCode | null {
  if (!text) return null;
  let t = String(text).trim().toLowerCase();
  if (!t) return null;
  t = t.replace(/\s+state$/, "").trim();
  if (!t) return null;
  const hyphenated = t.replace(/\s+/g, "-");
  if (BY_CODE.has(hyphenated)) return hyphenated;
  if (BY_NAME.has(t)) return BY_NAME.get(t) ?? null;
  if (STATE_ALIASES[t]) return STATE_ALIASES[t];
  return null;
}
