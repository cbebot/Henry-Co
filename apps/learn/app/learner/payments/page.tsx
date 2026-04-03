import { redirect } from "next/navigation";
import { getAccountLearnUrl } from "@/lib/learn/links";

export default function LearnerPaymentsPage() {
  redirect(getAccountLearnUrl("payments"));
}
