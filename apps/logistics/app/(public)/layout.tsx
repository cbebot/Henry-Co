import type { CSSProperties, ReactNode } from "react";
import { headers } from "next/headers";
import { HenryCoPublicAccountPresets } from "@henryco/ui";
import { LivePublicSiteFooter } from "@henryco/ui/public-design";
import { getAccountUrl, getDivisionConfig, getHubUrl } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n";
import { LogisticsAccountChip } from "@/components/layout/LogisticsAccountChip";
import LogisticsSiteHeader from "@/components/layout/LogisticsSiteHeader";
import { getLogisticsPublicLocale } from "@/lib/locale-server";
import {
  getLogisticsSharedLoginUrl,
  getLogisticsSharedSignupUrl,
} from "@/lib/logistics-public-links";
import { getLogisticsPublicChipUser } from "@/lib/logistics-public-viewer";
import { fraunces, manrope, LOGISTICS_PUBLIC_THEME_STYLE } from "@/lib/logistics-public-theme";

const logistics = getDivisionConfig("logistics");

/**
 * Logistics public shell (V3-PUBLIC-REBUILD-logistics). Rides the locked --home-*
 * design system via LOGISTICS_PUBLIC_THEME_STYLE (copper soul, Fraunces display) +
 * the shared theme-aware PublicChrome (LogisticsSiteHeader) and shared
 * PublicSiteFooter. The whole public surface flips light⇄dark with device/toggle;
 * the account dropdown + sign-out are preserved. Staff/operator/pay surfaces live
 * OUTSIDE this group and keep their dark division/dashboard tokens.
 */
export default async function LogisticsPublicLayout({ children }: { children: ReactNode }) {
  const [locale, h, chipUser] = await Promise.all([
    getLogisticsPublicLocale(),
    headers(),
    getLogisticsPublicChipUser(),
  ]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const returnPath = h.get("x-logistics-return-path") || "/";
  const loginHref = getLogisticsSharedLoginUrl(returnPath);
  const signupHref = getLogisticsSharedSignupUrl(returnPath);
  const accountHref = getAccountUrl("/logistics");

  const accountMenu = chipUser ? (
    <LogisticsAccountChip
      {...HenryCoPublicAccountPresets.standard}
      user={chipUser}
      loginHref={loginHref}
      signupHref={signupHref}
      accountHref={accountHref}
      preferencesHref={getAccountUrl("/settings")}
      settingsHref={getAccountUrl("/security")}
      showSignOut
      buttonClassName="border-[color:var(--home-line-15)] bg-[color:var(--home-surface-04)] text-[color:var(--home-ink)] hover:border-[color:var(--home-accent)] hover:bg-[color:var(--home-surface-07)]"
      dropdownClassName="border-[color:var(--home-line-15)] bg-[color:var(--home-sheet)] text-[color:var(--home-ink)]"
      menuItems={[
        { label: t("Track a shipment"), href: "/track" },
        { label: t("Logistics in My Account"), href: accountHref, external: true },
      ]}
    />
  ) : null;

  return (
    <div
      className={`${fraunces.variable} ${manrope.variable} logistics-public home-accent-scope flex min-h-screen flex-col bg-[color:var(--home-canvas)] text-[color:var(--home-ink)]`}
      style={LOGISTICS_PUBLIC_THEME_STYLE as CSSProperties}
    >
      <LogisticsSiteHeader
        account={{ user: chipUser, loginHref, signupHref, accountHref }}
        accountMenu={accountMenu}
      />
      <main id="henryco-main" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <LivePublicSiteFooter
        copy={{
          statement: t(
            "Reliable pickup, delivery, and fulfilment — clear quotes, live tracking, and proof of delivery from request to doorstep.",
          ),
          divisionsLabel: t("The Henry Onyx group"),
          rightsReserved: t("All rights reserved."),
          attribution: t("Built in-house by Henry Onyx Logistics."),
        }}
        columns={[
          {
            title: t("Move"),
            links: [
              { href: "/book", label: t("Book a pickup") },
              { href: "/quote", label: t("Get a quote") },
              { href: "/track", label: t("Track a shipment") },
              { href: "/coverage", label: t("Coverage") },
            ],
          },
          {
            title: t("Company"),
            links: [
              { href: "/services", label: t("Services") },
              { href: "/pricing", label: t("Pricing") },
              { href: "/business", label: t("For business") },
              { href: "/support", label: t("Support") },
            ],
          },
          {
            title: t("Henry Onyx"),
            links: [
              { href: getHubUrl("/"), label: t("Group hub"), external: true },
              { href: getHubUrl("/preferences"), label: t("Preferences"), external: true },
              { href: getHubUrl("/privacy"), label: t("Privacy"), external: true },
              { href: getHubUrl("/terms"), label: t("Terms"), external: true },
            ],
          },
        ]}
        support={{ email: logistics.supportEmail }}
      />
    </div>
  );
}
