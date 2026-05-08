/**
 * V2-DASH-05 — /api/dashboard/suggestions
 *
 * Returns the empty-state suggestions for the Cmd+K palette: a ranked
 * list pulled from the user's lifecycle snapshot + recent customer
 * notifications. RLS enforces per-user scope at the database (see
 * suggestions.ts header for the policy citations).
 *
 * Anti-pattern #11: read-only endpoint, no state changes. Anti-pattern
 * #7: role gating is inherent in the user-scoped Supabase client; no
 * client-side role re-derivation.
 */

import { NextResponse } from "next/server";
import { buildPaletteSuggestions, toSuggestionsWire } from "@henryco/search-core";

import { createSupabaseServer } from "@/lib/supabase/server";
import { requireAccountUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireAccountUser();
  const supabase = await createSupabaseServer();

  const suggestions = await buildPaletteSuggestions({
    supabase,
    user_id: user.id,
    limit: 8,
  });

  return NextResponse.json(toSuggestionsWire(suggestions), {
    headers: {
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
