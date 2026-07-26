import "server-only";

/**
 * SA-2 — agency build-stage client comms + owner escalation email. Reuses the
 * shipped studio email path (Postmark-only, studio_notifications-ledgered) and
 * the project-thread messaging table.
 *
 * Per the ratified SA-D1 carve-out (OWNER-DECISIONS 2026-07-18): these
 * TEMPLATED stage notifications — build_started, preview_ready, site_live,
 * changes_received — are the purchased service's own progress reporting and go
 * out WITHOUT a tap. AI-authored free text (none in SA-2) stays one-tap.
 */

import { createAdminSupabase, hasAdminSupabaseEnv } from "@/lib/supabase";
import {
  getStudioOwnerRecipients,
  renderAndSendStudioEmail,
  studioEmailBaseUrl,
} from "@/lib/studio/email/send";

type ProjectRecipient = { normalizedEmail: string | null; title: string; accessKey: string; id: string };

/**
 * Post a system-authored thread message for a build stage (message_type
 * 'system' / 'milestone_update' / 'approval_request'). The DB already seeds a
 * system welcome message on project creation — this is the same precedent,
 * driven by the orchestrator.
 */
export async function postBuildSystemMessage(input: {
  projectId: string;
  body: string;
  messageType?: "system" | "milestone_update" | "approval_request";
}): Promise<void> {
  if (!hasAdminSupabaseEnv()) return;
  try {
    const admin = createAdminSupabase();
    await admin.from("studio_project_messages").insert({
      project_id: input.projectId,
      sender: "Henry Onyx Studio",
      sender_role: "system",
      body: input.body,
      is_internal: false,
      message_type: input.messageType ?? "system",
    } as never);
  } catch {
    // thread message best-effort — the email + event trail carry the signal.
  }
}

/** build_started — templated, no tap. */
export async function sendBuildStarted(project: ProjectRecipient): Promise<void> {
  await renderAndSendStudioEmail({
    to: project.normalizedEmail,
    entityId: project.id,
    templateKey: "build_started",
    layout: {
      subject: `We've started building • ${project.title}`,
      eyebrow: "Build started",
      title: "Your site is now being built.",
      intro:
        "Our build process has started on your project. You'll hear from us again the moment a preview is ready to review — usually within a short window, not days of silence.",
      actionLabel: "Open your project",
      actionHref: `${studioEmailBaseUrl()}/project/${project.id}?access=${project.accessKey}`,
    },
  });
  await postBuildSystemMessage({
    projectId: project.id,
    body: "We've started building your site. You'll get a preview to review shortly.",
    messageType: "milestone_update",
  });
}

/** preview_ready — templated, no tap. Includes an approval_request thread ask. */
export async function sendPreviewReady(project: ProjectRecipient, previewUrl: string): Promise<void> {
  await renderAndSendStudioEmail({
    to: project.normalizedEmail,
    entityId: project.id,
    templateKey: "preview_ready",
    layout: {
      subject: `Your preview is ready • ${project.title}`,
      eyebrow: "Preview ready",
      title: "Your site preview is ready to review.",
      intro:
        "A preview of your site is ready. Open it from your project workspace to review, then approve it or ask for changes — nothing goes live until you're happy.",
      actionLabel: "Review your preview",
      actionHref: `${studioEmailBaseUrl()}/project/${project.id}?access=${project.accessKey}`,
    },
  });
  // The client reaches the preview through their authenticated portal session
  // (the email links to the workspace, never a raw preview URL). The exact
  // token-gated preview path rides the thread ask for the staffer's reference.
  await postBuildSystemMessage({
    projectId: project.id,
    body: `Your site preview is ready to review (${previewUrl}). Approve it or request changes when you're ready.`,
    messageType: "approval_request",
  });
}

/** changes_received — templated, no tap. */
export async function sendChangesReceived(project: ProjectRecipient): Promise<void> {
  await renderAndSendStudioEmail({
    to: project.normalizedEmail,
    entityId: project.id,
    templateKey: "changes_received",
    layout: {
      subject: `We're on it • ${project.title}`,
      eyebrow: "Changes received",
      title: "We've noted your changes.",
      intro:
        "Thanks — we've received your requested changes and started another pass. You'll get a fresh preview to review shortly.",
      actionLabel: "Open your project",
      actionHref: `${studioEmailBaseUrl()}/project/${project.id}?access=${project.accessKey}`,
    },
  });
  await postBuildSystemMessage({
    projectId: project.id,
    body: "We've received your changes and started another pass.",
    messageType: "milestone_update",
  });
}

/** site_live — templated, no tap. */
export async function sendSiteLive(project: ProjectRecipient, liveUrl: string): Promise<void> {
  await renderAndSendStudioEmail({
    to: project.normalizedEmail,
    entityId: project.id,
    templateKey: "site_live",
    layout: {
      subject: `Your site is live • ${project.title}`,
      eyebrow: "Site live",
      title: "Your site is live.",
      intro:
        "Your site is now live. We'll check in shortly to make sure everything is working the way you expect.",
      highlightLabel: "Live address",
      highlightValue: liveUrl,
      actionLabel: "View your site",
      actionHref: liveUrl,
    },
  });
  await postBuildSystemMessage({
    projectId: project.id,
    body: "Your site is now live.",
    messageType: "milestone_update",
  });
}

/**
 * review_reminder — SA-3 client-silence reminder (templated, no tap). The
 * client's preview is waiting; we nudge, we never auto-advance. Fixed copy,
 * tone-gated, i18n Pattern A.
 */
export async function sendReviewReminder(project: ProjectRecipient): Promise<void> {
  await renderAndSendStudioEmail({
    to: project.normalizedEmail,
    entityId: project.id,
    templateKey: "review_reminder",
    layout: {
      subject: `Your preview is waiting • ${project.title}`,
      eyebrow: "Preview waiting",
      title: "Your site preview is still waiting for you.",
      intro:
        "A preview of your site is ready and waiting in your project workspace. Take a look when you can, then approve it or ask for changes — nothing goes live until you're happy.",
      actionLabel: "Review your preview",
      actionHref: `${studioEmailBaseUrl()}/client/projects/${project.id}?tab=approvals`,
    },
  });
  await postBuildSystemMessage({
    projectId: project.id,
    body: "A quick reminder — your site preview is ready to review whenever you are.",
    messageType: "system",
  });
}

/**
 * aftercare_checkin — SA-3 day-3 post-launch check-in (templated, no tap).
 */
export async function sendAftercareCheckin(project: ProjectRecipient, liveUrl: string): Promise<void> {
  await renderAndSendStudioEmail({
    to: project.normalizedEmail,
    entityId: project.id,
    templateKey: "aftercare_checkin",
    layout: {
      subject: `Checking in on your site • ${project.title}`,
      eyebrow: "Post-launch check-in",
      title: "How is everything looking?",
      intro:
        "Your site has been live for a few days. We wanted to check in — if anything needs adjusting, just reply in your workspace and we'll take care of it within your warranty window.",
      highlightLabel: "Live address",
      highlightValue: liveUrl,
      actionLabel: "Open your project",
      actionHref: `${studioEmailBaseUrl()}/client/projects/${project.id}`,
    },
  });
  await postBuildSystemMessage({
    projectId: project.id,
    body: "Checking in now that your site has been live for a few days — reply here if anything needs a tweak.",
    messageType: "milestone_update",
  });
}

/**
 * Owner escalation email (ARCHITECTURE §3.3 fallback). Not client-facing;
 * rings the owner's inbox with the exact cause of a stall/breach.
 */
export async function sendAgencyOwnerAlert(input: {
  jobId: string;
  reason: string;
  title: string;
  body: string;
}): Promise<void> {
  const owners = await getStudioOwnerRecipients();
  for (const owner of owners) {
    await renderAndSendStudioEmail({
      to: owner,
      entityId: input.jobId,
      templateKey: "agency_owner_alert",
      layout: {
        subject: `Build agent needs you • ${input.title}`,
        eyebrow: "Build agent",
        title: input.title,
        intro: input.body,
        sections: [
          { label: "Job", value: input.jobId.slice(0, 8) },
          { label: "Reason", value: input.reason.replaceAll("_", " ") },
        ],
        actionLabel: "Open the agency console",
        actionHref: `${studioEmailBaseUrl()}/owner/agency`,
      },
    });
  }
}
