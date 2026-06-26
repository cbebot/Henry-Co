"use client";

import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { getStudioClientPagesCopy } from "@henryco/i18n";
import { FileCard } from "@/components/portal/file-card";
import { PortalEmptyState } from "@/components/portal/empty-state";
import type { ClientDeliverable, ClientFileType } from "@/types/portal";

export function FilesView({
  deliverables,
  projects,
}: {
  deliverables: ClientDeliverable[];
  projects: Array<{ id: string; title: string }>;
}) {
  const locale = useHenryCoLocale();
  const copy = getStudioClientPagesCopy(locale).filesView;

  const FILE_TYPE_OPTIONS: Array<{ value: ClientFileType | "all"; label: string }> = [
    { value: "all", label: copy.typeAll },
    { value: "image", label: copy.typeImage },
    { value: "pdf", label: copy.typePdf },
    { value: "video", label: copy.typeVideo },
    { value: "archive", label: copy.typeArchive },
    { value: "other", label: copy.typeOther },
  ];

  const STATUS_OPTIONS: Array<{ value: "all" | "shared" | "approved"; label: string }> = [
    { value: "all", label: copy.statusAll },
    { value: "shared", label: copy.statusShared },
    { value: "approved", label: copy.statusApproved },
  ];

  const SORT_OPTIONS: Array<{ value: "shared" | "milestone"; label: string }> = [
    { value: "shared", label: copy.sortRecent },
    { value: "milestone", label: copy.sortMilestone },
  ];

  const [project, setProject] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [sort, setSort] = useState<"shared" | "milestone">("shared");

  const filtered = useMemo(() => {
    let next = deliverables.slice();
    if (project !== "all") next = next.filter((d) => d.projectId === project);
    if (type !== "all") next = next.filter((d) => d.fileType === type);
    if (status !== "all") next = next.filter((d) => d.status === status);

    if (sort === "shared") {
      next.sort((a, b) => {
        const aTime = new Date(a.sharedAt || a.createdAt).getTime();
        const bTime = new Date(b.sharedAt || b.createdAt).getTime();
        return bTime - aTime;
      });
    } else {
      next.sort((a, b) => (a.milestoneId || "").localeCompare(b.milestoneId || ""));
    }
    return next;
  }, [deliverables, project, type, status, sort]);

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
          {copy.kicker}
        </div>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)] sm:text-3xl">
          {copy.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--studio-ink-soft)]">
          {copy.body}
        </p>
      </header>

      <section className="portal-card flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:flex-wrap sm:gap-4 sm:px-5">
        <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
          <Filter className="h-3.5 w-3.5" />
          {copy.filters}
        </div>

        <FilterSelect label={copy.filterProject} value={project} onChange={setProject}>
          <option value="all">{copy.allProjects}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label={copy.filterType} value={type} onChange={setType}>
          {FILE_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label={copy.filterStatus} value={status} onChange={setStatus}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label={copy.filterSort} value={sort} onChange={(v) => setSort(v as "shared" | "milestone")}>
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FilterSelect>
      </section>

      {filtered.length === 0 ? (
        <PortalEmptyState
          icon={Filter}
          title={copy.emptyTitle}
          body={copy.emptyBody}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((deliverable) => (
            <FileCard key={deliverable.id} deliverable={deliverable} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 text-[12.5px] font-semibold text-[var(--studio-ink-soft)]">
      <span className="sr-only">{label}</span>
      <span aria-hidden>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-[var(--studio-line)] bg-[rgba(255,255,255,0.04)] px-2.5 py-1.5 text-[12.5px] font-semibold text-[var(--studio-ink)] outline-none focus:border-[rgba(151,244,243,0.5)]"
      >
        {children}
      </select>
    </label>
  );
}
