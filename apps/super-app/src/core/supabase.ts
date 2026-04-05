import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

import { getEnv, isSupabaseConfigured } from "@/core/env";
import type { Database } from "@/core/database.types";

let client: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient() {
  const env = getEnv();
  if (!isSupabaseConfigured(env)) {
    return null;
  }
  if (!client) {
    client = createClient<Database>(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
