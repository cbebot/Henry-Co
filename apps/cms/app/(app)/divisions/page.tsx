import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Boxes, PencilLine, Star } from "lucide-react";
import { listDivisions } from "@/lib/cms/divisions";

export const metadata: Metadata = { title: "Divisions — Owner CMS" };
export const dynamic = "force-dynamic";

function statusLabel(status: string): string {
  return status
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function DivisionsIndex() {
  const divisions = await listDivisions();

  return (
    <div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--hc-accent-text)]">
          Owner CMS
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--hc-ink)]">Divisions</h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--hc-ink-muted)]">
          Manage the eight Henry &amp; Co. divisions — their copy, branding, lead, and where they
          appear across the public site. Saving a division updates the live record immediately.
        </p>
      </div>

      {divisions.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-[var(--hc-line)] p-6 text-sm text-[var(--hc-ink-muted)]">
          No divisions found yet.
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {divisions.map((d) => (
            <li key={d.id}>
              <Link
                href={`/divisions/${d.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-[var(--hc-line)] bg-[var(--hc-surface)] p-5 transition-all hover:border-[var(--hc-accent)] hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--hc-accent-text)]"
                    style={{
                      backgroundColor: d.accent ? `${d.accent}1f` : "var(--hc-accent-soft)",
                      color: d.accent || undefined,
                    }}
                  >
                    <Boxes className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="flex items-center gap-2">
                    {d.is_featured ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--owner-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--hc-accent-text)]">
                        <Star className="h-3 w-3" aria-hidden /> Featured
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        d.is_published
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {d.is_published ? "Published" : "Hidden"}
                    </span>
                  </div>
                </div>
                <h2 className="mt-4 flex items-center gap-1.5 text-base font-semibold text-[var(--hc-ink)]">
                  {d.name || d.slug}
                  <ArrowUpRight
                    className="h-4 w-4 text-[var(--hc-ink-muted)] opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                </h2>
                <p className="mt-1 text-sm text-[var(--hc-ink-muted)]">/{d.slug}</p>
                {d.tagline ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--hc-ink-soft)]">
                    {d.tagline}
                  </p>
                ) : null}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--hc-accent-text)]">
                    <PencilLine className="h-4 w-4" aria-hidden /> Edit division
                  </span>
                  {d.status ? (
                    <span className="rounded-full bg-[var(--hc-bg-soft)] px-2.5 py-1 text-xs font-medium text-[var(--hc-ink-muted)]">
                      {statusLabel(d.status)}
                    </span>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
