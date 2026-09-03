import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StudioRequestHub } from "@/components/studio/request-hub";

export const metadata: Metadata = {
  title: "Studio brief — Tell us what you need | Henry Onyx Studio",
  description:
    "Start a Henry Onyx Studio brief three ways: talk it through, answer a few questions, or build it yourself. Every path ends in the same brief with honest pricing.",
  alternates: { canonical: "/request" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Studio brief | Henry Onyx Studio",
    description:
      "Tell us what you need. We turn it into a clear plan with real pricing, deposits, and a delivery record.",
    type: "website",
    url: "/request",
  },
  twitter: {
    card: "summary_large_image",
    title: "Studio brief | Henry Onyx Studio",
    description:
      "A calm front door for serious projects — three ways in, one honest brief.",
  },
};

export default async function RequestPage({
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

  // A paymentId here means a pay deep-link landed on the brief surface
  // (stale/rerouted email or share). /pay is the canonical payment surface
  // and /request is the canonical brief surface — disjoint flows, single
  // intent per route — so short-circuit to the pay flow.
  if (params.paymentId) {
    redirect(`/pay/${params.paymentId}`);
  }

  // Pre-built templates live in the /pick gallery (the canonical gallery +
  // checkout). Keep old ?path=templates links working.
  if (params.path === "templates") {
    redirect("/pick");
  }

  // The conversational lane now has its own surface; keep old ?path=copilot
  // deep-links working.
  if (params.path === "copilot") {
    redirect("/request/copilot");
  }

  // An explicit build lane (custom/package) or any preset/template/team hint
  // means the user already declared intent upstream — forward straight to the
  // builder, preserving the params so the deep-link still lands pre-filled.
  // Bare /request falls through to the calm three-on-ramp hub.
  const forwardParams = new URLSearchParams();
  if (params.path === "custom" || params.path === "package") {
    forwardParams.set("path", params.path);
  }
  if (params.template) forwardParams.set("template", params.template);
  if (params.preset) forwardParams.set("preset", params.preset);
  if (params.team) forwardParams.set("team", params.team);

  const shouldForwardToBuild =
    params.path === "custom" ||
    params.path === "package" ||
    Boolean(params.template || params.preset || params.team);

  if (shouldForwardToBuild) {
    const query = forwardParams.toString();
    redirect(query ? `/request/build?${query}` : "/request/build");
  }

  return (
    <main
      id="henryco-main"
      tabIndex={-1}
      className="mx-auto max-w-[88rem] px-5 pb-20 pt-8 sm:px-8 sm:pt-10 lg:px-10"
    >
      <StudioRequestHub />
    </main>
  );
}
