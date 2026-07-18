import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ScrollText, Sparkles } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { formatCurrency } from "@/lib/env";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { requireStudioUser } from "@/lib/studio/auth";
import { studioClientSnapshot } from "@/lib/studio/data";
import { getStudioSnapshot } from "@/lib/studio/store";
import { friendlyProposalStatus } from "@/lib/studio/project-workspace-copy";
import { PortalEmptyState } from "@/components/portal/empty-state";

export const metadata: Metadata = {
  title: "Proposals",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_TONE: Record<string, string> = {
  draft: "var(--studio-ink-soft)",
  in_review: "var(--studio-signal)",
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
  const t = (text: string) => translateSurfaceLabel(locale, text);

  if (clientData.proposals.length === 0) {
    return (
      <div className="space-y-6">
        <Header />
        <PortalEmptyState
          icon={Sparkles}
          title="No proposals on your account yet"
          body="Once a brief is reviewed, the Studio team sends a proposal with scope, pricing, and milestone logic — it lives here so you can revisit it any time."
          action={
            <Link href="/request" className="portal-button portal-button-primary">
              Submit a brief
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      </div>
    );
  }

  // Sort: live proposals first (sent), then in-review holds, then drafts,
  // then accepted, then archive.
  const ordered = [...clientData.proposals].sort((a, b) => {
    const order = (s: string) =>
      s === "sent" ? 0 : s === "in_review" ? 1 : s === "draft" ? 2 : s === "accepted" ? 3 : 4;
    return order(a.status) - order(b.status);
  });

  // Server component — Date.now() is request-deterministic for this render.
  // Captured once and passed down so the row closure stays pure
  // (react-hooks/purity).
  // eslint-disable-next-line react-hooks/purity
  const renderedAt = Date.now();

  return (
    <div className="space-y-7">
      <Header />

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
                  {/* SA-D5: a held proposal shows no committed figure — the
                    price lands only after the team's one-tap release. */}
                  {proposal.status === "in_review" ? (
                    <>
                      <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                        {t("Pricing")}
                      </div>
                      <div className="mt-0.5 text-[13px] leading-6 text-[var(--studio-ink-soft)]">
                        {t("Arrives with the reviewed proposal — usually within one business day.")}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                        Investment
                      </div>
                      <div className="mt-0.5 text-[18px] font-semibold tracking-[-0.005em] text-[var(--studio-ink)]">
                        {formatCurrency(proposal.investment, proposal.currency)}
                      </div>
                    </>
                  )}
                </div>
                {proposal.validUntil ? (
                  <div className="text-right">
                    <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                      {expired ? "Expired" : "Valid until"}
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
                Open proposal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function Header() {
  return (
    <header>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
        Scope · pricing · milestones
      </div>
      <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)] sm:text-3xl">
        Proposals
      </h1>
      <p className="mt-2 max-w-2xl text-[13.5px] leading-6 text-[var(--studio-ink-soft)]">
        Every Studio proposal tied to your account. Open one to revisit the
        scope, milestone breakdown, and the deposit-or-template path.
      </p>
    </header>
  );
}
