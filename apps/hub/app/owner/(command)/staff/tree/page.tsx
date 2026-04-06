import Link from "next/link";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getWorkforceCenterData } from "@/lib/owner-data";
import { OWNER_DIVISION_SLUGS } from "@/lib/owner-workforce-catalog";
import { divisionLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StaffTreePage() {
  const data = await getWorkforceCenterData();

  const byDivision = new Map<string, typeof data.members>();
  for (const slug of OWNER_DIVISION_SLUGS) {
    byDivision.set(
      slug,
      data.members.filter((m) => m.division === slug)
    );
  }
  const unassigned = data.members.filter((m) => !m.division);

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Staff intelligence"
        title="Organization tree"
        description="HenryCo at the root, divisions as branches, people grouped underneath. Expand mentally by division — optimized for fast scanning on desktop and stacked cards on mobile."
      />

      <div className="acct-card relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute left-8 top-0 h-full w-px bg-[var(--acct-line)] sm:left-10" aria-hidden />
        <div className="relative pl-8 sm:pl-12">
          <div className="rounded-[1.25rem] border border-[var(--acct-gold)]/35 bg-[var(--acct-gold-soft)] px-4 py-3">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--acct-muted)]">Root</div>
            <div className="mt-1 text-lg font-semibold text-[var(--acct-ink)]">Henry &amp; Co. Group</div>
            <p className="mt-1 text-sm text-[var(--acct-muted)]">{data.metrics.total} people in workforce directory</p>
          </div>

          <div className="mt-8 space-y-8">
            {OWNER_DIVISION_SLUGS.map((slug) => {
              const members = byDivision.get(slug) ?? [];
              return (
                <section key={slug} className="relative">
                  <div className="absolute -left-8 top-6 h-px w-6 bg-[var(--acct-line)] sm:-left-10 sm:w-10" aria-hidden />
                  <div className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[var(--acct-muted)]">
                          Division branch
                        </div>
                        <h2 className="mt-1 text-xl font-semibold text-[var(--acct-ink)]">{divisionLabel(slug)}</h2>
                        <p className="mt-1 text-sm text-[var(--acct-muted)]">
                          {members.length} member{members.length === 1 ? "" : "s"} ·{" "}
                          {members.filter((m) => m.status === "active").length} active
                        </p>
                      </div>
                      <Link href={`/owner/divisions/${slug}`} className="acct-button-secondary rounded-xl text-sm">
                        Division HQ
                      </Link>
                    </div>
                    {members.length === 0 ? (
                      <p className="mt-4 text-sm text-[var(--acct-muted)]">No workforce members assigned to this division yet.</p>
                    ) : (
                      <ul className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {members.map((m) => (
                          <li key={m.id}>
                            <Link
                              href={`/owner/staff/users/${m.id}`}
                              className="flex flex-col rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-3 text-left transition hover:border-[var(--owner-accent)]/35"
                            >
                              <span className="font-medium text-[var(--acct-ink)]">{m.fullName}</span>
                              <span className="text-xs text-[var(--acct-muted)]">{m.email || "No email"}</span>
                              <span className="mt-1 text-[0.65rem] uppercase tracking-wide text-[var(--acct-muted)]">
                                {m.role.replace(/_/g, " ")} · {m.status}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              );
            })}

            {unassigned.length > 0 ? (
              <section className="relative">
                <div className="absolute -left-8 top-6 h-px w-6 bg-[var(--acct-line)] sm:-left-10 sm:w-10" aria-hidden />
                <div className="rounded-[1.35rem] border border-dashed border-[var(--acct-line)] bg-[var(--acct-bg)] p-4 sm:p-5">
                  <h2 className="text-lg font-semibold text-[var(--acct-ink)]">Unassigned</h2>
                  <p className="text-sm text-[var(--acct-muted)]">
                    {unassigned.length} member{unassigned.length === 1 ? "" : "s"} without a primary division.
                  </p>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {unassigned.map((m) => (
                      <li key={m.id}>
                        <Link href={`/owner/staff/users/${m.id}`} className="block rounded-xl border border-[var(--acct-line)] px-3 py-2 text-sm font-medium hover:bg-[var(--acct-surface)]">
                          {m.fullName}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
