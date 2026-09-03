import { translateSurfaceLabel } from "@henryco/i18n/server";
import { HeroCard } from "@henryco/dashboard-shell/surfaces";
import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";
import NewSupportForm from "@/components/support/NewSupportForm";

export const dynamic = "force-dynamic";

/**
 * Support · New request.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2F). Compact hero with parent
 * breadcrumb to support.
 */
export default async function NewSupportPage() {
  const locale = await getAccountAppLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  await requireAccountUser();

  return (
    <div className="space-y-6 acct-fade-in">
      <HeroCard
        variant="compact"
        tone="active"
        eyebrow={`${t("Support")} · ${t("New request")}`}
        headline={t("New Support Request")}
        blurb={t("Describe your issue and we'll get back to you.")}
        ctaSecondary={{ label: t("Back to support"), href: "/support" }}
      />
      <NewSupportForm />
    </div>
  );
}
