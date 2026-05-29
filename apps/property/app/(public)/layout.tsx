import { headers } from "next/headers";
import { HenryCoPublicAccountPresets } from "@henryco/ui";
import { getAccountUrl } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n";
import { PropertyAccountChip } from "@/components/property/PropertyAccountChip";
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
    <PropertyAccountChip
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

  return (
    <div className="property-page property-shell">
      <PropertySiteHeader accountSlot={accountSlot} />
      {children}
      <PropertySiteFooter />
    </div>
  );
}
