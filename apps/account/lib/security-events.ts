import "server-only";

import { headers } from "next/headers";
import { createAdminSupabase } from "@/lib/supabase";

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
    category: asNullableText(row.event_category) || classification.category,
    riskLevel: asNullableText(row.risk_level) || classification.riskLevel,
    createdAt: asText(row.created_at),
    ipAddress: asNullableText(row.ip_address),
    deviceSummary: asNullableText(row.device_summary) || summarizeUserAgent(userAgent),
    locationSummary: summarizeLocation({
      ipAddress: asNullableText(row.ip_address),
      locationSummary: asNullableText(row.location_summary),
    }),
    userAgent,
    metadata,
  };
}

export async function detectSecurityRequestContext() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",").map((item) => item.trim()).filter(Boolean)[0] ||
    headerStore.get("x-real-ip") ||
    null;

  return {
    ipAddress,
    userAgent: headerStore.get("user-agent"),
    locationSummary: null as string | null,
  };
}

export async function logSecurityEvent(input: {
  userId: string;
  eventType: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  locationSummary?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminSupabase();
  const classification = classifySecurityEvent(input.eventType);
  const userAgent = asNullableText(input.userAgent);
  const payload = {
    user_id: input.userId,
    event_type: input.eventType,
    ip_address: asNullableText(input.ipAddress),
    user_agent: userAgent,
    event_category: classification.category,
    risk_level: classification.riskLevel,
    device_summary: summarizeUserAgent(userAgent),
    location_summary: summarizeLocation({
      ipAddress: asNullableText(input.ipAddress),
      locationSummary: asNullableText(input.locationSummary),
    }),
    metadata: input.metadata || {},
  };

  const { error } = await admin.from("customer_security_log").insert(payload as never);
  if (!error) return;

  await admin.from("customer_security_log").insert({
    user_id: input.userId,
    event_type: input.eventType,
    ip_address: asNullableText(input.ipAddress),
    user_agent: userAgent,
  } as never);
}
