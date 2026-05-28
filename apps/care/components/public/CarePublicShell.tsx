import type { CSSProperties, ReactNode } from "react";
import { headers } from "next/headers";
import { getDivisionConfig } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n";
import { CareAccountChipClient } from "@/components/public/CareAccountChipClient";
import CareNavbar, { type DivisionPublicConfig } from "@/components/public/CareNavbar";
import CareFooter from "@/components/public/CareFooter";
import { getCareSettings } from "@/lib/care-data";
import { getCarePublicLocale } from "@/lib/locale-server";
import { CARE_ACCENT, CARE_ACCENT_SECONDARY } from "@/lib/care-theme";
import {
  getCareAccountHomeUrl,
  getCareSharedLoginUrl,
  getCareSharedSignupUrl,
} from "@/lib/care-public-links";
import { getCarePublicChipUser } from "@/lib/care-public-viewer";

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

  const accountSlot = (
    <CareAccountChipClient
      user={chipUser}
      loginHref={loginHref}
      signupHref={signupHref}
      accountHref={accountHref}
      menuItems={[
        { label: t("Track a booking"), href: "/track" },
        { label: t("Book care"), href: "/book" },
      ]}
    />
  );

  return (
    <div
      className="care-page"
      style={
        {
          "--accent": CARE_ACCENT,
          "--accent-secondary": CARE_ACCENT_SECONDARY,
        } as CSSProperties
      }
    >
      <CareNavbar division={publicCare} accountSlot={accountSlot} />

      <div className="mx-auto w-full max-w-[88rem] px-0">
        {children}
      </div>

      <CareFooter division={publicCare} />
    </div>
  );
}
