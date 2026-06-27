import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ScrollText, Sparkles } from "lucide-react";
import { getStudioClientPagesCopy } from "@henryco/i18n";
import { formatCurrency } from "@/lib/env";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { requireStudioUser } from "@/lib/studio/auth";
import { studioClientSnapshot } from "@/lib/studio/data";
import { getStudioSnapshot } from "@/lib/studio/store";
import { friendlyProposalStatus } from "@/lib/studio/project-workspace-copy";
import { PortalEmptyState } from "@/components/portal/empty-state";

type StudioClientPagesCopy = ReturnType<typeof getStudioClientPagesCopy>;

export const metadata: Metadata = {
  title: "Proposals",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_TONE: Record<string, string> = {
  draft: "var(--studio-ink-soft)",
  sent: "var(--studio-signal)",
  accepted: "#bdf2cf",
  rejected: "#ffb8b8",
  expired: "#f3d28a",
};

export default async function ClientProposalsPage() {
  const viewer = await requireStudioUser("/client/proposals");
  const snapshot = await getStudioSnapshot();
  const clientData = studioClientSnapshot(viewer, snapshot);
  const locale = await getStudioPublicLocale();
  const copy = getStudioClientPagesCopy(locale);

  if (clientData.proposals.length === 0) {
    return (
      <div className="space-y-6">
        <Header copy={copy} />
        <PortalEmptyState
          icon={Sparkles}
          title={copy.proposals.emptyTitle}
          body={copy.proposals.emptyBody}
          action={
            <Link href="/request" className="portal-button portal-button-primary">
              {copy.proposals.submitBrief}
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      </div>
    );
  }

  // Sort: open proposals first (sent/draft), then accepted, then archive
  const ordered = [...clientData.proposals].sort((a, b) => {
    const order = (s: string) =>
      s === "sent" ? 0 : s === "draft" ? 1 : s === "accepted" ? 2 : 3;
    return order(a.status) - order(b.status);
  });

  // Server component — Date.now() is request-deterministic for this render.
  // Captured once and passed down so the row closure stays pure
  // (react-hooks/purity).
  // eslint-disable-next-line react-hooks/purity
  const renderedAt = Date.now();

  return (
    <div className="space-y-7">
      <Header copy={copy} />

      {/* TODO(wave1): multi-row proposal list. proposal.title /
          proposal.summary are Supabase-row text fields — translate each via
          Promise.all + resolveLocalizedDynamicField in a follow-up wave.
          The single-row detail page at /proposals/[proposalId] is already
          wrapped through the cached DeepL pipeline. */}
      <section className="grid gap-3 sm:grid-cols-2">
        {ordered.map((proposal) => {
          const tone = STATUS_TONE[proposal.status] ?? "var(--studio-ink-soft)";
          const expired = proposal.validUntil
            ? Date.parse(proposal.validUntil) < renderedAt
            : false;
          return (
            <article
              key={proposal.id}
              className="portal-card flex flex-col gap-4 px-5 py-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em]" style={{ color: tone }}>
                    <ScrollText className="mr-1.5 inline h-3 w-3 -translate-y-px" />
                    {friendlyProposalStatus(proposal.status)}
                  </div>
                  <h2 className="mt-1.5 truncate text-[15px] font-semibold tracking-[-0.005em] text-[var(--studio-ink)]">
                    {proposal.title}
                  </h2>
                </div>
              </div>

              {proposal.summary ? (
                <p className="line-clamp-3 text-[12.5px] leading-5 text-[var(--studio-ink-soft)]">
                  {proposal.summary}
                </p>
              ) : null}

              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                    {copy.proposals.investment}
                  </div>
                  <div className="mt-0.5 text-[18px] font-semibold tracking-[-0.005em] text-[var(--studio-ink)]">
                    {formatCurrency(proposal.investment, proposal.currency)}
                  </div>
                </div>
                {proposal.validUntil ? (
                  <div className="text-right">
                    <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                      {expired ? copy.proposals.expired : copy.proposals.validUntil}
                    </div>
                    <div className="mt-0.5 text-[12.5px] tabular-nums text-[var(--studio-ink-soft)]">
                      {new Date(proposal.validUntil).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              <Link
                href={`/proposals/${proposal.id}?access=${proposal.accessKey}`}
                className="portal-button portal-button-secondary self-start"
              >
                {copy.proposals.openProposal}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function Header({ copy }: { copy: StudioClientPagesCopy }) {
  return (
    <header>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
        {copy.proposals.kicker}
      </div>
      <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)] sm:text-3xl">
        {copy.proposals.title}
      </h1>
      <p className="mt-2 max-w-2xl text-[13.5px] leading-6 text-[var(--studio-ink-soft)]">
        {copy.proposals.body}
      </p>
    </header>
  );
}
