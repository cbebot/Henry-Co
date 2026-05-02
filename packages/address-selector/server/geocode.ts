/**
 * V2-ADDR-01 — Server-side Google Places integration.
 *
 * Two endpoints used:
 *   1. Place Autocomplete (legacy, via Maps Web Service URL):
 *        https://maps.googleapis.com/maps/api/place/autocomplete/json
 *   2. Place Details:
 *        https://maps.googleapis.com/maps/api/place/details/json
 *
 * SECURITY:
 *   - Server key (GOOGLE_PLACES_SERVER_KEY) is NEVER sent to the browser.
 *     IP-restrict it in GCP to Vercel egress IPs.
 *   - All client-facing places traffic flows through our /api/places/* proxy
 *     in apps/account, which forwards with the server key.
 *
 * BILLING / SESSIONS:
 *   - Pass the same `sessiontoken` to autocomplete calls and the final
 *     details call. Google bills as one session (Autocomplete is free when
 *     followed by a Details call within the same session).
 *
 * GRACEFUL FALLBACK:
 *   - If GOOGLE_PLACES_SERVER_KEY is unset (preview/dev), return a stub
 *     "fake place" payload so the UI still works for local development.
 *     The stub clearly says "[unverified]" so it cannot be confused with a
 *     real geocoded address.
 */

const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

export interface PlacesPrediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

export interface PlacesDetailsResult {
  place_id: string;
  formatted_address: string;
  street: string;
  city: string;
  state: string | null;
  country: string;
  postal_code: string | null;
  coordinates_lat: number;
  coordinates_lng: number;
}

class PlacesError extends Error {
  status: string;
  detail: string | undefined;
  constructor(status: string, detail?: string) {
    super(`Places API error: ${status}${detail ? ` — ${detail}` : ""}`);
    this.status = status;
    this.detail = detail;
  }
}

export { PlacesError };

function getServerKey(): string | null {
  const key = process.env.GOOGLE_PLACES_SERVER_KEY;
  if (!key || key.length < 10) return null;
  return key;
}

/**
 * Autocomplete predictions for an in-progress query.
 * Returns up to 5 predictions. Empty array if query is too short.
 */
export async function fetchAutocomplete(
  query: string,
  options: { sessionToken: string; countryHint?: string }
): Promise<PlacesPrediction[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const key = getServerKey();
  if (!key) {
    // Dev fallback — single fake prediction so the UI flow still demos.
    return [
      {
        place_id: `__dev_unverified_${encodeURIComponent(trimmed)}`,
        description: `[dev/unverified] ${trimmed}`,
        main_text: trimmed,
        secondary_text: "[unverified — no Places key configured]",
      },
    ];
  }

  const url = new URL(`${PLACES_BASE}/autocomplete/json`);
  url.searchParams.set("input", trimmed);
  url.searchParams.set("sessiontoken", options.sessionToken);
  url.searchParams.set("types", "address");
  if (options.countryHint) {
    url.searchParams.set("components", `country:${options.countryHint.toLowerCase()}`);
  }
  url.searchParams.set("key", key);

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new PlacesError("HTTP_" + res.status);

  const json = (await res.json()) as {
    status: string;
    error_message?: string;
    predictions: Array<{
      place_id: string;
      description: string;
      structured_formatting?: { main_text?: string; secondary_text?: string };
    }>;
  };

  if (json.status !== "OK" && json.status !== "ZERO_RESULTS") {
    throw new PlacesError(json.status, json.error_message);
  }
  if (json.status === "ZERO_RESULTS") return [];

  return (json.predictions ?? []).slice(0, 5).map((p) => ({
    place_id: p.place_id,
    description: p.description,
    main_text: p.structured_formatting?.main_text ?? p.description,
    secondary_text: p.structured_formatting?.secondary_text ?? "",
  }));
}

/**
 * Resolve a place_id to a fully-formed address suitable for storage.
 * Throws PlacesError if the place_id is invalid or quota exceeded.
 */
export async function fetchPlaceDetails(
  placeId: string,
  options: { sessionToken: string }
): Promise<PlacesDetailsResult> {
  const key = getServerKey();
  if (!key) {
    if (placeId.startsWith("__dev_unverified_")) {
      const raw = decodeURIComponent(placeId.replace(/^__dev_unverified_/, ""));
      return {
        place_id: placeId,
        formatted_address: `[unverified] ${raw}`,
        street: raw,
        city: "Unverified City",
        state: null,
        country: "NG",
        postal_code: null,
        coordinates_lat: 0,
        coordinates_lng: 0,
      };
    }
    throw new PlacesError("MISSING_API_KEY", "GOOGLE_PLACES_SERVER_KEY not configured");
  }

  const url = new URL(`${PLACES_BASE}/details/json`);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("sessiontoken", options.sessionToken);
  url.searchParams.set(
    "fields",
    [
      "place_id",
      "formatted_address",
      "address_components",
      "geometry/location",
    ].join(",")
  );
  url.searchParams.set("key", key);

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new PlacesError("HTTP_" + res.status);

  const json = (await res.json()) as {
    status: string;
    error_message?: string;
    result?: {
      place_id: string;
      formatted_address: string;
      address_components: Array<{
        long_name: string;
        short_name: string;
        types: string[];
      }>;
      geometry: { location: { lat: number; lng: number } };
    };
  };

  if (json.status !== "OK" || !json.result) {
    throw new PlacesError(json.status, json.error_message);
  }

  const r = json.result;
  const find = (type: string) =>
    r.address_components.find((c) => c.types.includes(type));

  const streetNumber = find("street_number")?.long_name;
  const route = find("route")?.long_name;
  const subpremise = find("subpremise")?.long_name;
  const street = [subpremise, streetNumber, route].filter(Boolean).join(" ").trim();

  const city =
    find("locality")?.long_name ??
    find("administrative_area_level_2")?.long_name ??
    find("postal_town")?.long_name ??
    find("sublocality_level_1")?.long_name ??
    "";

  const state =
    find("administrative_area_level_1")?.long_name ??
    find("administrative_area_level_2")?.long_name ??
    null;

  const country = find("country")?.short_name ?? "";
  const postalCode = find("postal_code")?.long_name ?? null;

  return {
    place_id: r.place_id,
    formatted_address: r.formatted_address,
    street: street || r.formatted_address.split(",")[0] || "",
    city,
    state,
    country,
    postal_code: postalCode,
    coordinates_lat: r.geometry.location.lat,
    coordinates_lng: r.geometry.location.lng,
  };
}

/**
 * Generate a fresh session token. UUID v4 — 16 random bytes hex-encoded.
 */
export function newSessionToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
