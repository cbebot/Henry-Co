import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Shield } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getAuditEntry } from "@/lib/owner-data";
import { getHubPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ source: string; id: string }>;
}): Promise<Metadata> {
  const { source, id } = await params;
  const locale = await getHubPublicLocale();
  const t = (s: string) => translateSurfaceLabel(locale, s);
  return {
    title: `${t("Audit entry")} · ${source}`,
    description: `${t("Full audit log entry")} ${id.slice(0, 8)}`,
  };
}

const SKIP_DISPLAY = new Set(["id", "_source"]);

function formatFieldName(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function isTimestampKey(key: string): boolean {
  return key.endsWith("_at") || key.endsWith("_date") || key === "timestamp";
}

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (isTimestampKey(key) && typeof value === "string") {
    try {
      return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(value));
    } catch {
      return String(value);
    }
  }
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export default async function AuditEntryPage({
  params,
}: {
  params: Promise<{ source: string; id: string }>;
}) {
  const { source, id } = await params;
  const [entry, locale] = await Promise.all([getAuditEntry(source, id), getHubPublicLocale()]);
  const t = (s: string) => translateSurfaceLabel(locale, s);

  if (!entry) notFound();

  const action = String(entry.action || entry.event_type || t("Event"));
  const entity = String(entry.entity || entry.entity_id || "");
  const actor = String(entry.actor_role || entry.actor || "");
  const createdAt = String(entry.created_at || "");

  const fields = Object.entries(entry).filter(([k]) => !SKIP_DISPLAY.has(k));

  return (
    <div className="space-y-6 acct-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href="/owner/settings/audit"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--acct-muted)] hover:text-[var(--owner-accent)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {t("Audit log")}
        </Link>
      </div>

      <OwnerPageHeader
        eyebrow={`${t("Audit")} · ${source}`}
        title={action}
        description={
          entity
            ? `${t("Entity")}: ${entity.length > 60 ? `${entity.slice(0, 8)}…` : entity}`
            : t("Audit event detail")
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetaCard label={t("Source")} value={source} />
        <MetaCard label={t("Actor")} value={actor || "—"} />
        <MetaCard label={t("When")} value={createdAt ? formatValue("created_at", createdAt) : "—"} />
      </div>

      <OwnerPanel
        title={t("Full event payload")}
        description={t("Every field recorded for this audit event.")}
      >
        <div className="overflow-x-auto">
          <table className="owner-table">
            <thead>
              <tr>
                <th>{t("Field")}</th>
                <th>{t("Value")}</th>
              </tr>
            </thead>
            <tbody>
              {fields.map(([key, value]) => (
                <tr key={key}>
                  <td className="whitespace-nowrap font-mono text-xs text-[var(--acct-muted)]">
                    {formatFieldName(key)}
                  </td>
                  <td>
                    {typeof value === "object" && value !== null ? (
                      <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-[var(--acct-bg)] p-2 font-mono text-xs text-[var(--acct-ink)]">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      <span
                        className={
                          typeof value === "string" && value.length > 32
                            ? "font-mono text-xs"
                            : "text-sm"
                        }
                      >
                        {formatValue(key, value)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </OwnerPanel>

      <div className="flex items-center gap-3">
        <Link
          href="/owner/settings/audit"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--acct-line)] px-4 py-2 text-sm font-semibold text-[var(--acct-muted)] hover:border-[var(--owner-accent)] hover:text-[var(--owner-accent)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("Back to audit log")}
        </Link>
        <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--acct-line)] px-4 py-2 text-xs text-[var(--acct-muted)]">
          <Shield className="h-3.5 w-3.5" aria-hidden />
          ID: <span className="font-mono">{id}</span>
        </div>
      </div>
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--acct-muted)]">{label}</p>
      <p className="mt-1.5 truncate text-sm font-medium text-[var(--acct-ink)]" title={value}>
        {value}
      </p>
    </div>
  );
}
