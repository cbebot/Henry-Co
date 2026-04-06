import { headers } from "next/headers";
import { HenryCoPublicAccountPresets, PublicAccountChip } from "@henryco/ui";
import { getAccountUrl, getHubUrl } from "@henryco/config";
import { StudioSiteFooter } from "@/components/studio/site-footer";
import { StudioSiteHeader } from "@/components/studio/site-header";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { getStudioViewer } from "@/lib/studio/auth";
import { getStudioAccountUrl, getStudioLoginUrl, getStudioSignupUrl } from "@/lib/studio/links";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const catalog = await getStudioCatalog();
  const viewer = await getStudioViewer();
  const h = await headers();
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

  return (
    <div className="studio-page studio-shell">
      <StudioSiteHeader
        supportEmail={catalog.platform.supportEmail}
        accountHref={accountUrl}
        accountMenu={
          <PublicAccountChip
            {...HenryCoPublicAccountPresets.standard}
            user={chipUser}
            loginHref={loginHref}
            accountHref={accountUrl}
            preferencesHref={getHubUrl("/preferences")}
            settingsHref={getAccountUrl("/security")}
            signupHref={signupHref}
            showSignOut
            buttonClassName="border-[var(--studio-line)] bg-black/15 text-[var(--studio-ink)] hover:border-[rgba(151,244,243,0.28)] hover:bg-black/25 dark:text-[var(--studio-ink)]"
            dropdownClassName="border-[var(--studio-line)] bg-[color-mix(in_srgb,var(--studio-bg)_100%,#0a1620)]"
            menuItems={[
              { label: "Start a project", href: "/request" },
              { label: "Pick a project type", href: "/pick" },
              { label: "Packages", href: "/pricing" },
              { label: "Studio in your account", href: `${accountUrl}?ref=studio-nav` },
            ]}
          />
        }
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
