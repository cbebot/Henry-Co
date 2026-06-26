import Link from "next/link";
import { notFound } from "next/navigation";
import { translateSurfaceLabel } from "@henryco/i18n";
import type { ThreadMessage } from "@henryco/messaging-thread";
import { requireJobsUser } from "@/lib/auth";
import {
  getApplicationById,
  getConversationById,
  getConversationRouteRef,
  getMessages,
  getPipelineById,
  markMessagesRead,
} from "@/lib/jobs/hiring";
import { getJobPostBySlug } from "@/lib/jobs/data";
import { candidateNav } from "@/lib/jobs/navigation";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";
import { JobsMessageThread } from "@/components/messaging/JobsMessageThread";
import { mapJobsRow } from "@/components/messaging/jobs-thread-adapter";

export const dynamic = "force-dynamic";

export default async function CandidateConversationDetailPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  // Conversation lookup keys only on the id, so it can race the viewer +
  // locale resolution.
  const [viewer, locale, conversation, routeRef] = await Promise.all([
    requireJobsUser(`/candidate/conversations/${conversationId}`),
    getJobsPublicLocale(),
    getConversationById(conversationId),
    getConversationRouteRef(conversationId),
  ]);
  if (!conversation) return notFound();

  const t = (text: string) => translateSurfaceLabel(locale, text);
  const viewerId = viewer.user!.id;

  // Per-conversation authorization (symmetric with the employer deep-link
  // resolver). The viewer must be THIS conversation's candidate — otherwise any
  // authenticated jobs user could read another candidate's thread (subject,
  // counterpart name, message bodies) by guessing the conversation id. A
  // mismatch / unresolved ref 404s: no existence or identity signal leaks.
  if (!routeRef || routeRef.candidateId !== viewerId) return notFound();

  const [messages, application] = await Promise.all([
    getMessages(conversationId),
    // No locale — we only read pipelineId/candidateName here, so we skip the
    // cover-note machine translation that passing a locale would trigger.
    getApplicationById(conversation.applicationId),
  ]);

  // Auto-mark messages as read for this candidate.
  await markMessagesRead(conversationId, viewerId);

  // Resolve the counterpart the candidate legitimately sees: the employer /
  // company display name for this hiring conversation. Jobs is NOT identity-
  // minimized, so this is a real name (conversation -> application -> pipeline
  // -> job post `employerName`). Falls back to a generic localized label at any
  // broken link in the chain.
  const pipeline = application
    ? await getPipelineById(application.pipelineId)
    : null;
  const job = pipeline?.jobSlug
    ? await getJobPostBySlug(pipeline.jobSlug, { locale })
    : null;
  const employerLabel = job?.employerName?.trim() || t("Employer");

  // The candidate's own name. Used only for own bubbles, which the engine
  // renders as the literal "You" regardless — so this is a safe fallback.
  const candidateName =
    viewer.user?.fullName?.trim() ||
    application?.candidateName?.trim() ||
    t("You");

  // Build the engine's initial bubble list from the loaded (already display-
  // masked) domain messages. `mapJobsRow` re-masks idempotently and drops any
  // unknown row shape.
  const initialMessages: ThreadMessage[] = messages
    .map((m) =>
      mapJobsRow(
        {
          id: m.id,
          conversation_id: m.conversationId,
          sender_id: m.senderId,
          sender_type: m.senderType,
          body: m.body,
          created_at: m.createdAt,
        },
        viewerId,
        { candidateLabel: candidateName, employerLabel },
      ),
    )
    .filter((x): x is ThreadMessage => x !== null);

  const messageCountLabel = `${messages.length} ${
    messages.length === 1
      ? t("message in this thread.")
      : t("messages in this thread.")
  }`;

  return (
    <WorkspaceShell
      area="candidate"
      title={t("Conversation")}
      subtitle={conversation.subject || t("Hiring conversation thread")}
      nav={candidateNav}
      activeHref="/candidate/conversations"
      accent="linear-gradient(135deg,#0d5e66 0%,#0e7c86 55%,#7fd0d4 100%)"
    >
      <SectionCard
        title={conversation.subject || t("Messages")}
        body={messageCountLabel}
        actions={
          <Link
            href="/candidate/conversations"
            className="text-sm font-semibold text-[var(--jobs-accent)]"
          >
            {t("All conversations")}
          </Link>
        }
      >
        <JobsMessageThread
          conversationId={conversationId}
          initialMessages={initialMessages}
          viewer={{ userId: viewerId, fullName: candidateName }}
          candidateLabel={candidateName}
          employerLabel={employerLabel}
        />
      </SectionCard>
    </WorkspaceShell>
  );
}
