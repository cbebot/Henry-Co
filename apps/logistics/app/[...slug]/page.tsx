import Link from "next/link";
import { getDivisionConfig, getStaffHqUrl } from "@henryco/config";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const STAFF_ROOTS = new Set(["dispatch", "finance", "owner", "rider"]);

export default async function LogisticsCatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const requestedRoot = String(slug[0] || "").trim().toLowerCase();
  const isRetiredSupportWorkspace = requestedRoot === "support" && slug.length > 1;

  if (STAFF_ROOTS.has(requestedRoot) || isRetiredSupportWorkspace) {
    redirect(getStaffHqUrl("/logistics"));
  }

  const logistics = getDivisionConfig("logistics");
  const requestedPath = `/${slug.join("/")}`;

  return (
    <main id="henryco-main" tabIndex={-1} className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
          {logistics.name}
        </p>
        <h1 className="mt-4 text-2xl font-semibold text-white">Page not found</h1>
        <p className="mt-3 text-sm text-[var(--logistics-muted)]">
          We could not find <span className="font-mono text-white/80">{requestedPath}</span>. Try the home page, book a
          delivery, or track an existing shipment.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-[linear-gradient(135deg,#f6e2d0_0%,var(--logistics-accent)_52%,#9f8b7d_100%)] px-5 py-2.5 text-sm font-semibold text-[#170f12]"
          >
            Home
          </Link>
          <Link href="/book" className="rounded-full border border-[var(--logistics-line)] px-5 py-2.5 text-sm font-semibold text-white/90">
            Book
          </Link>
          <Link href="/track" className="rounded-full border border-[var(--logistics-line)] px-5 py-2.5 text-sm font-semibold text-white/90">
            Track
          </Link>
        </div>
      </div>
    </main>
  );
}
