import type { Metadata } from "next";
import type { ReactNode } from "react";
import { henrycoFontVariables } from "@henryco/ui/brand-typography";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "Henry & Co. Staff HQ",
  description:
    "Role-aware HenryCo Staff HQ for managers, operators, finance reviewers, and cross-division teams.",
};

export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className={`${henrycoFontVariables} font-[family-name:var(--font-henryco-sans)]`}
    >
      {children}
    </div>
  );
}
