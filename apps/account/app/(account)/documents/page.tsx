import { FileText, Download } from "lucide-react";
import { getAccountCopy } from "@henryco/i18n/server";
import { requireAccountUser } from "@/lib/auth";
import { getDocuments } from "@/lib/account-data";
import { formatDate } from "@/lib/format";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";

const typeChip: Record<string, string> = {
  document: "acct-chip-blue",
  receipt: "acct-chip-green",
  certificate: "acct-chip-purple",
  id_document: "acct-chip-orange",
  contract: "acct-chip-gold",
  other: "acct-chip-gold",
};

export default async function DocumentsPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const documents = await getDocuments(user.id);
  const copy = getAccountCopy(locale).documents;

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title={copy.hero.title}
        description={copy.hero.body}
        icon={FileText}
      />

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={copy.empty.title}
          description={copy.empty.description}
        />
      ) : (
        <div className="acct-card divide-y divide-[var(--acct-line)]">
          {documents.map((doc: Record<string, string | number>) => {
            const typeKey = (doc.type as string) || "other";
            const typeLabel =
              copy.types[typeKey as keyof typeof copy.types] || String(doc.type || "");
            return (
              <div key={doc.id as string} className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--acct-blue-soft)]">
                  <FileText size={18} className="text-[var(--acct-blue)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--acct-ink)]">{doc.name}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span
                      className={`acct-chip text-[0.6rem] ${
                        typeChip[typeKey] || "acct-chip-gold"
                      }`}
                    >
                      {typeLabel}
                    </span>
                    <span className="text-xs text-[var(--acct-muted)]">
                      {formatDate(doc.created_at as string, { locale })}
                    </span>
                  </div>
                </div>
                {doc.file_url ? (
                  <a
                    href={`/api/documents/file/${doc.id}`}
                    download={(doc.name as string) || "document"}
                    rel="noopener"
                    className="acct-button-ghost rounded-lg"
                    aria-label={copy.card.downloadLabel}
                    title={copy.card.downloadLabel}
                  >
                    <Download size={16} />
                  </a>
                ) : (
                  <span
                    className="acct-button-ghost rounded-lg opacity-40"
                    aria-disabled="true"
                    title={copy.card.noFileAttached}
                  >
                    <Download size={16} />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
