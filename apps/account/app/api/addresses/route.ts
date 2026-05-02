/**
 * V2-ADDR-01 — Canonical user_addresses CRUD.
 *
 *   GET   /api/addresses                → list current user's addresses
 *   POST  /api/addresses                → create
 *   PATCH /api/addresses?id=<uuid>      → update (partial)
 *   DELETE /api/addresses?id=<uuid>     → delete
 *
 * Auth required. RLS on user_addresses enforces ownership; we use the
 * authed Supabase client (NOT service role) so RLS is the ultimate gatekeeper.
 *
 * The legacy POST at /api/addresses/create stays for one redirect-cycle to
 * avoid breaking in-flight clients; it now forwards to this canonical route.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { USER_FACING_SAVE, logApiError } from "@/lib/user-facing-error";
import {
  validateAddressInput,
  type UserAddressInput,
} from "@henryco/address-selector";

export const runtime = "nodejs";

async function getAuthedSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
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
}

export async function GET() {
  try {
    const supabase = await getAuthedSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      logApiError("addresses/list", error);
      return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
    }

    return NextResponse.json({ addresses: data ?? [] });
  } catch (err) {
    logApiError("addresses/list", err);
    return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getAuthedSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as UserAddressInput;
    const validationErrors = validateAddressInput(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", validationErrors },
        { status: 400 }
      );
    }

    // RLS enforces user_id = auth.uid() on the with_check clause.
    const { data, error } = await supabase
      .from("user_addresses")
      .insert({
        user_id: user.id,
        label: body.label,
        full_name: body.full_name ?? null,
        phone: body.phone ?? null,
        country: body.country,
        state: body.state ?? null,
        city: body.city,
        street: body.street,
        postal_code: body.postal_code ?? null,
        coordinates_lat: body.coordinates_lat,
        coordinates_lng: body.coordinates_lng,
        google_place_id: body.google_place_id,
        formatted_address: body.formatted_address,
        is_default: body.is_default ?? false,
      })
      .select("*")
      .single();

    if (error) {
      // unique violation = label already taken
      if (error.code === "23505") {
        return NextResponse.json(
          {
            error:
              "You already have an address saved with that label. Edit the existing one instead, or pick a different label.",
            code: "label_in_use",
          },
          { status: 409 }
        );
      }
      logApiError("addresses/create", error);
      return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
    }

    return NextResponse.json({ address: data });
  } catch (err) {
    logApiError("addresses/create", err);
    return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await getAuthedSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const body = (await request.json()) as Partial<UserAddressInput>;
    const update: Record<string, unknown> = {};
    if (body.full_name !== undefined) update.full_name = body.full_name;
    if (body.phone !== undefined) update.phone = body.phone;
    if (body.country !== undefined) update.country = body.country;
    if (body.state !== undefined) update.state = body.state;
    if (body.city !== undefined) update.city = body.city;
    if (body.street !== undefined) update.street = body.street;
    if (body.postal_code !== undefined) update.postal_code = body.postal_code;
    if (body.coordinates_lat !== undefined) update.coordinates_lat = body.coordinates_lat;
    if (body.coordinates_lng !== undefined) update.coordinates_lng = body.coordinates_lng;
    if (body.google_place_id !== undefined) update.google_place_id = body.google_place_id;
    if (body.formatted_address !== undefined) update.formatted_address = body.formatted_address;
    if (body.is_default !== undefined) update.is_default = body.is_default;

    // Editing a geocoded address invalidates KYC verification — re-match
    // happens via the KYC review flow (A3 cron).
    if (body.street !== undefined || body.city !== undefined || body.country !== undefined) {
      update.kyc_verified = false;
      update.kyc_verified_at = null;
      update.kyc_match_score = null;
      update.kyc_match_method = null;
    }

    const { data, error } = await supabase
      .from("user_addresses")
      .update(update)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      logApiError("addresses/update", error);
      return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
    }

    return NextResponse.json({ address: data });
  } catch (err) {
    logApiError("addresses/update", err);
    return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await getAuthedSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const { error } = await supabase
      .from("user_addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logApiError("addresses/delete", error);
      return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logApiError("addresses/delete", err);
    return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
  }
}
