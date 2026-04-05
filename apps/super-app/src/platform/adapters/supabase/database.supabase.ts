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
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  async fetchDivisions(): Promise<DbResult<Division[] | null>> {
    const { data, error } = await this.client.from("divisions").select("*").order("name");
    if (error) return { ok: false, error: error.message };
    if (!data?.length) return { ok: true, data: null };
    return { ok: true, data: data.map((row) => mapDivisionRow(row as DivisionRow)) };
  }

  async listActivity(limit = 8): Promise<DbResult<ActivityItem[]>> {
    // Placeholder until unified activity table exists; merge from modules later.
    const mock: ActivityItem[] = [
      {
        id: "remote-placeholder",
        title: "Connect activity spine",
        subtitle: "Wire Supabase activity feed when schema is ready.",
        divisionSlug: "hub",
        status: "pending",
        at: new Date().toISOString(),
      },
    ];
    return { ok: true, data: mock.slice(0, limit) };
  }
}
