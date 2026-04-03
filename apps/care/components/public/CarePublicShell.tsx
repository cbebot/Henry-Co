import type { CSSProperties, ReactNode } from "react";
import { getDivisionConfig } from "@henryco/config";
import CareNavbar, { type DivisionPublicConfig } from "@/components/public/CareNavbar";
import CareFooter from "@/components/public/CareFooter";
import CookiePreferences from "@/components/public/CookiePreferences";
import { getCareSettings } from "@/lib/care-data";
import { CARE_ACCENT, CARE_ACCENT_SECONDARY } from "@/lib/care-theme";

export default async function CarePublicShell({ children }: { children: ReactNode }) {
  const care = getDivisionConfig("care") as unknown as DivisionPublicConfig;
  const settings = await getCareSettings();
  const publicCare: DivisionPublicConfig = {
    ...care,
    sub: settings.hero_badge || care.sub,
    logoUrl: settings.logo_url,
    supportEmail: settings.support_email || care.supportEmail,
    supportPhone: settings.support_phone || care.supportPhone,
  };

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
      <CareNavbar division={publicCare} />

      <div className="mx-auto w-full max-w-[88rem] px-0">
        {children}
      </div>

      <CareFooter division={publicCare} />
      <CookiePreferences />
    </div>
  );
}
