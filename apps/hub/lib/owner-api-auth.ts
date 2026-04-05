import "server-only";

import { NextResponse } from "next/server";
import type { OwnerAuthResult } from "@/app/lib/owner-auth";

export function ownerAuthDeniedResponse(auth: Extract<OwnerAuthResult, { ok: false }>) {
  if (auth.reason === "misconfigured") {
    return NextResponse.json(
      {
        error:
          "Command center data backend is not configured. Verify Supabase environment variables for this deployment.",
        code: "MISCONFIGURED",
      },
      { status: 503 },
    );
  }
  return NextResponse.json({ error: "Access denied." }, { status: 403 });
}
