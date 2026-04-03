import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getOptionalEnv } from "@/lib/env";

const SUPABASE_URL = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") || "";

export async function createSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(tokens) {
        try {
          for (const { name, value, options } of tokens) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server component — read-only cookies
        }
      },
    },
  });
}
