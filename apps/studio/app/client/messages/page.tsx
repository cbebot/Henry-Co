import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireStudioUser } from "@/lib/studio/auth";
import {
  fetchProjectThreadSummaries,
  fetchThreadInitialState,
} from "@/lib/messaging/queries";
import { MessagesCentre } from "@/components/messaging";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Messages · HenryCo Studio",
  description:
    "Every project conversation with the HenryCo Studio team in one place.",
  robots: { index: false, follow: false },
};

/**
 * Surface 2 — the unified messages centre.
 *
 * If the viewer has only one project, redirects directly to that
 * project's thread (a centre with one item is just noise). With
 * multiple projects, renders the two-column inbox view and pre-loads
 * the most-recent thread so the right column is populated on first
 * paint.
 */
export default async function MessagesCentrePage() {
  await requireStudioUser("/client/messages");

  const summaries = await fetchProjectThreadSummaries();

  if (summaries.length === 1) {
    redirect(`/client/projects/${summaries[0].projectId}/messages`);
  }

  const focused = pickFocusedProject(summaries);
  const initialThread = focused
    ? await fetchThreadInitialState(focused.projectId).catch(() => null)
    : null;

  return (
    <main
      id="henryco-main"
      className="flex h-[100svh] min-h-0 w-full flex-col bg-[#050816]"
    >
      <MessagesCentre
        summaries={summaries}
        initialThread={initialThread}
        hrefTemplate="/client/projects/{projectId}/messages"
      />
    </main>
  );
}

function pickFocusedProject(
  summaries: Awaited<ReturnType<typeof fetchProjectThreadSummaries>>,
) {
  // Pick the project with unread messages first; otherwise the most
  // recently updated. Ensures the right column shows useful content.
  const withUnread = summaries.find((s) => s.unreadCount > 0);
  if (withUnread) return withUnread;
  const sorted = [...summaries].sort((a, b) => {
    const aTime = a.lastMessage
      ? new Date(a.lastMessage.createdAt).getTime()
      : 0;
    const bTime = b.lastMessage
      ? new Date(b.lastMessage.createdAt).getTime()
      : 0;
    return bTime - aTime;
  });
  return sorted[0] || null;
}
