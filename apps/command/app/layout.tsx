import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces } from "next/font/google";
import { henrySubdomain } from "@henryco/config";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Henry Onyx Command Center",
  description:
    "Owner Command Center — company brain over all Henry Onyx divisions. V3-COMMAND-02 staged foundation.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const stagingHost = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : henrySubdomain("command");
  return (
    <html lang="en" className="dark" data-stage="command">
      <head>
        <meta name="staging-host" content={stagingHost} />
      </head>
      <body className={`${fraunces.variable} cc-canvas min-h-screen`}>{children}</body>
    </html>
  );
}
