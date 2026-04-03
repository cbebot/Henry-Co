import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/providers/theme-provider";
import { getDivisionConfig } from "@henryco/config";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-marketplace-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-marketplace-sans",
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const marketplace = getDivisionConfig("marketplace");

  return {
    title: marketplace.name,
    description: marketplace.description,
    metadataBase: new URL(
      process.env.NODE_ENV === "production"
        ? `https://${marketplace.subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com"}`
        : "http://localhost:3000"
    ),
    openGraph: {
      title: marketplace.name,
      description: marketplace.tagline,
      siteName: marketplace.name,
      type: "website",
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fraunces.variable} ${manrope.variable} min-h-screen bg-[var(--market-bg)] text-[var(--market-ink)] antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
