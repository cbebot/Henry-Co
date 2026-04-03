import { redirect } from "next/navigation";
import { getSharedAuthUrl } from "@/lib/learn/links";

export const metadata = { title: "Sign In - HenryCo Learn" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  redirect(getSharedAuthUrl("login", params.next || "/"));
}
