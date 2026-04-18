import { FileText, Download } from "lucide-react";
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
  const copy =
    locale === "fr"
      ? {
          title: "Documents",
          description: "Vos reçus, certificats, contrats et fichiers importants.",
          emptyTitle: "Aucun document pour le moment",
          emptyDescription:
            "Vos documents, reçus et certificats issus des services HenryCo seront stockés ici.",
          types: {
            document: "Document",
            receipt: "Reçu",
            certificate: "Certificat",
            id_document: "Pièce d’identité",
            contract: "Contrat",
            other: "Autre",
          },
          downloadLabel: "Télécharger",
        }
      : {
          title: "Documents",
          description: "Your receipts, certificates, contracts, and important files.",
          emptyTitle: "No documents yet",
          emptyDescription:
            "Your documents, receipts, and certificates from HenryCo services will be stored here.",
          types: {
            document: "Document",
            receipt: "Receipt",
            certificate: "Certificate",
            id_document: "ID document",
            contract: "Contract",
            other: "Other",
          },
          downloadLabel: "Download",
        };

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title={copy.title}
        description={copy.description}
        icon={FileText}
      />

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={copy.emptyTitle}
          description={copy.emptyDescription}
        />
      ) : (
        <div className="acct-card divide-y divide-[var(--acct-line)]">
          {documents.map((doc: Record<string, string | number>) => (
            <div key={doc.id as string} className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--acct-blue-soft)]">
                <FileText size={18} className="text-[var(--acct-blue)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--acct-ink)]">{doc.name}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className={`acct-chip text-[0.6rem] ${typeChip[doc.type as string] || "acct-chip-gold"}`}>
                    {copy.types[doc.type as keyof typeof copy.types] || String(doc.type || "")}
                  </span>
                  <span className="text-xs text-[var(--acct-muted)]">
                    {formatDate(doc.created_at as string, { locale })}
                  </span>
                </div>
              </div>
              {doc.file_url && (
                <a
                  href={doc.file_url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="acct-button-ghost rounded-lg"
                  aria-label={copy.downloadLabel}
                >
                  <Download size={16} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
