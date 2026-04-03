import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LegacyLoginRedirect({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  void searchParams;
  redirect("/");
}
