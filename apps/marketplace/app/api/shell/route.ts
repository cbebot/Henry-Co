import { NextResponse } from "next/server";
import { getMarketplaceShellState } from "@/lib/marketplace/data";

export const runtime = "nodejs";

export async function GET() {
  const shell = await getMarketplaceShellState();
  return NextResponse.json(shell, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
