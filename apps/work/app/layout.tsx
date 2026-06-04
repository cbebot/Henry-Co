import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Henry Onyx Staff Workspace (Staged)",
  description:
    "V3-COMMAND-02 — Staff Workspace staged foundation against mocks. No live data.",
  robots: { index: false, follow: false },
};

export default function WorkRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
