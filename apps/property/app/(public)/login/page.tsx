import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPropertyViewer } from "@/lib/property/auth";
import { getSharedAccountLoginUrl, sanitizePropertyPath } from "@/lib/property/links";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = sanitizePropertyPath(params.next, "/");
  const viewer = await getPropertyViewer();

  if (viewer.user) {
    redirect(nextPath);
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host") || "property.henrycogroup.com";
  const protocol =
    headerStore.get("x-forwarded-proto") ||
    (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
  const propertyOrigin = `${protocol}://${host}`;

  redirect(
    getSharedAccountLoginUrl({
      nextPath,
      propertyOrigin,
    })
  );
}
