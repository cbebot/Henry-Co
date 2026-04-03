import type { ReactNode } from "react";
import { requireRoles } from "@/lib/auth/server";

export default async function OwnerOnlyLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRoles(["owner"]);
  return children;
}