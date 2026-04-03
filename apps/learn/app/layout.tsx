import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import ThemeProvider from "@/components/providers/theme-provider";
import "./globals.css";
import { getDivisionConfig } from "@henryco/config";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-learn-sans",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-learn-display",
});

const learn = getDivisionConfig("learn");

export const metadata: Metadata = {
  title: learn.name,
  description: learn.description,
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? `https://${learn.subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com"}`
      : "http://localhost:3018"
  ),
  openGraph: {
    title: learn.name,
    description: learn.tagline,
    siteName: learn.name,
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen bg-[var(--learn-bg)] text-[var(--learn-ink)] antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
