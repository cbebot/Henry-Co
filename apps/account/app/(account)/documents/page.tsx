import { FileText, Download } from "lucide-react";
import { getAccountCopy } from "@henryco/i18n/server";
import {
  HeroCard,
  EmptyStateCard,
  TimelineCard,
  TimelineRow,
  DivisionLanding,
  type HeroCardTile,
  type TimelineChip,
  type TimelineChipTone,
} from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { getDocuments } from "@/lib/account-data";
import { formatDate } from "@/lib/format";
import { getAccountAppLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

const TYPE_TONE: Record<string, TimelineChipTone> = {
  document: "info",
  receipt: "success",
  certificate: "default",
  id_document: "warning",
  contract: "gold",
  other: "gold",
};

type DocumentRow = Record<string, string | number | null>;

/**
 * Documents landing.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2E). Adds HeroCard with totals by
 * type. Replaces hand-rolled list rows with TimelineCard.Row + primitive
 * chip tones (dropping the hardcoded `typeChip` color map).
 */
export default async function DocumentsPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const documents = (await getDocuments(user.id)) as DocumentRow[];
  const copy = getAccountCopy(locale).documents;

  // ── Per-type counts ──────────────────────────────────────────────
  const buckets = new Map<string, number>();
  for (const d of documents) {
    const t = (d.type as string) || "other";
    buckets.set(t, (buckets.get(t) ?? 0) + 1);
  }

  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: copy.types.document,
      value: documents.length,
      foot: copy.hero.body,
      tone: documents.length > 0 ? "accent" : "default",
    },
    {
      label: copy.types.receipt,
      value: buckets.get("receipt") ?? 0,
      foot: undefined,
    },
    {
      label: copy.types.certificate,
      value: buckets.get("certificate") ?? 0,
      foot: undefined,
    },
    {
      label: copy.types.contract,
      value: buckets.get("contract") ?? 0,
      foot: undefined,
    },
  ];

  return (
    <DivisionLanding
      className="acct-fade-in"
      hero={
        <HeroCard
          variant="solo"
          tone={documents.length === 0 ? "empty" : "calm"}
          eyebrow={copy.hero.eyebrow}
          headline={copy.hero.title}
          blurb={copy.hero.body}
          tiles={tiles}
        />
      }
      sections={[
        {
          id: "documents-list",
          title: copy.types.document,
          meta: `${documents.length}`,
          content:
            documents.length === 0 ? (
              <EmptyStateCard
                kicker={copy.hero.eyebrow}
                title={copy.empty.title}
                body={copy.empty.description}
              />
            ) : (
              <TimelineCard ariaLabel={copy.types.document}>
                {documents.map((doc) => {
                  const typeKey = (doc.type as string) || "other";
                  const typeLabel =
                    copy.types[typeKey as keyof typeof copy.types] ||
                    String(doc.type || "");
                  const chips: TimelineChip[] = [
                    { label: typeLabel, tone: TYPE_TONE[typeKey] ?? "gold" },
                  ];
                  return (
                    <TimelineRow
                      key={doc.id as string}
                      avatar={<FileText size={16} aria-hidden />}
                      title={String(doc.name || "")}
                      detail={formatDate(doc.created_at as string, { locale })}
                      chips={chips}
                      trailing={
                        doc.file_url ? (
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
                        )
                      }
                    />
                  );
                })}
              </TimelineCard>
            ),
        },
      ]}
    />
  );
}
