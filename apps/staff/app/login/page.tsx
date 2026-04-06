import { redirect } from "next/navigation";
import { getAccountUrl, getStaffHqUrl } from "@henryco/config";
import { getDefaultStaffLandingPath, getStaffViewer } from "@/lib/staff-auth";
import { createStaffSupabaseServer } from "@/lib/supabase/server";

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
  const supabase = await createStaffSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const viewer = await getStaffViewer();
    if (!viewer) {
      redirect("/no-access");
    }

    redirect(requestedPath !== "/" ? requestedPath : getDefaultStaffLandingPath(viewer));
  }

  redirect(getAccountUrl(`/login?next=${encodeURIComponent(requestedDestination)}`));
}
