import { headers } from "next/headers";
import { HenryCoPublicAccountPresets, PublicAccountChip } from "@henryco/ui";
import { getAccountUrl, getDivisionConfig } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n";
import { PropertySiteFooter } from "@/components/property/site-footer";
import { PropertySiteHeader } from "@/components/property/site-header";
import { getPropertyViewer } from "@/lib/property/auth";
import { getPropertyPublicLocale } from "@/lib/locale-server";
import {
  getPropertyOrigin,
  getSharedAccountLoginUrl,
  getSharedAccountPropertyUrl,
  getSharedAccountSignupUrl,
} from "@/lib/property/links";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getPropertyViewer();
  const h = await headers();
  const locale = await getPropertyPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const returnPath = h.get("x-property-return-path") || "/";
  const origin = getPropertyOrigin();
  const chipUser = viewer.user
    ? {
        displayName: viewer.user.fullName || viewer.user.email || t("Your account"),
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
      preferencesHref={getAccountUrl("/settings")}
      settingsHref={getAccountUrl("/security")}
      signupHref={getSharedAccountSignupUrl({ nextPath: returnPath, propertyOrigin: origin })}
      showSignOut
      menuItems={[
        { label: t("Browse listings"), href: "/" },
        { label: t("Submit a listing"), href: "/submit" },
      ]}
    />
  );

  // Data tuple consumed by PropertySiteHeader to construct the
  // premium DrawerAccountSection (FIX-CHROME-02). We pass the data
  // (not the JSX) so the client-side site-header can plumb the
  // rAF-deferred dismiss callback through DrawerAccountSection's
  // onSelect prop — closing the drawer cleanly after each tap
  // without racing the App Router transition.
  const drawerProfile = {
    user: chipUser,
    accountHref: getSharedAccountPropertyUrl(),
    preferencesHref: getAccountUrl("/settings"),
    settingsHref: getAccountUrl("/security"),
    loginHref: getSharedAccountLoginUrl({ nextPath: returnPath, propertyOrigin: origin }),
    signupHref: getSharedAccountSignupUrl({ nextPath: returnPath, propertyOrigin: origin }),
    accent: getDivisionConfig("property").accentStrong,
    extraItems: [
      { label: "Browse listings", href: "/" },
      { label: "Submit a listing", href: "/submit" },
    ],
  };

  return (
    <div className="property-page property-shell">
      <PropertySiteHeader accountSlot={accountSlot} drawerProfile={drawerProfile} />
      {children}
      <PropertySiteFooter />
    </div>
  );
}
