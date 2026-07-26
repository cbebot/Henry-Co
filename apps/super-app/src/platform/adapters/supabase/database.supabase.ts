import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ActivityItem,
  ContactPayload,
  ContactSubmitResult,
  DatabaseAdapter,
  DbResult,
} from "@/platform/contracts/database";
import type { Division } from "@/domain/division";
import { mapDivisionRow, type DivisionRow } from "@/services/divisionMapper";

export class SupabaseDatabaseAdapter implements DatabaseAdapter {
  constructor(private readonly client: SupabaseClient) {}

  async submitContact(payload: ContactPayload): Promise<ContactSubmitResult> {
    const { error } = await this.client.from("contact_submissions").insert({
      name: payload.name,
      email: payload.email,
      topic: payload.topic,
      message: payload.message,
      division_slug: payload.divisionSlug ?? null,
    });
    if (error) {
      console.error("[super-app:db] contact submit failed", error);
      return { ok: false, error: "We couldn't send your message. Please try again shortly." };
    }
    return { ok: true };
  }

  async fetchDivisions(): Promise<DbResult<Division[] | null>> {
    const { data, error } = await this.client.from("divisions").select("*").order("name");
    if (error) {
      console.error("[super-app:db] fetch divisions failed", error);
      return { ok: false, error: "We couldn't load divisions. Please try again." };
    }
    if (!data?.length) return { ok: true, data: null };
    return { ok: true, data: data.map((row) => mapDivisionRow(row as DivisionRow)) };
  }

  async listActivity(limit = 8): Promise<DbResult<ActivityItem[]>> {
    // No unified cross-module activity feed yet — return empty rather than a
    // stand-in row until the real feed is available.
    const items: ActivityItem[] = [];
    return { ok: true, data: items.slice(0, limit) };
  }
}
