import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PublicThemeGuard } from "@henryco/ui/public-shell";

export const metadata: Metadata = {
  title: "Henry Onyx — Owner CMS",
  description: "Owner-only content management for the Henry Onyx public surfaces.",
  // Private surface: never index the admin.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <PublicThemeGuard>{children}</PublicThemeGuard>
      </body>
    </html>
  );
}
