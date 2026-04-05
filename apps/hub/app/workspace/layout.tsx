import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Mono, Manrope } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--workspace-font-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--workspace-font-mono",
});

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "Henry & Co. Workspace Retired",
  description: "The previous HenryCo staff workspace has been retired pending a premium rebuild.",
};

export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className={`${manrope.variable} ${plexMono.variable} font-[family-name:var(--workspace-font-sans)]`}
    >
      {children}
    </div>
  );
}
