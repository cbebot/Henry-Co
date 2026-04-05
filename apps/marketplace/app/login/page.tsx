import { redirect } from "next/navigation";
import { buildSharedAccountLoginUrl } from "@/lib/marketplace/shared-account";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  redirect(buildSharedAccountLoginUrl(params.next || "/account"));
}
