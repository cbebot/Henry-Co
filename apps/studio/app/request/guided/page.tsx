import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GuidedInterview } from "@/components/studio/guided-interview/guided-interview";
import { getStudioCatalog } from "@/lib/studio/catalog";

// On finish the interview can touch the Anthropic-backed brief enrichment
// (generateStudioBriefDraftAction) before routing to the builder; match the
// hub + builder 60s ceiling so a prompt-cache miss never trips Vercel's
// default function timeout mid-handoff.
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Answer a few questions — Henry & Co. Studio",
  description:
    "Shape your Henry & Co. Studio brief by answering a few quick questions. We turn your choices into a clear plan with honest pricing before you commit.",
  alternates: { canonical: "/request/guided" },
  robots: { index: true, follow: true },
};

export default async function RequestGuidedPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string; paymentId?: string }>;
}) {
  const params = await searchParams;

  // A stray paymentId means a pay deep-link landed on the interview — send it
  // to the canonical pay surface rather than a brief the user doesn't need.
  if (params.paymentId) {
    redirect(`/pay/${params.paymentId}`);
  }

  const catalog = await getStudioCatalog();

  return (
    <main
      id="henryco-main"
      tabIndex={-1}
      className="mx-auto max-w-[88rem] px-5 pb-20 pt-8 sm:px-8 sm:pt-10 lg:px-10"
    >
      <GuidedInterview
        services={catalog.services}
        requestConfig={catalog.requestConfig}
        preferredTeamId={params.team || null}
      />
    </main>
  );
}
