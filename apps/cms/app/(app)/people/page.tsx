import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, PencilLine, Plus, UserRound } from "lucide-react";
import { listPeople, type Person } from "@/lib/cms/people";

export const metadata: Metadata = { title: "People — Owner CMS" };
export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  owner: "Owner",
  leadership: "Leadership",
  team: "Team",
  manager: "Manager",
};

function kindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? (kind ? kind.charAt(0).toUpperCase() + kind.slice(1) : "Team");
}

export default async function PeopleIndex() {
  const people = await listPeople();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--hc-accent-text)]">
            Owner CMS
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--hc-ink)]">People</h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--hc-ink-muted)]">
            The leadership and team members shown on your public pages. Reorder with the sort value,
            toggle who is published, and edit each person&apos;s bio and photo.
          </p>
        </div>
        <Link
          href="/people/new"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[var(--hc-accent)] px-4 text-sm font-semibold text-[#1a1408] transition-colors hover:bg-[var(--hc-accent-strong)]"
        >
          <Plus className="h-4 w-4" aria-hidden /> New person
        </Link>
      </div>

      {people.length === 0 ? (
        <Link
          href="/people/new"
          className="mt-8 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--hc-line)] p-10 text-center transition-colors hover:border-[var(--hc-accent)]"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--hc-accent-soft)] text-[var(--hc-accent-text)]">
            <UserRound className="h-6 w-6" aria-hidden />
          </span>
          <span className="mt-1 text-sm font-medium text-[var(--hc-ink)]">No people yet</span>
          <span className="text-sm text-[var(--hc-ink-muted)]">
            Add your first leadership or team member.
          </span>
        </Link>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {people.map((p: Person) => (
            <li key={p.id}>
              <Link
                href={`/people/${p.id}`}
                className="group flex h-full items-start gap-4 rounded-2xl border border-[var(--hc-line)] bg-[var(--hc-surface)] p-5 transition-all hover:border-[var(--hc-accent)] hover:shadow-sm"
              >
                {p.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.photo_url}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-xl border border-[var(--hc-line)] object-cover"
                  />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--hc-accent-soft)] text-[var(--hc-accent-text)]">
                    <UserRound className="h-6 w-6" aria-hidden />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="flex items-center gap-1.5 truncate text-base font-semibold text-[var(--hc-ink)]">
                      {p.full_name || "Untitled person"}
                      <ArrowUpRight
                        className="h-4 w-4 shrink-0 text-[var(--hc-ink-muted)] opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden
                      />
                    </h2>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        p.is_published
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-[var(--owner-accent-soft)] text-[var(--hc-accent-text)]"
                      }`}
                    >
                      {p.is_published ? "Published" : "Hidden"}
                    </span>
                  </div>
                  {p.role_title ? (
                    <p className="mt-0.5 truncate text-sm text-[var(--hc-ink-soft)]">{p.role_title}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--hc-bg-soft)] px-2.5 py-1 text-xs font-medium text-[var(--hc-ink-muted)]">
                      {kindLabel(p.kind)}
                    </span>
                    <span className="text-xs text-[var(--hc-ink-muted)]">/{p.page_slug}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--hc-accent-text)] opacity-0 transition-opacity group-hover:opacity-100">
                      <PencilLine className="h-3.5 w-3.5" aria-hidden /> Edit
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
