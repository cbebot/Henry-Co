import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldOff } from "lucide-react";
import { getAccountUrl, getStaffHqUrl } from "@henryco/config";
import { getCurrentStaffAuthUser, getDefaultStaffLandingPath, getStaffViewer } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export default async function StaffNoAccessPage() {
  const user = await getCurrentStaffAuthUser();

  if (!user) {
    const next = getStaffHqUrl("/no-access");
    redirect(getAccountUrl(`/login?next=${encodeURIComponent(next)}`));
  }

  const viewer = await getStaffViewer();
  if (viewer) {
    redirect(getDefaultStaffLandingPath(viewer));
  }

  return (
    <div className="staff-fade-in flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="staff-card w-full max-w-lg p-8 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--staff-critical-soft)] text-[var(--staff-critical)]">
          <ShieldOff size={28} strokeWidth={1.75} />
        </div>
        <p className="staff-kicker mb-2">Staff HQ</p>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--staff-ink)]">
          No staff access on this account
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--staff-muted)]">
          You&apos;re signed in, but this HenryCo account doesn&apos;t have an active staff membership yet.
          If you believe this is a mistake, contact your administrator or use your customer account home below.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={getAccountUrl("/")}
            className="inline-flex items-center justify-center rounded-[var(--staff-radius)] bg-[var(--staff-gold)] px-5 py-2.5 text-sm font-semibold text-[#0a0c12] transition hover:opacity-95"
          >
            Go to account home
          </Link>
          <Link
            href={getAccountUrl("/support")}
            className="inline-flex items-center justify-center rounded-[var(--staff-radius)] border border-[var(--staff-line)] bg-[var(--staff-surface)] px-5 py-2.5 text-sm font-medium text-[var(--staff-ink)] transition hover:bg-[var(--staff-bg-elevated)]"
          >
            Get help
          </Link>
        </div>
      </div>
    </div>
  );
}
