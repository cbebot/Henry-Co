import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StudioRequestBuilder } from "@/components/studio/request-builder";
import { getStudioCatalog } from "@/lib/studio/catalog";
import {
  resolveStudioRequestPreset,
  resolveStudioTemplatePreset,
} from "@/lib/studio/request-presets";

// The brief submit (submitStudioBriefAction) re-prices server-side and the
// brief draft path can touch the Anthropic-backed enrichment on cold start;
// match /request's 60s ceiling so a prompt-cache miss never trips Vercel's
// default function timeout mid-flight.
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Build your brief — Henry Onyx Studio",
  description:
    "Step through the Henry Onyx Studio brief builder: choose a package or custom path, pick the capabilities you need, and see honest pricing before you submit.",
  alternates: { canonical: "/request/build" },
  robots: { index: true, follow: true },
};

export default async function RequestBuildPage({
  searchParams,
}: {
  searchParams: Promise<{
    team?: string;
    preset?: string;
    template?: string;
    path?: string;
    paymentId?: string;
  }>;
}) {
  const params = await searchParams;

  // A stray paymentId means a pay deep-link landed on the composer — send it
  // to the canonical pay surface rather than a brief the user doesn't need.
  if (params.paymentId) {
    redirect(`/pay/${params.paymentId}`);
  }

  // Pre-built templates live in the /pick gallery; keep old ?path=templates
  // links working by redirecting there instead of into the builder.
  if (params.path === "templates") {
    redirect("/pick");
  }

  const catalog = await getStudioCatalog();
  const templateHint = resolveStudioTemplatePreset(params.template, catalog.requestConfig);
  const presetHint =
    templateHint ?? resolveStudioRequestPreset(params.preset, catalog.requestConfig);

  // Lane resolution: an explicit ?path=package|custom wins; otherwise a
  // template/preset hint carries its own lane; otherwise the builder's
  // default ("custom").
  const explicitPathway =
    params.path === "package" || params.path === "custom" ? params.path : null;
  const resolvedPathway = explicitPathway ?? presetHint?.pathway ?? "custom";

  // Skip the Path step only when the custom lane was chosen upstream — the
  // package lane needs step 0 so the buyer can actually pick a package.
  const pathChosenUpstream = Boolean(explicitPathway || presetHint);
  const initialStepIndex = pathChosenUpstream && resolvedPathway === "custom" ? 1 : 0;

  return (
    <main
      id="henryco-main"
      tabIndex={-1}
      className="mx-auto max-w-[88rem] px-5 pb-20 pt-8 sm:px-8 sm:pt-10 lg:px-10"
    >
      <StudioRequestBuilder
        services={catalog.services}
        packages={catalog.packages}
        teams={catalog.teams}
        requestConfig={catalog.requestConfig}
        preferredTeamId={params.team || null}
        presetHint={presetHint}
        initialStepIndex={initialStepIndex}
        initialPathway={resolvedPathway}
      />
    </main>
  );
}
