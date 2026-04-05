import "server-only";

import { getAccountUrl, getDivisionConfig } from "@henryco/config";
import {
  extractEmailAddress,
  formatCurrency,
  getOptionalEnv,
  sanitizeHeaderValue,
} from "@/lib/env";
import { createAdminSupabase } from "@/lib/supabase";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { upsertStudioRecord } from "@/lib/studio/store";
import { sendStudioWhatsAppText } from "@/lib/studio/whatsapp";
import type {
  StudioLead,
  StudioNotification,
  StudioPayment,
  StudioProject,
  StudioProjectMilestone,
  StudioProjectUpdate,
  StudioProposal,
  StudioRevision,
} from "@/lib/studio/types";

const studio = getDivisionConfig("studio");

type EmailSection = {
  label: string;
  value: string;
};

type EmailLayout = {
  subject: string;
  eyebrow: string;
  title: string;
  intro: string;
  highlightLabel?: string | null;
  highlightValue?: string | null;
  sections?: EmailSection[];
  bullets?: string[];
  actionLabel?: string | null;
  actionHref?: string | null;
};

function baseUrl() {
  const domain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com";
  return process.env.NODE_ENV === "production" ? `https://studio.${domain}` : "http://localhost:3000";
}

async function getPaymentSettings() {
  const catalog = await getStudioCatalog({ includeUnpublished: true });
  return catalog.platform;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderEmail(layout: EmailLayout) {
  const sections = (layout.sections ?? [])
    .map(
      (section) => `
        <tr>
          <td style="padding:0 0 10px 0;">
            <div style="font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#6a7a88; font-weight:700;">${escapeHtml(section.label)}</div>
            <div style="margin-top:6px; font-size:15px; line-height:1.7; color:#11212f;">${escapeHtml(section.value)}</div>
          </td>
        </tr>
      `
    )
    .join("");

  const bullets = (layout.bullets ?? [])
    .map((item) => `<li style="margin:0 0 10px 0; line-height:1.7; color:#1b2b38;">${escapeHtml(item)}</li>`)
    .join("");

  const action =
    layout.actionLabel && layout.actionHref
      ? `
        <a href="${escapeHtml(layout.actionHref)}" style="display:inline-block; margin-top:24px; padding:14px 22px; border-radius:999px; background:#49c0c5; color:#021014; text-decoration:none; font-weight:800; font-size:14px;">
          ${escapeHtml(layout.actionLabel)}
        </a>
      `
      : "";

  return `
    <!doctype html>
    <html lang="en">
      <body style="margin:0; padding:0; background:#eef5f7; font-family:Inter,Segoe UI,Arial,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; border-radius:28px; overflow:hidden; background:#ffffff; box-shadow:0 24px 80px rgba(8,18,25,0.12);">
                <tr>
                  <td style="padding:32px; background:linear-gradient(145deg, #07131a 0%, #103040 56%, #16586f 100%); color:#ffffff;">
                    <div style="font-size:12px; letter-spacing:0.22em; text-transform:uppercase; color:#92f1f0; font-weight:700;">${escapeHtml(layout.eyebrow)}</div>
                    <div style="margin-top:14px; font-size:34px; line-height:1.06; font-weight:800; letter-spacing:-0.04em;">${escapeHtml(layout.title)}</div>
                    <div style="margin-top:14px; max-width:520px; font-size:15px; line-height:1.8; color:rgba(255,255,255,0.78);">${escapeHtml(layout.intro)}</div>
                    ${
                      layout.highlightLabel && layout.highlightValue
                        ? `<div style="margin-top:20px; display:inline-block; border-radius:22px; border:1px solid rgba(210,251,252,0.18); background:rgba(255,255,255,0.06); padding:14px 18px;">
                            <div style="font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:#d3fbfc; font-weight:700;">${escapeHtml(layout.highlightLabel)}</div>
                            <div style="margin-top:6px; font-size:22px; line-height:1.2; font-weight:800; color:#ffffff;">${escapeHtml(layout.highlightValue)}</div>
                          </div>`
                        : ""
                    }
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 32px 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${sections}</table>
                    ${bullets ? `<ul style="padding-left:18px; margin:20px 0 0 0;">${bullets}</ul>` : ""}
                    ${action}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

async function getOwnerRecipients() {
  const envTarget = extractEmailAddress(process.env.OWNER_ALERT_EMAIL);
  if (envTarget) return [envTarget];

  const admin = createAdminSupabase();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
  if (error) return [];

  return (data.users ?? [])
    .filter((user) => {
      const role = String(user.app_metadata?.role || user.user_metadata?.role || "").toLowerCase();
      return role === "owner";
    })
    .map((user) => extractEmailAddress(user.email))
    .filter(Boolean) as string[];
}

function fromAddress() {
  const raw = sanitizeHeaderValue(
    process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM || `${studio.name} <onboarding@resend.dev>`
  );
  const email = extractEmailAddress(raw) || "onboarding@resend.dev";
  return `${studio.name} <${email}>`;
}

async function sendEmail(input: {
  to: string | null | undefined;
  subject: string;
  html: string;
  text: string;
  entityId?: string | null;
  templateKey: string;
}) {
  const recipient = extractEmailAddress(input.to);
  if (!recipient) {
    return addStudioNotificationRecord({
      entityId: input.entityId ?? null,
      channel: "email",
      templateKey: input.templateKey,
      recipient: input.to || "missing-recipient",
      subject: input.subject,
      status: "skipped",
      reason: "Recipient email is missing.",
    });
  }

  const resendKey = getOptionalEnv("RESEND_API_KEY");
  if (!resendKey) {
    return addStudioNotificationRecord({
      entityId: input.entityId ?? null,
      channel: "email",
      templateKey: input.templateKey,
      recipient,
      subject: input.subject,
      status: "queued",
      reason: "RESEND_API_KEY is not configured for this deployment.",
    });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [recipient],
      reply_to: studio.supportEmail,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  const payload = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;

  return addStudioNotificationRecord({
    entityId: input.entityId ?? null,
    channel: "email",
    templateKey: input.templateKey,
    recipient,
    subject: input.subject,
    status: response.ok ? "sent" : "failed",
    reason: response.ok ? payload?.id ?? null : payload?.message || `Resend rejected the email with status ${response.status}.`,
  });
}

async function sendWhatsApp(input: {
  phone?: string | null;
  body: string;
  entityId?: string | null;
  templateKey: string;
  subject: string;
}) {
  const result = await sendStudioWhatsAppText({
    phone: input.phone,
    body: input.body,
  });

  return addStudioNotificationRecord({
    entityId: input.entityId ?? null,
    channel: "whatsapp",
    templateKey: input.templateKey,
    recipient: input.phone || "missing-recipient",
    subject: input.subject,
    status: result.status,
    reason: result.reason,
  });
}

function toText(layout: EmailLayout) {
  return [
    layout.eyebrow,
    layout.title,
    "",
    layout.intro,
    "",
    ...(layout.highlightLabel && layout.highlightValue
      ? [`${layout.highlightLabel}: ${layout.highlightValue}`, ""]
      : []),
    ...((layout.sections ?? []).flatMap((section) => [`${section.label}: ${section.value}`])),
    "",
    ...((layout.bullets ?? []).map((item) => `- ${item}`)),
    "",
    ...(layout.actionLabel && layout.actionHref ? [`${layout.actionLabel}: ${layout.actionHref}`] : []),
  ].join("\n");
}

function renderAndSendEmail(input: {
  to: string | null | undefined;
  entityId?: string | null;
  templateKey: string;
  layout: EmailLayout;
}) {
  const html = renderEmail(input.layout);
  const text = toText(input.layout);
  return sendEmail({
    to: input.to,
    subject: input.layout.subject,
    html,
    text,
    entityId: input.entityId,
    templateKey: input.templateKey,
  });
}

export async function addStudioNotificationRecord(record: Omit<StudioNotification, "id" | "createdAt">) {
  const notification: StudioNotification = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...record,
  };

  await upsertStudioRecord("studio_notification_append", notification, {
    email: record.channel === "email" ? record.recipient : null,
    role: "studio_owner",
  });

  return notification;
}

export async function sendInquiryNotifications(input: {
  lead: StudioLead;
  proposal: StudioProposal;
  project: StudioProject | null;
}) {
  const proposalUrl = `${baseUrl()}/proposals/${input.proposal.id}?access=${input.proposal.accessKey}`;
  const layout: EmailLayout = {
    subject: `Inquiry received • ${input.lead.customerName}`,
    eyebrow: "Inquiry received",
    title: "Your studio brief is now inside HenryCo Studio.",
    intro:
      "We captured the project requirements, generated the first proposal frame, and routed the brief into the right delivery lane.",
    highlightLabel: "Readiness score",
    highlightValue: `${input.lead.readinessScore}/100`,
    sections: [
      { label: "Service", value: input.lead.serviceKind.replaceAll("_", " ") },
      { label: "Budget lane", value: input.lead.budgetBand },
      { label: "Urgency", value: input.lead.urgency },
    ],
    bullets: [
      "A structured proposal is already attached to this request.",
      "If you uploaded references, the studio team now has them in the project vault.",
      "You can review pricing and milestones immediately from the proposal page.",
    ],
    actionLabel: "Open proposal",
    actionHref: proposalUrl,
  };

  await renderAndSendEmail({
    to: input.lead.normalizedEmail,
    entityId: input.proposal.id,
    templateKey: "inquiry_received",
    layout,
  });

  const owners = await getOwnerRecipients();
  for (const owner of owners) {
    await renderAndSendEmail({
      to: owner,
      entityId: input.lead.id,
      templateKey: "owner_alert",
      layout: {
        subject: `New studio lead • ${input.lead.customerName}`,
        eyebrow: "Owner alert",
        title: "A new high-intent studio lead just landed.",
        intro: "The lead has already been scored, matched, and converted into a proposal surface.",
        sections: [
          { label: "Client", value: input.lead.customerName },
          { label: "Service", value: input.lead.serviceKind.replaceAll("_", " ") },
          { label: "Matched team", value: input.lead.matchedTeamId || "Auto-match pending" },
        ],
        actionLabel: "Open sales dashboard",
        actionHref: `${baseUrl()}/sales`,
      },
    });
  }

  await sendWhatsApp({
    phone: input.lead.phone,
    entityId: input.lead.id,
    templateKey: "inquiry_acknowledgement",
    subject: "Studio inquiry acknowledgement",
    body: [
      `HenryCo Studio • ${input.lead.customerName}`,
      "Your project brief has been received.",
      `Proposal value: ${formatCurrency(input.proposal.investment, input.proposal.currency)}`,
      `Review here: ${proposalUrl}`,
    ].join("\n"),
  });
}

export async function sendProposalNotifications(input: {
  lead: StudioLead;
  proposal: StudioProposal;
  project: StudioProject | null;
  teamName: string;
}) {
  const proposalUrl = `${baseUrl()}/proposals/${input.proposal.id}?access=${input.proposal.accessKey}`;
  await renderAndSendEmail({
    to: input.lead.normalizedEmail,
    entityId: input.proposal.id,
    templateKey: "proposal_sent",
    layout: {
      subject: `Proposal ready • ${input.proposal.title}`,
      eyebrow: "Proposal ready",
      title: "Your scope, pricing, and milestone structure are ready.",
      intro:
        "HenryCo Studio generated the first proposal so you can review investment, team fit, and milestone logic without waiting for a shallow follow-up thread.",
      highlightLabel: "Investment",
      highlightValue: formatCurrency(input.proposal.investment, input.proposal.currency),
      sections: [
        { label: "Recommended team", value: input.teamName },
        { label: "Deposit", value: formatCurrency(input.proposal.depositAmount, input.proposal.currency) },
        { label: "Valid until", value: new Date(input.proposal.validUntil).toLocaleDateString("en-NG") },
      ],
      bullets: input.proposal.scopeBullets,
      actionLabel: "Review proposal",
      actionHref: proposalUrl,
    },
  });
}

export async function sendProjectStartedNotifications(input: {
  lead: StudioLead;
  proposal: StudioProposal;
  project: StudioProject;
  payment: StudioPayment;
}) {
  const projectUrl = `${baseUrl()}/project/${input.project.id}?access=${input.project.accessKey}`;
  await renderAndSendEmail({
    to: input.lead.normalizedEmail,
    entityId: input.project.id,
    templateKey: "project_started",
    layout: {
      subject: `Project activated • ${input.project.title}`,
      eyebrow: "Project activated",
      title: "Your HenryCo Studio workspace is now live.",
      intro:
        "The project has moved into an active delivery state. The workspace now tracks milestones, payments, files, revisions, and messages in one place.",
      highlightLabel: "Deposit checkpoint",
      highlightValue: formatCurrency(input.payment.amount, input.payment.currency),
      sections: [
        { label: "Current status", value: input.project.status.replaceAll("_", " ") },
        { label: "Next action", value: input.project.nextAction },
      ],
      actionLabel: "Open project workspace",
      actionHref: projectUrl,
    },
  });
}

export async function sendPaymentInstructionsNotifications(input: {
  lead: StudioLead;
  proposal: StudioProposal;
  project: StudioProject;
  payment: StudioPayment;
}) {
  const projectUrl = `${baseUrl()}/project/${input.project.id}?access=${input.project.accessKey}`;
  const platform = await getPaymentSettings();
  const sections: EmailSection[] = [
    { label: "Transfer amount", value: formatCurrency(input.payment.amount, input.payment.currency) },
    {
      label: "Bank",
      value: platform.paymentBankName || "Finance configuration pending",
    },
    {
      label: "Account name",
      value: platform.paymentAccountName || "Finance configuration pending",
    },
    {
      label: "Account number",
      value: platform.paymentAccountNumber || "Finance configuration pending",
    },
    {
      label: "Due date",
      value: input.payment.dueDate ? new Date(input.payment.dueDate).toLocaleDateString("en-NG") : "Immediately",
    },
  ];

  if (platform.paymentSupportEmail) {
    sections.push({ label: "Finance support", value: platform.paymentSupportEmail });
  }
  if (platform.paymentSupportWhatsApp) {
    sections.push({ label: "WhatsApp support", value: platform.paymentSupportWhatsApp });
  }

  await renderAndSendEmail({
    to: input.lead.normalizedEmail,
    entityId: input.payment.id,
    templateKey: "payment_instructions",
    layout: {
      subject: `Payment instructions • ${input.project.title}`,
      eyebrow: "Payment instructions",
      title: "Your deposit rail is ready for transfer.",
      intro:
        "Use the exact account details below, then upload proof inside the Studio workspace so finance can confirm the transfer and move the project into onboarding.",
      highlightLabel: "Amount due",
      highlightValue: formatCurrency(input.payment.amount, input.payment.currency),
      sections,
      bullets: [
        platform.paymentInstructions,
        "Copy the account number and amount exactly as shown.",
        "Upload proof in the payment section immediately after transfer.",
        "HenryCo finance confirms the payment before delivery moves into the next milestone.",
      ],
      actionLabel: "Open payment workspace",
      actionHref: projectUrl,
    },
  });

  await sendWhatsApp({
    phone: input.lead.phone,
    entityId: input.payment.id,
    templateKey: "payment_instructions",
    subject: "Payment instructions",
    body: [
      `HenryCo Studio • ${input.project.title}`,
      `Amount: ${formatCurrency(input.payment.amount, input.payment.currency)}`,
      `Bank: ${platform.paymentBankName || "Pending"}`,
      `Account: ${platform.paymentAccountName || "Pending"}`,
      `Number: ${platform.paymentAccountNumber || "Pending"}`,
      `Workspace: ${projectUrl}`,
    ].join("\n"),
  });
}

export async function sendProposalDecisionNotifications(input: {
  lead: StudioLead;
  proposal: StudioProposal;
  decision: "accepted" | "rejected";
}) {
  const proposalUrl = `${baseUrl()}/proposals/${input.proposal.id}?access=${input.proposal.accessKey}`;
  const accepted = input.decision === "accepted";

  await renderAndSendEmail({
    to: input.lead.normalizedEmail,
    entityId: input.proposal.id,
    templateKey: accepted ? "proposal_accepted" : "proposal_rejected",
    layout: {
      subject: `${accepted ? "Proposal accepted" : "Proposal update"} • ${input.proposal.title}`,
      eyebrow: accepted ? "Proposal accepted" : "Proposal update",
      title: accepted
        ? "The proposal has been accepted and is ready to move into delivery."
        : "The proposal was marked as not moving forward right now.",
      intro: accepted
        ? "HenryCo Studio has recorded acceptance against this proposal. The next step is activating or reviewing the project workspace and deposit lane."
        : "HenryCo Studio has recorded this proposal as rejected so the commercial record stays accurate. The proposal history remains available if the scope needs to reopen later.",
      highlightLabel: "Proposal status",
      highlightValue: input.proposal.status.replaceAll("_", " "),
      sections: [
        { label: "Project lane", value: input.proposal.title },
        {
          label: "Investment",
          value: formatCurrency(input.proposal.investment, input.proposal.currency),
        },
      ],
      actionLabel: accepted ? "Review proposal" : "View proposal history",
      actionHref: proposalUrl,
    },
  });
}

export async function sendDepositReceivedNotifications(input: {
  lead: StudioLead;
  proposal: StudioProposal;
  project: StudioProject;
  payment: StudioPayment;
}) {
  await renderAndSendEmail({
    to: input.lead.normalizedEmail,
    entityId: input.payment.id,
    templateKey: "deposit_received",
    layout: {
      subject: `Deposit received • ${input.project.title}`,
      eyebrow: "Deposit received",
      title: "Your deposit has been recorded.",
      intro:
        "HenryCo Studio has recorded the payment against the active project lane and updated the execution state accordingly.",
      highlightLabel: "Amount received",
      highlightValue: formatCurrency(input.payment.amount, input.payment.currency),
      sections: [
        { label: "Project", value: input.project.title },
        { label: "Workspace status", value: input.project.status.replaceAll("_", " ") },
      ],
      actionLabel: "Open project workspace",
      actionHref: `${baseUrl()}/project/${input.project.id}?access=${input.project.accessKey}`,
    },
  });
}

export async function sendMilestoneReadyNotifications(input: {
  lead: StudioLead;
  proposal: StudioProposal;
  project: StudioProject;
  milestone: StudioProjectMilestone;
}) {
  const projectUrl = `${baseUrl()}/project/${input.project.id}?access=${input.project.accessKey}`;
  await renderAndSendEmail({
    to: input.lead.normalizedEmail,
    entityId: input.project.id,
    templateKey: "milestone_ready",
    layout: {
      subject: `Milestone ready • ${input.milestone.name}`,
      eyebrow: "Milestone ready",
      title: "A milestone is ready for your review.",
      intro:
        "The current delivery checkpoint is prepared for review. Your workspace now shows the phase details, supporting files, and next-step clarity.",
      highlightLabel: "Milestone",
      highlightValue: input.milestone.name,
      sections: [
        { label: "Amount tied to this phase", value: formatCurrency(input.milestone.amount, input.proposal.currency) },
        { label: "Due lane", value: input.milestone.dueLabel },
      ],
      actionLabel: "Review milestone",
      actionHref: projectUrl,
    },
  });

  await sendWhatsApp({
    phone: input.lead.phone,
    entityId: input.project.id,
    templateKey: "milestone_update",
    subject: "Milestone update",
    body: [
      `HenryCo Studio • ${input.milestone.name}`,
      "A project milestone is ready for your review.",
      `Open workspace: ${projectUrl}`,
    ].join("\n"),
  });
}

export async function sendRevisionRequestedNotifications(input: {
  lead: StudioLead;
  proposal: StudioProposal;
  project: StudioProject;
  revision: StudioRevision;
}) {
  await renderAndSendEmail({
    to: input.lead.normalizedEmail,
    entityId: input.revision.id,
    templateKey: "revision_requested",
    layout: {
      subject: `Revision logged • ${input.project.title}`,
      eyebrow: "Revision logged",
      title: "The requested revision is now being tracked.",
      intro:
        "HenryCo Studio logged the revision as a formal delivery item so it stays visible to the team and to you.",
      sections: [
        { label: "Requested by", value: input.revision.requestedBy },
        { label: "Summary", value: input.revision.summary },
      ],
      actionLabel: "Open project workspace",
      actionHref: `${baseUrl()}/project/${input.project.id}?access=${input.project.accessKey}`,
    },
  });
}

export async function sendRevisionCompletedNotifications(input: {
  lead: StudioLead;
  proposal: StudioProposal;
  project: StudioProject;
  revision: StudioRevision;
}) {
  await renderAndSendEmail({
    to: input.lead.normalizedEmail,
    entityId: input.revision.id,
    templateKey: "revision_completed",
    layout: {
      subject: `Revision completed • ${input.project.title}`,
      eyebrow: "Revision completed",
      title: "A tracked revision has been completed.",
      intro:
        "The requested change has been completed and moved back into the project workspace for review and final confirmation.",
      sections: [
        { label: "Summary", value: input.revision.summary },
        { label: "Status", value: input.revision.status },
      ],
      actionLabel: "Review workspace",
      actionHref: `${baseUrl()}/project/${input.project.id}?access=${input.project.accessKey}`,
    },
  });
}

export async function sendFinalDeliveryNotifications(input: {
  lead: StudioLead;
  proposal: StudioProposal;
  project: StudioProject;
  milestone: StudioProjectMilestone;
}) {
  const projectUrl = `${baseUrl()}/project/${input.project.id}?access=${input.project.accessKey}`;
  await renderAndSendEmail({
    to: input.lead.normalizedEmail,
    entityId: input.project.id,
    templateKey: "final_delivery",
    layout: {
      subject: `Final delivery ready • ${input.project.title}`,
      eyebrow: "Final delivery",
      title: "Your project is ready for final approval.",
      intro:
        "HenryCo Studio has moved the project into final delivery. The last review rail, files, and approval state are now visible in the workspace.",
      highlightLabel: "Final checkpoint",
      highlightValue: input.milestone.name,
      actionLabel: "Open final delivery",
      actionHref: projectUrl,
    },
  });

  await sendWhatsApp({
    phone: input.lead.phone,
    entityId: input.project.id,
    templateKey: "final_delivery_ready",
    subject: "Final delivery ready",
    body: [
      `HenryCo Studio • ${input.project.title}`,
      "Final delivery is ready for your review.",
      `Open workspace: ${projectUrl}`,
    ].join("\n"),
  });
}

export async function sendProjectUpdateNotifications(input: {
  lead: StudioLead;
  project: StudioProject;
  update: StudioProjectUpdate;
}) {
  const projectUrl = `${baseUrl()}/project/${input.project.id}?access=${input.project.accessKey}`;
  await renderAndSendEmail({
    to: input.lead.normalizedEmail,
    entityId: input.update.id,
    templateKey: "project_update",
    layout: {
      subject: `Project update • ${input.update.title}`,
      eyebrow: "Project update",
      title: input.update.title,
      intro:
        "HenryCo Studio recorded a project update against your workspace so the latest movement, handoff, or review context stays visible and timestamped.",
      sections: [
        { label: "Project", value: input.project.title },
        { label: "Update type", value: input.update.kind.replaceAll("_", " ") },
        { label: "Summary", value: input.update.summary },
      ],
      actionLabel: "Open project workspace",
      actionHref: projectUrl,
    },
  });

  await sendWhatsApp({
    phone: input.lead.phone,
    entityId: input.project.id,
    templateKey: "project_update",
    subject: "Project update",
    body: [
      `HenryCo Studio • ${input.project.title}`,
      input.update.title,
      input.update.summary,
      `Workspace: ${projectUrl}`,
    ].join("\n"),
  });
}

export async function sendPaymentReminderNotification(input: {
  lead: StudioLead;
  project: StudioProject;
  payment: StudioPayment;
}) {
  const projectUrl = `${baseUrl()}/project/${input.project.id}?access=${input.project.accessKey}`;
  const platform = await getPaymentSettings();
  await renderAndSendEmail({
    to: input.lead.normalizedEmail,
    entityId: input.payment.id,
    templateKey: "payment_reminder",
    layout: {
      subject: `Payment reminder • ${input.project.title}`,
      eyebrow: "Payment reminder",
      title: "A payment checkpoint is still open.",
      intro:
        "A required payment checkpoint is still open on this project. The workspace shows the amount, due lane, and proof-upload path.",
      highlightLabel: "Amount due",
      highlightValue: formatCurrency(input.payment.amount, input.payment.currency),
      sections: [
        { label: "Payment label", value: input.payment.label },
        { label: "Due date", value: input.payment.dueDate ? new Date(input.payment.dueDate).toLocaleDateString("en-NG") : "Pending" },
        { label: "Bank", value: platform.paymentBankName || "Finance configuration pending" },
        { label: "Account name", value: platform.paymentAccountName || "Finance configuration pending" },
        { label: "Account number", value: platform.paymentAccountNumber || "Finance configuration pending" },
      ],
      bullets: [
        platform.paymentInstructions,
        "Copy the amount and account details directly from the payment lane.",
        "Upload proof in the Studio workspace once the transfer lands.",
      ],
      actionLabel: "Open payment workspace",
      actionHref: projectUrl,
    },
  });

  await sendWhatsApp({
    phone: input.lead.phone,
    entityId: input.payment.id,
    templateKey: "payment_reminder",
    subject: "Payment reminder",
    body: [
      `HenryCo Studio • ${input.payment.label}`,
      `Amount due: ${formatCurrency(input.payment.amount, input.payment.currency)}`,
      `Bank: ${platform.paymentBankName || "Pending"}`,
      `Account number: ${platform.paymentAccountNumber || "Pending"}`,
      `Project workspace: ${projectUrl}`,
    ].join("\n"),
  });
}

export async function sendSupportReplyNotification(input: {
  threadId: string;
  email?: string | null;
  phone?: string | null;
  subject: string;
  body: string;
}) {
  const supportUrl = getAccountUrl(`/support/${input.threadId}`);

  await renderAndSendEmail({
    to: input.email,
    entityId: input.threadId,
    templateKey: "support_reply",
    layout: {
      subject: `Support reply • ${input.subject}`,
      eyebrow: "Support reply",
      title: "HenryCo Studio replied to your support request.",
      intro:
        "Your support conversation has a new reply. The thread remains attached to your HenryCo support history so payment, delivery, and project clarification stay in one place.",
      sections: [
        { label: "Subject", value: input.subject },
        { label: "Reply", value: input.body },
      ],
      actionLabel: "Open support thread",
      actionHref: supportUrl,
    },
  });

  await sendWhatsApp({
    phone: input.phone,
    entityId: input.threadId,
    templateKey: "support_reply",
    subject: "Support reply",
    body: [
      "HenryCo Studio support replied to your thread.",
      input.subject,
      input.body,
      `Open thread: ${supportUrl}`,
    ].join("\n"),
  });
}
