import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { getDivisionConfig } from "@henryco/config";
import ThemeProvider from "@/components/providers/theme-provider";
import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-property-sans",
});

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-property-display",
  weight: ["500", "600", "700"],
});

const property = getDivisionConfig("property");

export const metadata: Metadata = {
  title: property.name,
  description: property.description,
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? `https://${property.subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com"}`
      : "http://localhost:3000"
  ),
  openGraph: {
    title: property.name,
    description: property.tagline,
    siteName: property.name,
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen bg-[var(--property-bg)] text-[var(--property-ink)] antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
