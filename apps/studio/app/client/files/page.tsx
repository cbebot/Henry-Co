import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileImage, FileText, Files, Package, Receipt, Sparkles } from "lucide-react";
import { getStudioClientPagesCopy } from "@henryco/i18n";
import { requireStudioUser } from "@/lib/studio/auth";
import { studioClientSnapshot } from "@/lib/studio/data";
import { getStudioSnapshot } from "@/lib/studio/store";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { PortalEmptyState } from "@/components/portal/empty-state";

export const metadata: Metadata = {
  title: "Files",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const KIND_ICON = {
  reference: Sparkles,
  proof: Receipt,
  deliverable: Package,
} as const;

function pickIcon(mime: string | null | undefined, kind: string) {
  if (kind === "deliverable") return Package;
  if (kind === "proof") return Receipt;
  if (mime?.startsWith("image/")) return FileImage;
  if (mime === "application/pdf") return FileText;
  return KIND_ICON[kind as keyof typeof KIND_ICON] ?? Files;
}

function humanSize(bytes: number | null): string {
  if (!bytes || !Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export default async function ClientFilesPage() {
  const viewer = await requireStudioUser("/client/files");
  const snapshot = await getStudioSnapshot();
  const clientData = studioClientSnapshot(viewer, snapshot);
  const locale = await getStudioPublicLocale();
  const copy = getStudioClientPagesCopy(locale).files;

  const kindLabel: Record<string, string> = {
    reference: copy.kindReference,
    proof: copy.kindProof,
    deliverable: copy.kindDeliverable,
  };

  if (clientData.files.length === 0) {
    return (
      <div className="space-y-6">
        <Header copy={copy} />
        <PortalEmptyState
          icon={Files}
          title={copy.emptyTitle}
          body={copy.emptyBody}
          action={
            <Link href="/client" className="portal-button portal-button-secondary">
              {copy.openWorkspace}
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      </div>
    );
  }

  // Group by project for navigation; fall back to "Unassigned" for files
  // not yet pinned to a project (lead-stage references).
  const titleByProject = new Map(clientData.projects.map((p) => [p.id, p.title]));
  const grouped = new Map<string, typeof clientData.files>();
  for (const file of clientData.files) {
    const key = file.projectId || "_unassigned";
    if (!grouped.has(key)) grouped.set(key, [] as typeof clientData.files);
    grouped.get(key)!.push(file);
  }

  return (
    <div className="space-y-7">
      <Header copy={copy} />

      {Array.from(grouped.entries()).map(([projectId, files]) => {
        const title =
          projectId === "_unassigned"
            ? copy.briefReferences
            : titleByProject.get(projectId) || copy.project;
        return (
          <section key={projectId} className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-ink-soft)]">
                {title} · {files.length}
              </h2>
              {projectId !== "_unassigned" ? (
                <Link
                  href={`/client/projects/${projectId}?tab=files`}
                  className="text-[12px] font-semibold text-[var(--studio-signal)] hover:underline"
                >
                  {copy.openProject}
                </Link>
              ) : null}
            </div>

            <ul className="grid gap-2.5 sm:grid-cols-2">
              {files.map((file) => {
                const Icon = pickIcon(file.mimeType, file.kind);
                return (
                  <li
                    key={file.id}
                    className="portal-card flex items-start gap-3 px-4 py-3.5"
                  >
                    <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl border border-[var(--studio-line-strong)] bg-[rgba(151,244,243,0.06)] text-[var(--studio-signal)]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                          {kindLabel[file.kind] ?? file.kind}
                        </span>
                        {file.size ? (
                          <span className="text-[10px] tabular-nums text-[var(--studio-ink-soft)]">
                            · {humanSize(file.size)}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-0.5 truncate text-[13.5px] font-semibold text-[var(--studio-ink)]">
                        {file.label}
                      </div>
                      <div className="mt-0.5 truncate text-[11.5px] text-[var(--studio-ink-soft)]">
                        {file.path}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function Header({
  copy,
}: {
  copy: ReturnType<typeof getStudioClientPagesCopy>["files"];
}) {
  return (
    <header>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
        {copy.kicker}
      </div>
      <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)] sm:text-3xl">
        {copy.title}
      </h1>
      <p className="mt-2 max-w-2xl text-[13.5px] leading-6 text-[var(--studio-ink-soft)]">
        {copy.body}
      </p>
    </header>
  );
}
