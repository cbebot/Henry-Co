import { redirect } from "next/navigation";
import { getAccountLearnUrl } from "@/lib/learn/links";

export default function LearnerCertificatesPage() {
  redirect(getAccountLearnUrl("certificates"));
}
