import { redirect } from "next/navigation";
import OwnerDashboardClient from "../components/OwnerDashboardClient";
import { requireOwner } from "../lib/owner-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OwnerPage() {
  const auth = await requireOwner();

  if (!auth.ok) {
    redirect("/owner/login");
  }

  return <OwnerDashboardClient />;
}
