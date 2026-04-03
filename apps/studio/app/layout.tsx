import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/providers/theme-provider";
import { getDivisionConfig } from "@henryco/config";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-studio-sans",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-studio-display",
});

const studio = getDivisionConfig("studio");

export const metadata: Metadata = {
  title: studio.name,
  description: studio.description,
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? `https://${studio.subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com"}`
      : "http://localhost:3000"
  ),
  openGraph: {
    title: studio.name,
    description: studio.tagline,
    siteName: studio.name,
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen bg-[var(--studio-bg)] text-[var(--studio-ink)] antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
