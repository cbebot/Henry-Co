import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolveLocalizedDynamicField } from "@henryco/i18n/server";
import { requireStudioUser } from "@/lib/studio/auth";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { fetchThreadInitialState } from "@/lib/messaging/queries";
import { ProjectThread } from "@/components/messaging";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteParams = { projectId: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { projectId } = await params;
  const initial = await fetchThreadInitialState(projectId).catch(() => null);
  if (!initial) {
    return { title: "Project conversation · Henry Onyx Studio" };
  }
  // WAVE1 — wrap the Supabase-row-derived project title so the document
  // title / description render in the viewer's locale via the cached DeepL
  // pipeline. The fallback keeps the source-language title visible if the
  // translation fails.
  const locale = await getStudioPublicLocale();
  const localizedProjectTitle = await resolveLocalizedDynamicField({
    record: initial.context as unknown as Record<string, unknown>,
    field: "projectTitle",
    locale,
    fallback: initial.context.projectTitle ?? "",
    machineTranslate: locale !== "en",
  });
  return {
    title: `${localizedProjectTitle} · Messages · Henry Onyx Studio`,
    description: `Conversation with the Henry Onyx Studio team for ${localizedProjectTitle}.`,
    robots: { index: false, follow: false },
  };
}

/**
 * Surface 1 — the project thread.
 *
 * Server-renders the first 30 messages plus the right-rail context
 * panel data, then mounts the client-side ProjectThread orchestrator
 * which subscribes to Realtime, manages typing presence, the offline
 * queue, scroll behaviour, search, and replies.
 *
 * STUDIO-CP-01 will eventually wrap this route in the portal shell
 * (sidebar, breadcrumbs, tabs). For now this route renders standalone
 * so the messaging system can ship on its own merits.
 */
export default async function ProjectMessagesPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { projectId } = await params;
  await requireStudioUser(`/client/projects/${projectId}/messages`);

  const initial = await fetchThreadInitialState(projectId);
  if (!initial) {
    notFound();
  }

  return (
    <main
      id="henryco-main"
      className="flex h-[100svh] min-h-0 w-full flex-col bg-[var(--studio-bg)]"
    >
      <ProjectThread initial={initial} />
    </main>
  );
}
