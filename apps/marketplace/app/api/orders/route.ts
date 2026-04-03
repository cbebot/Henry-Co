import { NextResponse } from "next/server";
import { getBuyerDashboardData, toMarketplaceOrderFeed } from "@/lib/marketplace/data";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const view = url.searchParams.get("view");
  const dashboard = await getBuyerDashboardData();

  if (view === "feed") {
    return NextResponse.json(
      {
        items: toMarketplaceOrderFeed(dashboard.orders),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  return NextResponse.json(
    {
      orders: dashboard.orders,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
