import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Henry Onyx Studio — Sites",
  description: "Sites built and served by Henry Onyx Studio.",
};

export default function StudioSitesRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
