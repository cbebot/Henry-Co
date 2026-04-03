import type { Metadata } from "next";
import { redirect } from "next/navigation";
import OwnerLoginClient from "../../components/OwnerLoginClient";
import { requireOwner } from "../../lib/owner-auth";

export const metadata: Metadata = {
  title: "Owner Login | Henry & Co.",
  description:
    "Secure owner access for Henry & Co. website operations, brand controls, public content management, and division administration.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OwnerLoginPage() {
  const auth = await requireOwner();

  if (auth.ok) {
    redirect("/owner");
  }

  return <OwnerLoginClient />;
}
