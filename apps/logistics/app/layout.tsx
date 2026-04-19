import type { Metadata } from "next";
import { headers } from "next/headers";
import { Manrope } from "next/font/google";
import { HenryCoPublicAccountPresets, PublicAccountChip } from "@henryco/ui";
import { LocaleProvider } from "@henryco/i18n/react";
import { PublicThemeGuard } from "@henryco/ui/public-shell";
import { AssistDock } from "@henryco/ui/support";
import { getAccountUrl, getDivisionConfig } from "@henryco/config";
import { isRtlLocale } from "@henryco/i18n/server";
import { getLogisticsPublicLocale } from "@/lib/locale-server";
import LogisticsShell from "@/components/layout/LogisticsShell";
import { getLogisticsSharedLoginUrl, getLogisticsSharedSignupUrl } from "@/lib/logistics-public-links";
import { getLogisticsPublicChipUser } from "@/lib/logistics-public-viewer";
import "./globals.css";

const logistics = getDivisionConfig("logistics");

function logisticsMetadataBase(): URL {
  const baseDomain = (process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com").replace(/^https?:\/\//i, "").split("/")[0];
  const sub = String(logistics.subdomain || "logistics").replace(/^\.+|\.+$/g, "");
  const prod = `https://${sub}.${baseDomain}`;
  const candidate = process.env.NODE_ENV === "production" ? prod : "http://localhost:3000";
  try {
    return new URL(candidate);
  } catch {
    return new URL("https://logistics.henrycogroup.com");
  }
}

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${logistics.name} | Henry & Co.`,
  description: logistics.description,
  metadataBase: logisticsMetadataBase(),
  openGraph: {
    title: logistics.name,
    description: logistics.tagline,
    siteName: logistics.name,
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, h, chipUser] = await Promise.all([
    getLogisticsPublicLocale(),
    headers(),
    getLogisticsPublicChipUser(),
  ]);
  const dir = isRtlLocale(lang) ? "rtl" : "ltr";
  const returnPath = h.get("x-logistics-return-path") || "/";
  const accountSlot = (
    <PublicAccountChip
      {...HenryCoPublicAccountPresets.standard}
      user={chipUser}
      loginHref={getLogisticsSharedLoginUrl(returnPath)}
      signupHref={getLogisticsSharedSignupUrl(returnPath)}
      accountHref={getAccountUrl("/logistics")}
      preferencesHref={getAccountUrl("/settings")}
      settingsHref={getAccountUrl("/security")}
      showSignOut
      buttonClassName="border-[var(--logistics-line-strong)] bg-[rgba(215,117,57,0.14)] text-[var(--logistics-accent-soft)] hover:bg-[rgba(215,117,57,0.24)]"
      dropdownClassName="border-[var(--logistics-line)] bg-[#120a14]"
      menuItems={[
        { label: "Logistics in My Account", href: getAccountUrl("/logistics"), external: true },
      ]}
    />
  );

  return (
    <html lang={lang} dir={dir} className={manrope.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <PublicThemeGuard>
          <LocaleProvider locale={lang}>
            <LogisticsShell accountSlot={accountSlot}>{children}</LogisticsShell>
            <AssistDock division="logistics" accent="#D77539" />
          </LocaleProvider>
        </PublicThemeGuard>
      </body>
    </html>
  );
}
