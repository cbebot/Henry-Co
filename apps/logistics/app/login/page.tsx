import { redirect } from "next/navigation";
import { getAccountUrl, getDivisionUrl } from "@henryco/config";

export default function LogisticsLoginPage() {
  const next = `${getDivisionUrl("logistics")}/track`;
  redirect(getAccountUrl(`/login?next=${encodeURIComponent(next)}`));
}
