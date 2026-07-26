import { getDivisionConfig } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { LivePublicSiteFooter } from "@henryco/ui/public-design";
import { LearnSiteHeader } from "@/components/learn/site-header";
import { fraunces, manrope, LEARN_PUBLIC_THEME_STYLE } from "@/components/learn/learn-public-theme";
import { getAccountLearnUrl } from "@/lib/learn/links";
import { getLearnPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

const learn = getDivisionConfig("learn");

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const accountHref = getAccountLearnUrl();

  return (
    <div
      className={`${fraunces.variable} ${manrope.variable} learn-shell home-accent-scope flex min-h-screen flex-col bg-[color:var(--home-canvas)] text-[color:var(--home-ink)]`}
      style={LEARN_PUBLIC_THEME_STYLE}
    >
      <LearnSiteHeader />
      <div className="flex-1">{children}</div>
      <LivePublicSiteFooter
        copy={{
          statement: t(
            "Practical courses, clear progress, and verified certificates — learn on your schedule and resume anytime from your Henry Onyx account.",
          ),
          divisionsLabel: t("The Henry Onyx group"),
          rightsReserved: t("All rights reserved."),
          attribution: t("Built in-house by Henry Onyx Studio."),
        }}
        columns={[
          {
            title: t("Explore"),
            links: [
              { href: "/courses", label: t("Courses") },
              { href: "/paths", label: t("Paths") },
              { href: "/academy", label: t("How it works") },
              { href: "/certifications", label: t("Certificates") },
            ],
          },
          {
            title: t("Engage"),
            links: [
              { href: "/teach", label: t("Teach with Henry Onyx") },
              { href: "/trust", label: t("Trust") },
              { href: "/help", label: t("Help") },
            ],
          },
          {
            title: t("Account"),
            links: [{ href: accountHref, label: t("Henry Onyx account") }],
          },
        ]}
        support={{ email: learn.supportEmail }}
      />
    </div>
  );
}
