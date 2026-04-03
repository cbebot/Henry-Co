import { MarketplaceCartDrawer } from "@/components/marketplace/cart-drawer";
import { MarketplaceRuntimeProvider } from "@/components/marketplace/runtime-provider";
import { PublicFooter, PublicHeader } from "@/components/marketplace/shell";
import { MarketplaceToastStack } from "@/components/marketplace/toast-stack";
import { getMarketplaceShellState } from "@/lib/marketplace/data";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const shell = await getMarketplaceShellState();

  return (
    <MarketplaceRuntimeProvider initialShell={shell}>
      <div className="market-page">
        <PublicHeader
          signedIn={shell.viewer.signedIn}
          signedInLabel={shell.viewer.firstName}
        />
        <main>{children}</main>
        <PublicFooter />
        <MarketplaceCartDrawer />
        <MarketplaceToastStack />
      </div>
    </MarketplaceRuntimeProvider>
  );
}
