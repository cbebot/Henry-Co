import { headers } from "next/headers";
import { HenryCoPublicAccountPresets, PublicAccountChip } from "@henryco/ui";
import { getAccountUrl } from "@henryco/config";
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
  const chipUser = viewer.user
    ? {
        displayName: viewer.user.fullName || viewer.user.email || "Your account",
        email: viewer.user.email,
        avatarUrl: viewer.user.avatarUrl,
      }
    : null;

  const accountSlot = (
    <PublicAccountChip
      {...HenryCoPublicAccountPresets.standard}
      user={chipUser}
      loginHref={getSharedAccountLoginUrl({ nextPath: returnPath, propertyOrigin: origin })}
      accountHref={getSharedAccountPropertyUrl()}
      preferencesHref={getAccountUrl("/settings#privacy-controls")}
      settingsHref={getAccountUrl("/security")}
      signupHref={getSharedAccountSignupUrl({ nextPath: returnPath, propertyOrigin: origin })}
      showSignOut
      menuItems={[
        { label: "Browse listings", href: "/" },
        { label: "Submit a listing", href: "/submit" },
      ]}
    />
  );

  return (
    <div className="property-page property-shell">
      <PropertySiteHeader accountSlot={accountSlot} />
      {children}
      <PropertySiteFooter />
    </div>
  );
}
