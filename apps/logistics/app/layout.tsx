import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Manrope } from "next/font/google";
import { headers } from "next/headers";
import { HenryCoPublicAccountPresets, PublicAccountChip } from "@henryco/ui";
import { PublicThemeGuard } from "@henryco/ui/public-shell";
import { getAccountUrl, getDivisionConfig, getHubUrl } from "@henryco/config";
import { LOCALE_COOKIE, normalizeLocale, isRtlLocale } from "@henryco/i18n/server";
import LogisticsShell from "@/components/layout/LogisticsShell";
import { getLogisticsSharedLoginUrl, getLogisticsSharedSignupUrl } from "@/lib/logistics-public-links";
import { getLogisticsPublicChipUser } from "@/lib/logistics-public-viewer";
import "./globals.css";

const logistics = getDivisionConfig("logistics");

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${logistics.name} | Henry & Co.`,
  description: logistics.description,
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? `https://${logistics.subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com"}`
      : "http://localhost:3000"
  ),
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
  const cookieStore = await cookies();
  const lang = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const dir = isRtlLocale(lang) ? "rtl" : "ltr";
  const [h, chipUser] = await Promise.all([headers(), getLogisticsPublicChipUser()]);
  const returnPath = h.get("x-logistics-return-path") || "/";
  const accountSlot = (
    <PublicAccountChip
      {...HenryCoPublicAccountPresets.standard}
      user={chipUser}
      loginHref={getLogisticsSharedLoginUrl(returnPath)}
      signupHref={getLogisticsSharedSignupUrl(returnPath)}
      accountHref={getAccountUrl("/logistics")}
      preferencesHref={getHubUrl("/preferences")}
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
          <LogisticsShell accountSlot={accountSlot}>{children}</LogisticsShell>
        </PublicThemeGuard>
      </body>
    </html>
  );
}
