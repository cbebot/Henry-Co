import "server-only";

import Stripe from "stripe";
import Typesense from "typesense";
import { cleanEnv, splitCsv } from "./_env";
import { getPublicTypesenseConfig } from "./integrations";

type TypesenseProtocol = "http" | "https";

function normalizeProtocol(value?: string | null): TypesenseProtocol {
  return cleanEnv(value).toLowerCase() === "http" ? "http" : "https";
}

function normalizePort(value?: string | null, fallback = 443) {
  const numeric = Number(cleanEnv(value));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function parseTypesenseNodes() {
  const publicConfig = getPublicTypesenseConfig();
  const protocol = normalizeProtocol(process.env.TYPESENSE_PROTOCOL || publicConfig.protocol);
  const port = normalizePort(
    process.env.TYPESENSE_PORT,
    protocol === "https" ? 443 : 80
  );
  const host = cleanEnv(process.env.TYPESENSE_HOST || publicConfig.host);

  const declared = splitCsv(process.env.TYPESENSE_NODES || process.env.NEXT_PUBLIC_TYPESENSE_NODES)
    .map((entry) => {
      const trimmed = cleanEnv(entry).replace(/^https?:\/\//i, "");
      if (!trimmed) return null;
      const [nodeHost, nodePort] = trimmed.split(":");
      if (!nodeHost) return null;
      return {
        host: nodeHost,
        port: normalizePort(nodePort, port),
        protocol,
      };
    })
    .filter(Boolean) as Array<{ host: string; port: number; protocol: TypesenseProtocol }>;

  if (declared.length > 0) {
    return declared;
  }

  if (!host) {
    return [];
  }

  return [{ host, port, protocol }];
}

let stripeServerClient: Stripe | null = null;
let typesenseAdminClient: Typesense.Client | null = null;
let typesenseSearchClient: Typesense.Client | null = null;

export function getStripeServerClient() {
  const secretKey = cleanEnv(process.env.STRIPE_SECRET_KEY);
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  if (!stripeServerClient) {
    stripeServerClient = new Stripe(secretKey);
  }

  return stripeServerClient;
}

export function getTypesenseAdminClient() {
  const apiKey = cleanEnv(process.env.TYPESENSE_ADMIN_API_KEY);
  const nodes = parseTypesenseNodes();

  if (!apiKey) {
    throw new Error("TYPESENSE_ADMIN_API_KEY is not configured.");
  }

  if (!nodes.length) {
    throw new Error("Typesense nodes are not configured.");
  }

  if (!typesenseAdminClient) {
    typesenseAdminClient = new Typesense.Client({
      nodes,
      apiKey,
      connectionTimeoutSeconds: 10,
    });
  }

  return typesenseAdminClient;
}

export function getTypesenseSearchClient() {
  const publicConfig = getPublicTypesenseConfig();
  const apiKey =
    cleanEnv(process.env.TYPESENSE_SEARCH_API_KEY) ||
    cleanEnv(process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY);
  const nodes = parseTypesenseNodes();

  if (!apiKey) {
    throw new Error("TYPESENSE_SEARCH_API_KEY is not configured.");
  }

  if (!nodes.length && !publicConfig.nodes.length) {
    throw new Error("Typesense nodes are not configured.");
  }

  if (!typesenseSearchClient) {
    typesenseSearchClient = new Typesense.Client({
      nodes: nodes.length ? nodes : publicConfig.nodes,
      apiKey,
      connectionTimeoutSeconds: 10,
    });
  }

  return typesenseSearchClient;
}

export function getTwilioConfig() {
  return {
    accountSid: cleanEnv(process.env.TWILIO_ACCOUNT_SID),
    apiKeySid: cleanEnv(process.env.TWILIO_API_KEY_SID),
    authToken: cleanEnv(process.env.TWILIO_AUTH_TOKEN),
    whatsappFrom: cleanEnv(process.env.TWILIO_WHATSAPP_FROM),
  };
}

export function getFreshdeskConfig() {
  const domain = cleanEnv(process.env.FRESHDESK_DOMAIN);
  return {
    domain,
    apiKey: cleanEnv(process.env.FRESHDESK_API_KEY),
    baseUrl: domain ? `https://${domain}/api/v2` : "",
  };
}

export function getDeepLConfig() {
  return {
    apiKey: cleanEnv(process.env.DEEPL_API_KEY),
  };
}

export function getSignWellConfig() {
  return {
    apiKey: cleanEnv(process.env.SIGNWELL_API_KEY),
  };
}

export function getOpenRateConfig() {
  return {
    appId: cleanEnv(process.env.OPENRATE_APP_ID),
  };
}

export function getSentryBuildConfig() {
  return {
    dsn: cleanEnv(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
    authToken: cleanEnv(process.env.SENTRY_AUTH_TOKEN),
    org: cleanEnv(process.env.SENTRY_ORG),
    project: cleanEnv(process.env.SENTRY_PROJECT),
  };
}

export function getServerMapboxConfig() {
  return {
    secretToken: cleanEnv(process.env.MAPBOX_SECRET_TOKEN),
  };
}

export function getGoogleCalendarServerConfig() {
  return {
    apiKey:
      cleanEnv(process.env.GOOGLE_CALENDAR_API_KEY) ||
      cleanEnv(process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY),
  };
}

