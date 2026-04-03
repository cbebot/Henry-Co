import { StudioSiteFooter } from "@/components/studio/site-footer";
import { StudioSiteHeader } from "@/components/studio/site-header";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { getStudioAccountUrl, getStudioLoginUrl } from "@/lib/studio/links";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const catalog = await getStudioCatalog();

  return (
    <div className="studio-page studio-shell">
      <StudioSiteHeader
        supportEmail={catalog.platform.supportEmail}
        accountHref={getStudioAccountUrl()}
      />
      {children}
      <StudioSiteFooter
        supportEmail={catalog.platform.supportEmail}
        supportPhone={catalog.platform.supportPhone}
        accountHref={getStudioAccountUrl()}
        loginHref={getStudioLoginUrl("/")}
      />
    </div>
  );
}
