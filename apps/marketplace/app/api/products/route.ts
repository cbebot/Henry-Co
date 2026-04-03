import { NextResponse } from "next/server";
import { getMarketplaceHomeData, searchMarketplace } from "@/lib/marketplace/data";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const [snapshot, products] = await Promise.all([
    getMarketplaceHomeData(),
    searchMarketplace(url.searchParams),
  ]);

  return NextResponse.json(
    {
      total: products.length,
      items: products,
      categories: snapshot.categories,
      brands: snapshot.brands,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
