import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { getStaffHqUrl } from "@henryco/config";

export const metadata: Metadata = {
  title: "Staff HQ — Henry & Co.",
  description: "Internal staff platform for Henry & Co. operations.",
  robots: { index: false, follow: false },
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? getStaffHqUrl("/")
      : "http://localhost:3020"
  ),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
