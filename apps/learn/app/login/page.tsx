import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { getSharedAuthUrl } from "@/lib/learn/links";
import { getLearnPublicLocale } from "@/lib/locale-server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLearnPublicLocale();
  return { title: `${translateSurfaceLabel(locale, "Sign In")} - HenryCo Learn` };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  redirect(getSharedAuthUrl("login", params.next || "/"));
}
