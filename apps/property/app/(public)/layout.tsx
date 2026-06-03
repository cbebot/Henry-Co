import { headers } from "next/headers";
import { PROPERTY_PUBLIC_THEME_STYLE } from "@/components/property/property-public-theme";
import { PropertySiteFooter } from "@/components/property/site-footer";
import { PropertySiteHeader } from "@/components/property/site-header";
import { getPropertyViewer } from "@/lib/property/auth";
import {
  getPropertyOrigin,
  getSharedAccountLoginUrl,
  getSharedAccountPropertyUrl,
  getSharedAccountSignupUrl,
} from "@/lib/property/links";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getPropertyViewer();
  const h = await headers();
  const returnPath = h.get("x-property-return-path") || "/";
  const origin = getPropertyOrigin();

  const account = {
    user: viewer.user
      ? {
          displayName: viewer.user.fullName || viewer.user.email,
          email: viewer.user.email,
          avatarUrl: viewer.user.avatarUrl,
        }
      : null,
    loginHref: getSharedAccountLoginUrl({ nextPath: returnPath, propertyOrigin: origin }),
    signupHref: getSharedAccountSignupUrl({ nextPath: returnPath, propertyOrigin: origin }),
    accountHref: getSharedAccountPropertyUrl(),
  };

  return (
    <div
      className="property-page property-shell home-accent-scope flex min-h-screen flex-col bg-[color:var(--home-canvas)] text-[color:var(--home-ink)]"
      style={PROPERTY_PUBLIC_THEME_STYLE}
    >
      <PropertySiteHeader account={account} />
      {children}
      <PropertySiteFooter />
    </div>
  );
}
