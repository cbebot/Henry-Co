import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@henryco/i18n/react";
import { HenryCoThemeBlocking, ThemeProvider } from "@henryco/ui";
import { ConsentNotice, ThirdPartyRuntimeProviders } from "@henryco/ui/public-shell";
import { isRtlLocale } from "@henryco/i18n/server";
import { getAccountAppLocale } from "@/lib/locale-server";

export const metadata: Metadata = {
  title: "My Account — Henry & Co.",
  description:
    "Manage your HenryCo account, wallet, payments, orders, and preferences across all divisions.",
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? `https://account.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com"}`
      : "http://localhost:3003"
  ),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getAccountAppLocale();
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--acct-bg)] text-[var(--acct-ink)] antialiased">
        <HenryCoThemeBlocking />
        <ThemeProvider>
          <ThirdPartyRuntimeProviders>
            <LocaleProvider locale={locale}>{children}</LocaleProvider>
          </ThirdPartyRuntimeProviders>
          <ConsentNotice preferencesHref="/settings#privacy-controls" />
        </ThemeProvider>
      </body>
    </html>
  );
}
