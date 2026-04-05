import { NextResponse } from "next/server";
import { getMarketplaceShellState } from "@/lib/marketplace/data";
import { createAdminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

export async function GET() {
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);
  const admin = createAdminSupabase();
  const shell = await getMarketplaceShellState();
  const checks = await Promise.allSettled([
    admin.from("marketplace_orders").select("id").limit(1),
    admin.from("marketplace_order_groups").select("id").limit(1),
    admin.from("marketplace_notification_queue").select("id").limit(1),
    admin.from("marketplace_events").select("id").limit(1),
  ]);

  const failingChecks = checks
    .map((result, index) => {
      if (result.status === "rejected") return `query_${index}`;
      return result.value.error ? `query_${index}:${result.value.error.message}` : null;
    })
    .filter(Boolean);

  const ready = shell.schemaReady && missingEnv.length === 0 && failingChecks.length === 0;

  return NextResponse.json(
    {
      ready,
      shellReady: shell.schemaReady,
      missingEnv,
      failingChecks,
      checkedAt: new Date().toISOString(),
    },
    {
      status: ready ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
