import { headers } from "next/headers";
import { PROPERTY_ROLE_VOCAB, resolveChromePlan, standingFromRoles } from "@henryco/aware";
import { getAccountUrl, getPublicDivisions } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { LaunchInterceptor } from "@henryco/ui/public-shell";
import { getPropertyPublicLocale } from "@/lib/locale-server";
import { manrope, PROPERTY_PUBLIC_THEME_STYLE } from "@/components/property/property-public-theme";
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
  const [viewer, h, locale] = await Promise.all([
    getPropertyViewer(),
    headers(),
    getPropertyPublicLocale(),
  ]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const returnPath = h.get("x-property-return-path") || "/";
  const origin = getPropertyOrigin();

  // AWARE-SP3: property chrome had no CTA. Now it follows standing — an agent
  // opens their workspace; a buyer/visitor browses listings with a
  // "submit a property" aside. Tested matrix in @henryco/aware.
  const standing = standingFromRoles(
    { signedIn: Boolean(viewer.user), roles: viewer.roles },
    PROPERTY_ROLE_VOCAB,
  );
  const plan = resolveChromePlan("property", standing);
  const chromePrimary = { label: t(plan.primaryCta.label), href: plan.primaryCta.href };
  const chromeAux = plan.aside ? { label: t(plan.aside.label), href: plan.aside.href } : undefined;

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
      className={`${manrope.variable} property-page property-shell home-accent-scope flex min-h-screen flex-col bg-[color:var(--home-canvas)] text-[color:var(--home-ink)]`}
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
      <PropertySiteHeader
        account={account}
        accountMenu={accountMenu}
        primaryCta={chromePrimary}
        auxLink={chromeAux}
      />
      {children}
      <PropertySiteFooter />
    </div>
  );
}
