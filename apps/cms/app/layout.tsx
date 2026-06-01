import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PublicThemeGuard } from "@henryco/ui/public-shell";

export const metadata: Metadata = {
  title: "Henry & Co. — Owner CMS",
  description: "Owner-only content management for the Henry & Co. public surfaces.",
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
