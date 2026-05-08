import { redirect } from "next/navigation";

/**
 * Legacy URL — the canonical home is now `/client`. Keep this route as
 * a permanent server-side redirect so any old bookmark / deep link
 * still lands somewhere useful.
 */
export default function ClientDashboardLegacy() {
  redirect("/client");
}
