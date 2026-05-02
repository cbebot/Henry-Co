/**
 * V2-ADDR-01 — Places Autocomplete proxy.
 *
 * Holds GOOGLE_PLACES_SERVER_KEY server-side. Never exposes the key.
 * Auth required (must be logged in to keep this from being a public traffic
 * source against our quota).
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { fetchAutocomplete, PlacesError } from "@henryco/address-selector/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(tokens) {
            for (const { name, value, options } of tokens) {
              try {
                cookieStore.set(name, value, options);
              } catch {}
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const query = url.searchParams.get("q") ?? "";
    const sessionToken = url.searchParams.get("session") ?? "";
    const country = url.searchParams.get("country") ?? undefined;

    if (!sessionToken || sessionToken.length < 16) {
      return NextResponse.json({ error: "Missing session" }, { status: 400 });
    }
    if (query.trim().length < 3) {
      return NextResponse.json({ predictions: [] });
    }

    const predictions = await fetchAutocomplete(query, {
      sessionToken,
      countryHint: country,
    });

    return NextResponse.json({ predictions });
  } catch (err) {
    const status = err instanceof PlacesError ? 502 : 500;
    return NextResponse.json(
      {
        error: "Address lookup failed",
        detail: err instanceof PlacesError ? err.status : undefined,
      },
      { status }
    );
  }
}
