import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";

const SUGGESTIONS = [
  { label: "Remote", href: "/jobs?mode=remote" },
  { label: "Hybrid", href: "/jobs?mode=hybrid" },
  { label: "Verified only", href: "/jobs?verified=1" },
  { label: "Full-time", href: "/jobs?type=full-time" },
  { label: "Lagos", href: "/jobs?loc=Lagos" },
  { label: "Internal HenryCo", href: "/jobs?internal=1" },
];

type Category = { slug: string; name: string; count: number };

function paramString(params: Record<string, string | string[] | undefined>, key: string) {
  const v = params[key];
  return typeof v === "string" ? v : "";
}

export function JobsBrowsePanel({
  params,
  categories,
}: {
  params: Record<string, string | string[] | undefined>;
  categories: Category[];
}) {
  const q = paramString(params, "q");
  const category = paramString(params, "category");
  const loc = paramString(params, "loc");
  const mode = paramString(params, "mode");
  const type = paramString(params, "type");
  const employer = paramString(params, "employer");
  const verifiedOnly = paramString(params, "verified") === "1";
  const internalOnly = paramString(params, "internal") === "1";

  const filterFields = (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--jobs-muted)]">
          Category
          <select className="jobs-select mt-2" name="category" defaultValue={category}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--jobs-muted)]">
          Location
          <input
            className="jobs-input mt-2"
            name="loc"
            defaultValue={loc}
            placeholder="City, region, or “Remote”"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--jobs-muted)]">
          Work mode
          <select className="jobs-select mt-2" name="mode" defaultValue={mode}>
            <option value="">Any mode</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
          </select>
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--jobs-muted)]">
          Role type
          <select className="jobs-select mt-2" name="type" defaultValue={type}>
            <option value="">Any type</option>
            <option value="full-time">Full-time</option>
            <option value="contract">Contract</option>
            <option value="part-time">Part-time</option>
          </select>
        </label>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="jobs-soft-panel inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-3 text-sm font-medium">
          <input type="checkbox" name="verified" value="1" defaultChecked={verifiedOnly} />
          Verified employers only
        </label>
        <label className="jobs-soft-panel inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-3 text-sm font-medium">
          <input type="checkbox" name="internal" value="1" defaultChecked={internalOnly} />
          Internal HenryCo roles only
        </label>
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <form method="GET" className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
          {employer ? <input type="hidden" name="employer" value={employer} /> : null}
          <label className="sr-only" htmlFor="jobs-q">
            Search jobs
          </label>
          <input
            id="jobs-q"
            className="jobs-input min-h-[3.25rem] flex-1 text-base lg:text-sm"
            name="q"
            defaultValue={q}
            placeholder="Try a role, skill, team, or company name"
            autoComplete="off"
          />
          <button
            type="submit"
            className="jobs-button-primary shrink-0 rounded-[1.15rem] px-8 py-3.5 text-sm font-semibold lg:rounded-full lg:px-7"
          >
            Search
          </button>
        </div>

        <p className="text-xs font-medium text-[var(--jobs-muted)]">Popular starting points</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-[var(--jobs-line)] bg-[var(--jobs-paper-soft)] px-3.5 py-1.5 text-xs font-semibold text-[var(--jobs-ink)] transition hover:border-[color-mix(in_srgb,var(--jobs-accent)_40%,transparent)] hover:bg-[var(--jobs-accent-soft)]"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <details className="jobs-soft-panel group rounded-[1.5rem] p-4 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
            <SlidersHorizontal className="h-4 w-4 text-[var(--jobs-accent)]" />
            Filters
            <span className="ml-auto text-xs font-medium text-[var(--jobs-muted)]">Tap to expand</span>
          </summary>
          <div className="mt-4 space-y-4 border-t border-[var(--jobs-line)] pt-4">{filterFields}</div>
        </details>

        <div className="hidden space-y-4 lg:block">{filterFields}</div>
      </form>
    </div>
  );
}
