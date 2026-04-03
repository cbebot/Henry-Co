import { redirect } from "next/navigation";
import { getSharedAccountSignupUrl } from "@/lib/account";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  redirect(getSharedAccountSignupUrl(params.next));
}
