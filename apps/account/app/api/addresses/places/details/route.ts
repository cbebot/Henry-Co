/**
 * V2-ADDR-01 — Places Details proxy.
 *
 * Resolves a place_id to a fully-formed address. Same auth + key handling
 * as autocomplete. Pass the same `session` token used for the corresponding
 * autocomplete calls so Google bills as one session.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { fetchPlaceDetails, PlacesError } from "@henryco/address-selector/server";

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
    const placeId = url.searchParams.get("placeId") ?? "";
    const sessionToken = url.searchParams.get("session") ?? "";

    if (!placeId) {
      return NextResponse.json({ error: "Missing placeId" }, { status: 400 });
    }
    if (!sessionToken || sessionToken.length < 16) {
      return NextResponse.json({ error: "Missing session" }, { status: 400 });
    }

    const details = await fetchPlaceDetails(placeId, { sessionToken });
    return NextResponse.json(details);
  } catch (err) {
    const status = err instanceof PlacesError ? 502 : 500;
    return NextResponse.json(
      {
        error: "Address details failed",
        detail: err instanceof PlacesError ? err.status : undefined,
      },
      { status }
    );
  }
}
