import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, FileText, PencilLine } from "lucide-react";
import { listPages, pageLabel } from "@/lib/cms/pages";

export const metadata: Metadata = { title: "Company Pages — Owner CMS" };
export const dynamic = "force-dynamic";

export default async function PagesIndex() {
  const pages = await listPages();

  return (
    <div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--hc-accent-text)]">
          Owner CMS
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--hc-ink)]">Company Pages</h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--hc-ink-muted)]">
          Edit the real content of every public Henry &amp; Co. page. Changes save to a private draft
          and only go live when you publish.
        </p>
      </div>

      {pages.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-[var(--hc-line)] p-6 text-sm text-[var(--hc-ink-muted)]">
          No pages found yet.
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {pages.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/pages/${p.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-[var(--hc-line)] bg-[var(--hc-surface)] p-5 transition-all hover:border-[var(--hc-accent)] hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--hc-accent-soft)] text-[var(--hc-accent-text)]">
                    <FileText className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="flex items-center gap-2">
                    {p.has_draft ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Draft
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        p.is_published
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-[var(--owner-accent-soft)] text-[var(--hc-accent-text)]"
                      }`}
                    >
                      {p.is_published ? "Published" : "Unpublished"}
                    </span>
                  </div>
                </div>
                <h2 className="mt-4 flex items-center gap-1.5 text-base font-semibold text-[var(--hc-ink)]">
                  {pageLabel(p.slug)}
                  <ArrowUpRight
                    className="h-4 w-4 text-[var(--hc-ink-muted)] opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                </h2>
                <p className="mt-1 text-sm text-[var(--hc-ink-muted)]">/{p.slug}</p>
                {p.title ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--hc-ink-soft)]">
                    {p.title}
                  </p>
                ) : null}
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--hc-accent-text)]">
                  <PencilLine className="h-4 w-4" aria-hidden /> Edit page
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
