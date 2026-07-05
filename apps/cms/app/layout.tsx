import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces } from "next/font/google";
import { PublicThemeGuard } from "@henryco/ui/public-shell";

// The brand editorial reading serif, loaded into the shared `--font-reading` seam so
// `.hc-prose` and every input render in the real Fraunces (the company-wide reading face).
const reading = Fraunces({ subsets: ["latin"], display: "swap", variable: "--font-reading" });

export const metadata: Metadata = {
  title: "Henry Onyx — Owner CMS",
  description: "Owner-only content management for the Henry Onyx public surfaces.",
  // Private surface: never index the admin.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={reading.variable}>
      <body className="min-h-screen antialiased">
        <PublicThemeGuard>{children}</PublicThemeGuard>
      </body>
    </html>
  );
}
