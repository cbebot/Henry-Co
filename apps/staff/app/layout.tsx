import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces } from "next/font/google";
import { PublicThemeGuard } from "@henryco/ui/public-shell";
import { getStaffHqUrl } from "@henryco/config";
import { ScrollToTopOnNavigation } from "@henryco/config/scroll-to-top";

// The brand editorial reading serif, loaded into the shared `--font-reading` seam so
// `.hc-prose` and every input render in the real Fraunces (the company-wide reading face).
const reading = Fraunces({ subsets: ["latin"], display: "swap", variable: "--font-reading" });

export const metadata: Metadata = {
  title: "Staff HQ — Henry Onyx",
  description: "Internal staff platform for Henry Onyx operations.",
  robots: { index: false, follow: false },
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? getStaffHqUrl("/")
      : "http://localhost:3020"
  ),
};

/**
 * THEME-01 Phase 4 — Staff HQ root layout.
 *
 * Previously: <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
 * Now:        <PublicThemeGuard> (the canonical platform pattern)
 *
 * Why this change:
 *   - Removes the `forcedTheme="dark"` pin so staff users can choose
 *     Light / Dark / System (System default; persists per device).
 *   - Composes the same provider chain as every other HenryCo surface
 *     (public hub, care, marketplace, jobs, learn, logistics, property,
 *     studio, account). One theme system, one localStorage key, one
 *     blocking script for zero-FOUC paint.
 *   - The staff app's globals.css already declares both `:root`
 *     (dark-first) AND `.light` blocks with quality token values — so
 *     light mode paints correctly the moment the toggle is flipped.
 *
 * Storage-key migration note: the previous `next-themes` direct import
 * used the default `theme` localStorage key. PublicThemeGuard uses the
 * canonical `henryco-public-theme` key (shared with public, owner, and
 * account surfaces). Existing staff users with a pinned preference get
 * a one-time reset to System; per the THEME-01 spec, this is acceptable.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className={reading.variable}>
      <body className="min-h-screen antialiased">
        <PublicThemeGuard includeToasts={false}>
          <ScrollToTopOnNavigation />
          {children}
        </PublicThemeGuard>
      </body>
    </html>
  );
}
