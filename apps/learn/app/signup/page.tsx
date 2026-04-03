import { redirect } from "next/navigation";
import { getSharedAuthUrl } from "@/lib/learn/links";

export const metadata = { title: "Create Account - HenryCo Learn" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  redirect(getSharedAuthUrl("signup", params.next || "/teach"));
}
