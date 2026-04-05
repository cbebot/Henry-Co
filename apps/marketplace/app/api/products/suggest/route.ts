import { NextResponse } from "next/server";
import { searchMarketplace } from "@/lib/marketplace/data";

export const runtime = "nodejs";

/** Fast autocomplete for search UX — capped results, no full catalog payload to client. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = String(url.searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const params = new URLSearchParams();
  params.set("q", q);
  const items = await searchMarketplace(params);
  const slim = items.slice(0, 10).map((p) => ({
    slug: p.slug,
    title: p.title,
    basePrice: p.basePrice,
    currency: p.currency,
    categorySlug: p.categorySlug,
  }));

  return NextResponse.json(
    { items: slim },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
