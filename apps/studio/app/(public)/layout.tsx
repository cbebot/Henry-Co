import { headers } from "next/headers";
import { STUDIO_ROLE_VOCAB, resolveChromePlan, standingFromRoles } from "@henryco/aware";
import { HenryCoPublicAccountPresets } from "@henryco/ui";
import { PublicSiteFooter } from "@henryco/ui/public-design";
import { getAccountUrl, getDivisionConfig } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { StudioAccountChip } from "@/components/studio/StudioAccountChip";
import { StudioSiteHeader } from "@/components/studio/site-header";
import { fraunces, manrope, STUDIO_PUBLIC_THEME_STYLE } from "@/components/studio/studio-public-theme";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { getStudioViewer } from "@/lib/studio/auth";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { getStudioAccountUrl, getStudioLoginUrl, getStudioSignupUrl } from "@/lib/studio/links";

const studio = getDivisionConfig("studio");

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [catalog, viewer, h, locale] = await Promise.all([
    getStudioCatalog(),
    getStudioViewer(),
    headers(),
    getStudioPublicLocale(),
  ]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const returnPath = h.get("x-studio-return-path") || "/";
  const loginHref = getStudioLoginUrl(returnPath);
  const signupHref = getStudioSignupUrl(returnPath);
  const accountUrl = getStudioAccountUrl();
  const chipUser = viewer.user
    ? {
        displayName: viewer.user.fullName || viewer.user.email || "Your account",
        email: viewer.user.email,
        avatarUrl: viewer.user.avatarUrl,
      }
    : null;

  const account = {
    user: chipUser,
    loginHref,
    signupHref,
    accountHref: accountUrl,
  };

  // AWARE-SP3: the chrome follows the viewer's STANDING — a studio team member
  // sees their project console, everyone else the "start a project" CTA. Policy
  // lives in @henryco/aware (tested matrix), not in this layout.
  const standing = standingFromRoles(
    { signedIn: Boolean(viewer.user), roles: viewer.roles },
    STUDIO_ROLE_VOCAB,
  );
  const plan = resolveChromePlan("studio", standing);
  const chromePrimary = { label: t(plan.primaryCta.label), href: plan.primaryCta.href };
  const chromeAux = plan.aside ? { label: t(plan.aside.label), href: plan.aside.href } : undefined;

  const footerColumns = [
    {
      title: t("Studio"),
      links: [
        { href: "/services", label: t("Services") },
        { href: "/pricing", label: t("Packages") },
        { href: "/work", label: t("Case studies") },
        { href: "/teams", label: t("Teams") },
      ],
    },
    {
      title: t("Start"),
      links: [
        { href: "/request", label: t("Start a project") },
        { href: "/pick", label: t("Project types") },
        { href: "/process", label: t("Process") },
        { href: "/trust", label: t("Trust") },
      ],
    },
    {
      title: t("Account"),
      links: [
        { href: accountUrl, label: t("Your account") },
        { href: "/faq", label: t("FAQ") },
        { href: "/contact", label: t("Contact") },
      ],
    },
  ];

  return (
    <div
      className={`${fraunces.variable} ${manrope.variable} studio-public home-accent-scope flex min-h-screen flex-col bg-[color:var(--home-canvas)] text-[color:var(--home-ink)]`}
      style={STUDIO_PUBLIC_THEME_STYLE}
    >
      <StudioSiteHeader
        account={account}
        primaryCta={chromePrimary}
        auxLink={chromeAux}
        accountMenu={
          <StudioAccountChip
            {...HenryCoPublicAccountPresets.standard}
            user={chipUser}
            loginHref={loginHref}
            accountHref={accountUrl}
            preferencesHref={getAccountUrl("/settings")}
            settingsHref={getAccountUrl("/security")}
            signupHref={signupHref}
            showSignOut
            buttonClassName="border-[color:var(--home-line-15)] bg-[color:var(--home-surface-04)] text-[color:var(--home-ink)] hover:border-[color:var(--home-accent)] hover:bg-[color:var(--home-surface-07)]"
            dropdownClassName="border-[color:var(--home-line-15)] bg-[color:var(--home-sheet)] text-[color:var(--home-ink)]"
            menuItems={[
              // AWARE-SP3: a studio team member gets their project console first.
              ...(standing.kind === "operator"
                ? [{ label: t(plan.workspace!.label), href: plan.workspace!.href }]
                : []),
              { label: t("Start a project"), href: "/request" },
              { label: t("Pick a project type"), href: "/pick" },
              { label: t("Packages"), href: "/pricing" },
              { label: t("Studio in your account"), href: `${accountUrl}?ref=studio-nav` },
            ]}
          />
        }
      />
      <div className="flex-1">{children}</div>
      <PublicSiteFooter
        copy={{
          statement: t(
            "Serious software, delivered with sharper process — every brief to launch on one record.",
          ),
          divisionsLabel: t("The Henry Onyx group"),
          rightsReserved: t("All rights reserved."),
          attribution: t("Built in-house by Henry Onyx Studio."),
        }}
        columns={footerColumns}
        support={{
          email: catalog.platform.supportEmail || studio.supportEmail,
          phone: catalog.platform.supportPhone || studio.supportPhone,
        }}
      />
    </div>
  );
}
