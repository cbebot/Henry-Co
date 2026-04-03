import { redirect } from "next/navigation";
import { getAccountLearnUrl } from "@/lib/learn/links";

export default function LearnerProgressPage() {
  redirect(getAccountLearnUrl("progress"));
}
