import { headers } from "next/headers";
import { getAccountUrl, getPublicDivisions } from "@henryco/config";
import { LaunchInterceptor } from "@henryco/ui/public-shell";
import { PROPERTY_PUBLIC_THEME_STYLE } from "@/components/property/property-public-theme";
import { PropertyAccountChip } from "@/components/property/PropertyAccountChip";
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
          displayName: viewer.user.fullName || viewer.user.email || "Account",
          email: viewer.user.email,
          avatarUrl: viewer.user.avatarUrl,
        }
      : null,
    loginHref: getSharedAccountLoginUrl({ nextPath: returnPath, propertyOrigin: origin }),
    signupHref: getSharedAccountSignupUrl({ nextPath: returnPath, propertyOrigin: origin }),
    accountHref: getSharedAccountPropertyUrl(),
  };

  // Signed-in only: the full account dropdown (preferences / settings / sign-out)
  // is preserved by slotting the existing PublicAccountChip. PublicChrome renders
  // the Sign in / Get started cluster itself when signed out.
  const accountMenu = account.user ? (
    <PropertyAccountChip
      user={{
        displayName: account.user.displayName,
        email: account.user.email ?? undefined,
        avatarUrl: account.user.avatarUrl ?? undefined,
      }}
      loginHref={account.loginHref}
      signupHref={account.signupHref}
      accountHref={account.accountHref}
      preferencesHref={getAccountUrl("/settings")}
      settingsHref={getAccountUrl("/security")}
      showSignOut
    />
  ) : null;

  return (
    <div
      className="property-page property-shell home-accent-scope flex min-h-screen flex-col bg-[color:var(--home-canvas)] text-[color:var(--home-ink)]"
      style={PROPERTY_PUBLIC_THEME_STYLE}
    >
      {/* Property uses a bespoke header/footer (not the shared PublicSiteFooter),
          so mount the division→division launch transition here too, so switching
          to another division from property plays the same branded overlay. */}
      <LaunchInterceptor
        divisions={getPublicDivisions().map((division) => ({
          name: division.name,
          url: division.url,
          accent: division.accent,
        }))}
      />
      <PropertySiteHeader account={account} accountMenu={accountMenu} />
      {children}
      <PropertySiteFooter />
    </div>
  );
}
