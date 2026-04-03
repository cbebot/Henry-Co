import { redirect } from "next/navigation";
import { getSharedAccountLoginUrl } from "@/lib/account";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  redirect(getSharedAccountLoginUrl(params.next));
}
