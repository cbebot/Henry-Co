import { getEnv, isSupabaseConfigured } from "@/core/env";
import { getSupabaseClient } from "@/core/supabase";

export type ContactPayload = {
  name: string;
  email: string;
  topic: string;
  message: string;
  divisionSlug?: string | null;
};

export async function submitContact(payload: ContactPayload): Promise<{ ok: true } | { ok: false; error: string }> {
  const env = getEnv();
  if (!isSupabaseConfigured(env)) {
    return {
      ok: false,
      error: "Staging Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and ANON key.",
    };
  }
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { ok: false, error: "Supabase client unavailable." };
  }
  const { error } = await supabase.from("contact_submissions").insert({
    name: payload.name,
    email: payload.email,
    topic: payload.topic,
    message: payload.message,
    division_slug: payload.divisionSlug ?? null,
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
