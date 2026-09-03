import { notFound, redirect } from "next/navigation";
import { requireJobsRoles, viewerHasRole } from "@/lib/auth";
import { getApplicationById, getConversationRouteRef } from "@/lib/jobs/hiring";

export const dynamic = "force-dynamic";

/**
 * Employer deep-link resolver for The Onyx Line (WS-5).
 *
 * The unified inbox (account.henryonyx.com/messages) only knows a conversation
 * id, but the canonical employer hiring thread lives at the application-keyed
 * `/employer/hiring/[pipelineId]/[applicationId]`. This route resolves the
 * conversation -> its pipeline + application, AUTHORIZES that the viewer is the
 * employer party of THIS conversation (or platform staff), then forwards to the
 * single source-of-truth thread. There is deliberately NO thread UI here — only
 * routing — so the nested hiring page stays the only renderer and there is no
 * duplicate (drift-prone) surface to keep contact-safe.
 *
 * Security posture (no open redirect, no info leak):
 *   - Role gate first (`requireJobsRoles`): an unauthenticated visitor is sent
 *     to login; a non-employer is sent to "/" — identical to every other
 *     `/employer/*` route.
 *   - Per-conversation gate: the viewer must be the conversation's employer user
 *     (`employer_id === viewer.user.id`) or admin/owner. This mirrors exactly
 *     how the unified inbox surfaced the thread to the employer in the first
 *     place (it filters jobs_conversations on `employer_id.eq.userId`). Any
 *     mismatch is a `notFound()` — a 404 leaks no existence/identity signal.
 *   - The redirect target is computed solely from server-resolved data (the
 *     conversation's own pipeline/application ids), never from caller-supplied
 *     input beyond the conversation id, so it cannot be steered to an arbitrary
 *     location. The destination page re-runs its own role gate as defence in
 *     depth.
 *   - Resolve-or-404: if the conversation / application / pipeline can't be
 *     resolved, `notFound()` rather than forwarding to a broken thread.
 *
 * This route renders no user-facing copy (it only `redirect()`s or
 * `notFound()`s), so there is nothing to localize; the 404 surface is the
 * app's shared, already-localized not-found page.
 */
export default async function EmployerConversationDeepLinkPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  const viewer = await requireJobsRoles(
    ["employer", "admin", "owner"],
    `/employer/conversations/${conversationId}`
  );

  const ref = await getConversationRouteRef(conversationId);
  if (!ref) return notFound();

  // Per-conversation authorization. The viewer must be the employer party of
  // THIS specific conversation, or platform staff. Anything else 404s — no
  // info leak, no open redirect into another employer's thread.
  const isStaff = viewerHasRole(viewer, ["admin", "owner"]);
  const isEmployerParty =
    !!ref.employerId && !!viewer.user && ref.employerId === viewer.user.id;
  if (!isStaff && !isEmployerParty) return notFound();

  // Resolve the canonical nested-thread coordinates. Prefer the conversation's
  // own pipeline_id; fall back to the application's pipeline when absent.
  const applicationId = ref.applicationId;
  if (!applicationId) return notFound();

  let pipelineId = ref.pipelineId;
  if (!pipelineId) {
    const application = await getApplicationById(applicationId);
    pipelineId = application?.pipelineId || null;
  }
  if (!pipelineId) return notFound();

  redirect(`/employer/hiring/${pipelineId}/${applicationId}`);
}
