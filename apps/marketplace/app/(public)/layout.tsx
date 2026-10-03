import type { Metadata } from "next";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { PublicSurface } from "@/components/marketplace/shell";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

// Default description for public routes that set none of their own; the
// division default from the root layout runs past 160 characters.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getMarketplacePublicLocale();
  return {
    description: translateSurfaceLabel(
      locale,
      "Shop products from approved stores on Henry Onyx Marketplace.",
    ),
  };
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <PublicSurface>{children}</PublicSurface>;
}
