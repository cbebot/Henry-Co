import { redirect } from "next/navigation";
import { getStudioLoginUrl } from "@/lib/studio/links";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  redirect(getStudioLoginUrl(params.next || "/"));
}
