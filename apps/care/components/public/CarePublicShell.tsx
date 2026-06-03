import type { CSSProperties, ReactNode } from "react";
import { headers } from "next/headers";
import { HenryCoPublicAccountPresets } from "@henryco/ui";
import { getAccountUrl, getDivisionConfig } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n";
import { CareAccountChip } from "@/components/public/CareAccountChip";
import CareNavbar, { type DivisionPublicConfig } from "@/components/public/CareNavbar";
import CareFooter from "@/components/public/CareFooter";
import { getCareSettings } from "@/lib/care-data";
import { getCarePublicLocale } from "@/lib/locale-server";
import { CARE_ACCENT_SECONDARY } from "@/lib/care-theme";
import { fraunces, CARE_PUBLIC_THEME_STYLE } from "@/lib/care-public-theme";
import {
  getCareAccountHomeUrl,
  getCareSharedLoginUrl,
  getCareSharedSignupUrl,
} from "@/lib/care-public-links";
import { getCarePublicChipUser } from "@/lib/care-public-viewer";

/**
 * Care public shell (V3-PUBLIC-REBUILD-care). Rides the locked --home-* design
 * system via CARE_PUBLIC_THEME_STYLE (cobalt soul, Fraunces display) + the
 * shared theme-aware PublicChrome (CareNavbar). The whole public surface flips
 * light⇄dark with device/toggle; the account dropdown + sign-out are preserved.
 */
export default async function CarePublicShell({ children }: { children: ReactNode }) {
  const locale = await getCarePublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const care = getDivisionConfig("care") as unknown as DivisionPublicConfig;
  const settings = await getCareSettings();
  const publicCare: DivisionPublicConfig = {
    ...care,
    sub: settings.hero_badge || care.sub,
    logoUrl: settings.logo_url,
    supportEmail: settings.support_email || care.supportEmail,
    supportPhone: settings.support_phone || care.supportPhone,
  };

  const h = await headers();
  const returnPath = h.get("x-care-return-path") || "/";
  const chipUser = await getCarePublicChipUser();
  const loginHref = getCareSharedLoginUrl(returnPath, null);
  const signupHref = getCareSharedSignupUrl(returnPath, null);
  const accountHref = getCareAccountHomeUrl();

  const accountMenu = chipUser ? (
    <CareAccountChip
      {...HenryCoPublicAccountPresets.standard}
      user={chipUser}
      loginHref={loginHref}
      accountHref={accountHref}
      preferencesHref={getAccountUrl("/settings")}
      settingsHref={getAccountUrl("/security")}
      signupHref={signupHref}
      showSignOut
      buttonClassName="border-[color:var(--home-line-15)] bg-[color:var(--home-surface-04)] text-[color:var(--home-ink)] hover:border-[color:var(--home-accent)] hover:bg-[color:var(--home-surface-07)]"
      dropdownClassName="border-[color:var(--home-line-15)] bg-[color:var(--home-sheet)] text-[color:var(--home-ink)]"
      menuItems={[
        { label: t("Track a booking"), href: "/track" },
        { label: t("Book care"), href: "/book" },
      ]}
    />
  ) : null;

  return (
    <div
      className={`${fraunces.variable} care-page home-accent-scope flex min-h-screen flex-col bg-[color:var(--home-canvas)] text-[color:var(--home-ink)]`}
      style={
        {
          ...CARE_PUBLIC_THEME_STYLE,
          ["--accent-secondary"]: CARE_ACCENT_SECONDARY,
        } as CSSProperties
      }
    >
      <CareNavbar
        division={publicCare}
        account={{ user: chipUser, loginHref, signupHref, accountHref }}
        accountMenu={accountMenu}
      />

      <div className="mx-auto w-full max-w-[88rem] flex-1 px-0">{children}</div>

      <CareFooter division={publicCare} />
    </div>
  );
}
