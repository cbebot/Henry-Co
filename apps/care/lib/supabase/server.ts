import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getRequiredEnv } from "@/lib/env";

export async function createSupabaseServer() {
  const cookieStore = await cookies();
  const url = getRequiredEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    "Missing NEXT_PUBLIC_SUPABASE_URL for the server Supabase client."
  );
  const anon = getRequiredEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY for the server Supabase client."
  );

  return createServerClient(
    url,
    anon,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // ignore if called where cookies cannot be set
          }
        },
      },
    }
  );
}
