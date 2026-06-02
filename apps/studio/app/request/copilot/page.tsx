import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CopilotChat } from "@/components/studio/copilot-chat/copilot-chat";
import { getStudioCatalog } from "@/lib/studio/catalog";

// Each turn can touch the Anthropic-backed chat model and finish touches the
// brief enrichment before routing to the builder; match the hub + builder
// 60s ceiling so a prompt-cache miss never trips Vercel's default timeout.
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Talk it through — Henry Onyx Studio",
  description:
    "Describe your project in your own words. The Henry Onyx Studio co-pilot asks a few questions and turns the conversation into a clear brief with honest pricing.",
  alternates: { canonical: "/request/copilot" },
  robots: { index: true, follow: true },
};

export default async function RequestCopilotPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string; paymentId?: string }>;
}) {
  const params = await searchParams;

  // A stray paymentId means a pay deep-link landed on the conversation — send
  // it to the canonical pay surface rather than a brief the user doesn't need.
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
      <CopilotChat
        services={catalog.services}
        requestConfig={catalog.requestConfig}
        preferredTeamId={params.team || null}
      />
    </main>
  );
}
