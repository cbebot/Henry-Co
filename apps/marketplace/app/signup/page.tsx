import { redirect } from "next/navigation";
import { buildSharedAccountSignupUrl } from "@/lib/marketplace/shared-account";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  redirect(buildSharedAccountSignupUrl(params.next || "/account"));
}
