import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/providers/theme-provider";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--acct-bg)] text-[var(--acct-ink)] antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
