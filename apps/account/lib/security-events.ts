import "server-only";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { createAdminSupabase } from "@/lib/supabase";

export type SecurityRequestContext = {
  ipAddress: string | null;
  userAgent: string | null;
  locationSummary: string | null;
  /** ISO country code from the edge geo headers, uppercased. */
  country: string | null;
};

export type SecurityEventInput = {
  /** Optional explicit row id (uuid) so callers can deep-link to this event. */
  id?: string;
  userId: string;
  eventType: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  locationSummary?: string | null;
  country?: string | null;
  metadata?: Record<string, unknown>;
};

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableText(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function compact(parts: Array<string | null | undefined>) {
  return parts.map((value) => String(value || "").trim()).filter(Boolean);
}

function humanize(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function classifySecurityEvent(eventType: string | null | undefined) {
  const normalized = asText(eventType).toLowerCase();

  if (
    normalized.includes("suspicious") ||
    normalized.includes("failed") ||
    normalized.includes("blocked") ||
    normalized.includes("alert")
  ) {
    return { category: "alert", riskLevel: "high" as const };
  }

  if (
    normalized.includes("password") ||
    normalized.includes("credential") ||
    normalized.includes("recovery") ||
    normalized.includes("otp")
  ) {
    return { category: "sensitive_change", riskLevel: "medium" as const };
  }

  if (normalized.includes("sign_out") || normalized.includes("logout")) {
    return { category: "session", riskLevel: "low" as const };
  }

  return { category: "sign_in", riskLevel: "low" as const };
}

export function summarizeUserAgent(userAgent: string | null | undefined) {
  const value = asText(userAgent).toLowerCase();
  if (!value) return "Unknown device";

  const device = value.includes("mobile")
    ? "Mobile"
    : value.includes("tablet")
      ? "Tablet"
      : "Desktop";

  const browser = value.includes("edg/")
    ? "Edge"
    : value.includes("chrome/")
      ? "Chrome"
      : value.includes("firefox/")
        ? "Firefox"
        : value.includes("safari/") && !value.includes("chrome/")
          ? "Safari"
          : "Browser";

  const platform = value.includes("windows")
    ? "Windows"
    : value.includes("android")
      ? "Android"
      : value.includes("iphone") || value.includes("ios")
        ? "iPhone"
        : value.includes("mac os")
          ? "macOS"
          : value.includes("linux")
            ? "Linux"
            : "Unknown OS";

  return `${device} · ${browser} on ${platform}`;
}

export function summarizeLocation(input: {
  ipAddress?: string | null;
  locationSummary?: string | null;
}) {
  if (input.locationSummary) return input.locationSummary;
  if (!input.ipAddress) return "Location not available";
  return `Approximate source IP ${input.ipAddress}`;
}

export function buildSecurityEventView(row: Record<string, unknown>) {
  const classification = classifySecurityEvent(asNullableText(row.event_type));
  const metadata = asObject(row.metadata);
  const userAgent = asNullableText(row.user_agent);

  return {
    id: asText(row.id),
    eventType: asText(row.event_type, "security_event"),
    title: humanize(asText(row.event_type, "security_event")),
    category:
      asNullableText(row.event_category) ||
      asNullableText(metadata.event_category) ||
      classification.category,
    riskLevel:
      asNullableText(row.risk_level) ||
      asNullableText(metadata.risk_level) ||
      classification.riskLevel,
    createdAt: asText(row.created_at),
    ipAddress: asNullableText(row.ip_address),
    deviceSummary:
      asNullableText(row.device_summary) ||
      asNullableText(metadata.device_summary) ||
      summarizeUserAgent(userAgent),
    locationSummary: summarizeLocation({
      ipAddress: asNullableText(row.ip_address),
      locationSummary:
        asNullableText(row.location_summary) || asNullableText(metadata.location_summary),
    }),
    userAgent,
    metadata,
  };
}

export async function detectSecurityRequestContext(): Promise<SecurityRequestContext> {
  try {
    const headerStore = await headers();
    const forwardedFor = headerStore.get("x-forwarded-for") || "";
    const ipAddress =
      forwardedFor.split(",")[0]?.trim() ||
      headerStore.get("x-real-ip") ||
      headerStore.get("cf-connecting-ip") ||
      headerStore.get("x-vercel-forwarded-for") ||
      null;
    const userAgent = headerStore.get("user-agent") || null;
    const country =
      (
        headerStore.get("x-vercel-ip-country") ||
        headerStore.get("cf-ipcountry") ||
        headerStore.get("cloudfront-viewer-country") ||
        headerStore.get("x-appengine-country") ||
        ""
      )
        .trim()
        .toUpperCase() || null;
    const locationSummary =
      compact([
        headerStore.get("x-vercel-ip-city"),
        headerStore.get("x-appengine-city"),
        country,
      ]).join(", ") || null;

    return { ipAddress, userAgent, locationSummary, country };
  } catch {
    return {
      ipAddress: null,
      userAgent: null,
      locationSummary: null,
      country: null,
    };
  }
}

export async function logSecurityEvent(input: SecurityEventInput): Promise<string | null> {
  const id = input.id ?? randomUUID();
  try {
    const admin = createAdminSupabase();
    const classification = classifySecurityEvent(input.eventType);
    const userAgent = asNullableText(input.userAgent);
    const country = asNullableText(input.country);
    const locationSummary = summarizeLocation({
      ipAddress: asNullableText(input.ipAddress),
      locationSummary: asNullableText(input.locationSummary),
    });

    // `customer_security_log` has NO dedicated columns for category / risk /
    // device / location / country — they belong in `metadata` (jsonb). The
    // prior version wrote them as columns, so EVERY enriched insert failed and
    // the fallback dropped the context entirely. Persist the rich signal in
    // metadata so the security history + new-country detection actually work.
    const { error } = await admin.from("customer_security_log").insert({
      id,
      user_id: input.userId,
      event_type: input.eventType,
      ip_address: asNullableText(input.ipAddress),
      user_agent: userAgent,
      metadata: {
        ...(input.metadata ?? {}),
        event_category: classification.category,
        risk_level: classification.riskLevel,
        device_summary: summarizeUserAgent(userAgent),
        location_summary: locationSummary,
        ...(country ? { country: country.toUpperCase() } : {}),
      },
    } as never);

    if (error) {
      // Last-resort minimal insert so the event is at least recorded.
      const { error: fallbackError } = await admin.from("customer_security_log").insert({
        id,
        user_id: input.userId,
        event_type: input.eventType,
        ip_address: asNullableText(input.ipAddress),
        user_agent: userAgent,
      } as never);
      if (fallbackError) return null;
    }
    return id;
  } catch {
    // Security logging should never block auth completion.
    return null;
  }
}
