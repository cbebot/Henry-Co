import { redirect } from "next/navigation";
import { getAccountUrl, getStaffHqUrl } from "@henryco/config";
import { getCurrentStaffAuthUser, getDefaultStaffLandingPath, getStaffViewer } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

function normalizeStaffNext(next?: string) {
  if (!next) return "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default async function StaffLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const requestedPath = normalizeStaffNext(params.next);
  const requestedDestination = getStaffHqUrl(requestedPath);
  const user = await getCurrentStaffAuthUser();

  if (user) {
    const viewer = await getStaffViewer();
    if (!viewer) {
      redirect("/no-access");
    }

    redirect(requestedPath !== "/" ? requestedPath : getDefaultStaffLandingPath(viewer));
  }

  redirect(getAccountUrl(`/login?next=${encodeURIComponent(requestedDestination)}`));
}
