import { PublicSurface } from "@/components/marketplace/shell";
import MarketplaceHomePage, { generateMetadata } from "./(public)/page";

export { generateMetadata };

export const dynamic = "force-dynamic";

export default function MarketplaceRootPage() {
  return (
    <PublicSurface>
      <MarketplaceHomePage />
    </PublicSurface>
  );
}
