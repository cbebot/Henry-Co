import "server-only";

import { createAdminSupabase } from "@/lib/supabase";

const STATUS_EVENT_TYPES = [
  "booking_status_updated",
  "service_execution_status_updated",
  "rider_status_updated",
] as const;

const REVIEW_MEDIA_EVENT_TYPE = "review_media_attached";

type BookingLike = {
  id: string;
  status: string | null;
};

type ReviewLike = {
  id: string;
};

type ReviewMediaRuntime = {
  photo_url: string | null;
  photo_public_id: string | null;
};

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asText(value: unknown) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || null;
}

export async function getEffectiveStatusMap(bookingIds: string[]) {
  const ids = [...new Set(bookingIds.map((value) => String(value || "").trim()).filter(Boolean))];
  const map = new Map<string, string>();

  if (ids.length === 0) {
    return map;
  }

  try {
    const supabase = createAdminSupabase();
    const limit = Math.max(400, Math.min(2500, ids.length * 10));
    const { data } = await supabase
      .from("care_security_logs")
      .select("event_type, success, details, created_at")
      .in("event_type", [...STATUS_EVENT_TYPES])
      .eq("success", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    const idSet = new Set(ids);

    for (const row of data ?? []) {
      const details = asRecord(row.details);
      const bookingId = asText(details?.booking_id);
      const effectiveStatus =
        asText(details?.effective_status) ||
        asText(details?.requested_status) ||
        asText(details?.status);

      if (!bookingId || !effectiveStatus || !idSet.has(bookingId) || map.has(bookingId)) {
        continue;
      }

      map.set(bookingId, effectiveStatus.toLowerCase());
    }
  } catch {
    return map;
  }

  return map;
}

export async function applyEffectiveBookingStatuses<T extends BookingLike>(rows: T[]) {
  const map = await getEffectiveStatusMap(rows.map((row) => row.id));

  return rows.map((row) => {
    const effectiveStatus = map.get(String(row.id));
    if (!effectiveStatus) {
      return row as T & { raw_status?: string | null };
    }

    return {
      ...row,
      raw_status: row.status,
      status: effectiveStatus,
    } as T & { raw_status?: string | null };
  });
}

export async function applyEffectiveBookingStatus<T extends BookingLike>(row: T | null | undefined) {
  if (!row) return row;
  const [patched] = await applyEffectiveBookingStatuses([row]);
  return patched ?? row;
}

export async function getReviewMediaMap(reviewIds: string[]) {
  const ids = [...new Set(reviewIds.map((value) => String(value || "").trim()).filter(Boolean))];
  const map = new Map<string, ReviewMediaRuntime>();

  if (ids.length === 0) {
    return map;
  }

  try {
    const supabase = createAdminSupabase();
    const limit = Math.max(200, Math.min(1200, ids.length * 6));
    const { data } = await supabase
      .from("care_security_logs")
      .select("details, created_at")
      .eq("event_type", REVIEW_MEDIA_EVENT_TYPE)
      .eq("success", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    const idSet = new Set(ids);

    for (const row of data ?? []) {
      const details = asRecord(row.details);
      const reviewId = asText(details?.review_id);

      if (!reviewId || !idSet.has(reviewId) || map.has(reviewId)) {
        continue;
      }

      map.set(reviewId, {
        photo_url: asText(details?.photo_url),
        photo_public_id: asText(details?.photo_public_id),
      });
    }
  } catch {
    return map;
  }

  return map;
}

export async function applyReviewMedia<T extends ReviewLike>(rows: T[]) {
  const map = await getReviewMediaMap(rows.map((row) => row.id));

  return rows.map((row) => {
    const media = map.get(String(row.id));
    if (!media) {
      return row as T & Partial<ReviewMediaRuntime>;
    }

    return {
      ...row,
      ...media,
    } as T & Partial<ReviewMediaRuntime>;
  });
}
