import { PublicSurface } from "@/components/marketplace/shell";
import MarketplaceHomePage from "./(public)/page";

export const dynamic = "force-dynamic";

export default function MarketplaceRootPage() {
  return (
    <PublicSurface>
      <MarketplaceHomePage />
    </PublicSurface>
  );
}
