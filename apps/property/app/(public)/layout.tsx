import { PropertySiteFooter } from "@/components/property/site-footer";
import { PropertySiteHeader } from "@/components/property/site-header";
import { getPropertyViewer } from "@/lib/property/auth";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getPropertyViewer();

  return (
    <div className="property-page property-shell">
      <PropertySiteHeader
        signedIn={Boolean(viewer.user)}
        signedInLabel={viewer.user?.fullName?.split(" ")[0] || "Account"}
      />
      {children}
      <PropertySiteFooter />
    </div>
  );
}
