import { cleanEnv, splitCsv } from "./_env";

type TypesenseProtocol = "http" | "https";
export type PublicFingerprintRegion = "eu" | "us" | "ap";

export type PublicTypesenseNode = {
  host: string;
  port: number;
  protocol: TypesenseProtocol;
};

function normalizeProtocol(value?: string | null): TypesenseProtocol {
  return cleanEnv(value).toLowerCase() === "http" ? "http" : "https";
}

function normalizePort(value?: string | null, fallback = 443) {
  const numeric = Number(cleanEnv(value));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function parseTypesenseNodes(
  rawNodes: string[],
  fallbackProtocol: TypesenseProtocol,
  fallbackPort: number
) {
  return rawNodes
    .map((entry) => {
      const trimmed = cleanEnv(entry).replace(/^https?:\/\//i, "");
      if (!trimmed) return null;

      const [host, portValue] = trimmed.split(":");
      if (!host) return null;

      return {
        host,
        port: normalizePort(portValue, fallbackPort),
        protocol: fallbackProtocol,
      } satisfies PublicTypesenseNode;
    })
    .filter((entry): entry is PublicTypesenseNode => Boolean(entry));
}

function normalizeFingerprintRegion(value?: string | null): PublicFingerprintRegion {
  const clean = cleanEnv(value).toLowerCase();
  if (clean === "us" || clean === "ap") return clean;
  return "eu";
}

export function getPublicGoogleCalendarConfig() {
  return {
    apiKey: cleanEnv(process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY),
  };
}

export function getPublicOneSignalConfig() {
  const appId = cleanEnv(process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID);
  const safariWebId = cleanEnv(process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID);

  return {
    appId,
    safariWebId,
    enabled: Boolean(appId),
  };
}

export function getPublicFingerprintConfig() {
  return {
    apiKey: cleanEnv(process.env.NEXT_PUBLIC_FINGERPRINTJS_API_KEY),
    region: normalizeFingerprintRegion(process.env.NEXT_PUBLIC_FINGERPRINTJS_REGION),
  };
}

export function getPublicMapboxConfig() {
  return {
    accessToken:
      cleanEnv(process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) ||
      cleanEnv(process.env.NEXT_PUBLIC_MAPBOX_TOKEN),
  };
}

export function getPublicStripeConfig() {
  const publishableKey = cleanEnv(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  return {
    publishableKey,
    isConfigured: Boolean(publishableKey),
    isTestMode: publishableKey.startsWith("pk_test_"),
  };
}

export function getPublicSentryConfig() {
  return {
    dsn: cleanEnv(process.env.NEXT_PUBLIC_SENTRY_DSN),
  };
}

export function getPublicTypesenseConfig() {
  const protocol = normalizeProtocol(process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL);
  const port = normalizePort(process.env.NEXT_PUBLIC_TYPESENSE_PORT, protocol === "https" ? 443 : 80);
  const host = cleanEnv(process.env.NEXT_PUBLIC_TYPESENSE_HOST);
  const declaredNodes = parseTypesenseNodes(splitCsv(process.env.NEXT_PUBLIC_TYPESENSE_NODES), protocol, port);

  const nodes =
    declaredNodes.length > 0
      ? declaredNodes
      : host
        ? [{ host, port, protocol }]
        : [];

  return {
    host,
    port,
    protocol,
    nodes,
    searchApiKey: cleanEnv(process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY),
  };
}

export function getPublicServiceMatrix() {
  return {
    calendar: getPublicGoogleCalendarConfig(),
    fingerprint: getPublicFingerprintConfig(),
    mapbox: getPublicMapboxConfig(),
    onesignal: getPublicOneSignalConfig(),
    sentry: getPublicSentryConfig(),
    stripe: getPublicStripeConfig(),
    typesense: getPublicTypesenseConfig(),
  };
}
