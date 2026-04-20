import { redirect } from "next/navigation";
import { getLogisticsSharedLoginUrl } from "@/lib/logistics-public-links";

export default async function LogisticsLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const next = typeof params.next === "string" && params.next.trim() ? params.next : "/track";
  redirect(getLogisticsSharedLoginUrl(next));
}
