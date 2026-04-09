import "server-only";

import { headers } from "next/headers";
import { createAdminSupabase } from "@/lib/supabase";

export type SecurityRequestContext = {
  ipAddress: string | null;
  userAgent: string | null;
  locationSummary: string | null;
};

export type SecurityEventInput = {
  userId: string;
  eventType: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  locationSummary?: string | null;
  metadata?: Record<string, unknown>;
};

function compact(parts: Array<string | null | undefined>) {
  return parts.map((value) => String(value || "").trim()).filter(Boolean);
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
    const locationSummary =
      compact([
        headerStore.get("x-vercel-ip-city"),
        headerStore.get("x-appengine-city"),
        headerStore.get("x-vercel-ip-country"),
        headerStore.get("cf-ipcountry"),
        headerStore.get("cloudfront-viewer-country"),
      ]).join(", ") || null;

    return { ipAddress, userAgent, locationSummary };
  } catch {
    return {
      ipAddress: null,
      userAgent: null,
      locationSummary: null,
    };
  }
}

export async function logSecurityEvent(input: SecurityEventInput) {
  try {
    const admin = createAdminSupabase();
    const { error } = await admin.from("customer_security_log").insert({
      user_id: input.userId,
      event_type: input.eventType,
      ip_address: input.ipAddress || null,
      user_agent: input.userAgent || null,
      metadata: {
        ...(input.metadata ?? {}),
        ...(input.locationSummary ? { location_summary: input.locationSummary } : {}),
      },
    } as never);

    if (error && !String(error.message || "").toLowerCase().includes("metadata")) {
      throw error;
    }

    if (error && String(error.message || "").toLowerCase().includes("metadata")) {
      await admin.from("customer_security_log").insert({
        user_id: input.userId,
        event_type: input.eventType,
        ip_address: input.ipAddress || null,
        user_agent: input.userAgent || null,
      } as never);
    }
  } catch {
    // Security logging should never block auth completion.
  }
}
