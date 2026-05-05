import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireStudioUser } from "@/lib/studio/auth";
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
    return { title: "Project conversation · HenryCo Studio" };
  }
  return {
    title: `${initial.context.projectTitle} · Messages · HenryCo Studio`,
    description: `Conversation with the HenryCo Studio team for ${initial.context.projectTitle}.`,
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
      className="flex h-[100svh] min-h-0 w-full flex-col bg-[#050816]"
    >
      <ProjectThread initial={initial} />
    </main>
  );
}
