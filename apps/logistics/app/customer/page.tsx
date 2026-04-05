import { redirect } from "next/navigation";
import { getAccountUrl } from "@henryco/config";

export default function LogisticsCustomerPage() {
  redirect(getAccountUrl("/logistics"));
}
