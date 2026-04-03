import { StudioSiteFooter } from "@/components/studio/site-footer";
import { StudioSiteHeader } from "@/components/studio/site-header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="studio-page studio-shell">
      <StudioSiteHeader />
      {children}
      <StudioSiteFooter />
    </div>
  );
}
