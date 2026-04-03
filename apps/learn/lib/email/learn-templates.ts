import { getDivisionConfig, getDivisionUrl } from "@henryco/config";
import {
  extractEmailAddress,
  formatCurrency,
  getOptionalEnv,
  sanitizeHeaderValue,
} from "@/lib/env";
import { getAccountLearnUrl, getLearnUrl } from "@/lib/learn/links";
import { createAdminSupabase } from "@/lib/supabase";
import { createId, nowIso, upsertLearnRecord } from "@/lib/learn/store";
import { sendLearnWhatsAppText } from "@/lib/learn/whatsapp";
import type { LearnEventKey, LearnNotification } from "@/lib/learn/types";

const learn = getDivisionConfig("learn");

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

type Audience = {
  userId?: string | null;
  email?: string | null;
  normalizedEmail?: string | null;
  fullName?: string | null;
  phone?: string | null;
};

function baseUrl() {
  return process.env.NODE_ENV === "production" ? getDivisionUrl("learn") : "http://localhost:3018";
}

function cleanText(value?: string | null) {
  return String(value || "").trim();
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
            <div style="font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#5e7d76; font-weight:700;">${escapeHtml(section.label)}</div>
            <div style="margin-top:6px; font-size:15px; line-height:1.7; color:#0c211d;">${escapeHtml(section.value)}</div>
          </td>
        </tr>
      `
    )
    .join("");

  const bullets = (layout.bullets ?? [])
    .map((item) => `<li style="margin:0 0 10px 0; line-height:1.7; color:#1a2f2a;">${escapeHtml(item)}</li>`)
    .join("");

  const action =
    layout.actionLabel && layout.actionHref
      ? `
        <a href="${escapeHtml(layout.actionHref)}" style="display:inline-block; margin-top:24px; padding:14px 22px; border-radius:999px; background:#ddf7ee; color:#042019; text-decoration:none; font-weight:800; font-size:14px;">
          ${escapeHtml(layout.actionLabel)}
        </a>
      `
      : "";

  return `
    <!doctype html>
    <html lang="en">
      <body style="margin:0; padding:0; background:#eef7f3; font-family:Manrope,Segoe UI,Arial,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; border-radius:28px; overflow:hidden; background:#ffffff; box-shadow:0 24px 80px rgba(8,18,25,0.12);">
                <tr>
                  <td style="padding:32px; background:linear-gradient(145deg, #071514 0%, #0f2b28 56%, #2d7f71 100%); color:#ffffff;">
                    <div style="font-size:12px; letter-spacing:0.22em; text-transform:uppercase; color:#c8f3e6; font-weight:700;">${escapeHtml(layout.eyebrow)}</div>
                    <div style="margin-top:14px; font-size:34px; line-height:1.06; font-weight:800; letter-spacing:-0.04em;">${escapeHtml(layout.title)}</div>
                    <div style="margin-top:14px; max-width:520px; font-size:15px; line-height:1.8; color:rgba(255,255,255,0.78);">${escapeHtml(layout.intro)}</div>
                    ${
                      layout.highlightLabel && layout.highlightValue
                        ? `<div style="margin-top:20px; display:inline-block; border-radius:22px; border:1px solid rgba(216,244,235,0.18); background:rgba(255,255,255,0.06); padding:14px 18px;">
                            <div style="font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:#d8f4eb; font-weight:700;">${escapeHtml(layout.highlightLabel)}</div>
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
    ...((layout.sections ?? []).map((section) => `${section.label}: ${section.value}`)),
    "",
    ...((layout.bullets ?? []).map((item) => `- ${item}`)),
    "",
    ...(layout.actionLabel && layout.actionHref ? [`${layout.actionLabel}: ${layout.actionHref}`] : []),
  ].join("\n");
}

function fromAddress() {
  const raw = sanitizeHeaderValue(
    process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM || `${learn.name} <onboarding@resend.dev>`
  );
  const email = extractEmailAddress(raw) || "onboarding@resend.dev";
  return `${learn.name} <${email}>`;
}

async function getOwnerRecipients() {
  const envTarget = extractEmailAddress(process.env.OWNER_ALERT_EMAIL || process.env.RESEND_SUPPORT_INBOX);
  if (envTarget) return [envTarget];

  const admin = createAdminSupabase();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
  if (error) return [];

  return (data.users ?? [])
    .filter((user) => {
      const role = String(user.app_metadata?.role || user.user_metadata?.role || "").toLowerCase();
      return role === "owner" || role === "manager";
    })
    .map((user) => extractEmailAddress(user.email))
    .filter(Boolean) as string[];
}

async function resolveAudience(input: Audience): Promise<Required<Audience>> {
  const admin = createAdminSupabase();
  const normalizedEmail = cleanText(input.normalizedEmail || input.email).toLowerCase() || null;
  const userId = cleanText(input.userId) || null;
  const emailDirect = cleanText(input.email) || null;

  const [customerProfile, sharedProfile] = await Promise.all([
    userId || normalizedEmail
      ? admin
          .from("customer_profiles")
          .select("email, full_name, phone")
          .or(
            userId && normalizedEmail
              ? `id.eq.${userId},email.eq.${normalizedEmail}`
              : userId
                ? `id.eq.${userId}`
                : `email.eq.${normalizedEmail}`
          )
          .maybeSingle()
      : Promise.resolve({ data: null }),
    userId || normalizedEmail
      ? admin
          .from("profiles")
          .select("email, full_name, phone")
          .or(
            userId && normalizedEmail
              ? `id.eq.${userId},email.eq.${normalizedEmail}`
              : userId
                ? `id.eq.${userId}`
                : `email.eq.${normalizedEmail}`
          )
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    userId,
    normalizedEmail,
    email:
      emailDirect ||
      cleanText(customerProfile.data?.email) ||
      cleanText(sharedProfile.data?.email) ||
      normalizedEmail,
    fullName:
      cleanText(input.fullName) ||
      cleanText(customerProfile.data?.full_name) ||
      cleanText(sharedProfile.data?.full_name) ||
      null,
    phone:
      cleanText(input.phone) ||
      cleanText(customerProfile.data?.phone) ||
      cleanText(sharedProfile.data?.phone) ||
      null,
  };
}

export async function addLearnNotificationRecord(
  record: Omit<LearnNotification, "id" | "createdAt" | "readAt">
) {
  const notification: LearnNotification = {
    id: createId(),
    createdAt: nowIso(),
    readAt: null,
    ...record,
  };

  await upsertLearnRecord(
    "learn_notifications",
    {
      id: notification.id,
      user_id: notification.userId,
      normalized_email: notification.normalizedEmail,
      channel: notification.channel,
      template_key: notification.templateKey,
      recipient: notification.recipient,
      title: notification.title,
      body: notification.body,
      status: notification.status,
      reason: notification.reason,
      entity_type: notification.entityType,
      entity_id: notification.entityId,
      read_at: notification.readAt,
      created_at: notification.createdAt,
    },
    {
      userId: notification.userId,
      email: notification.normalizedEmail,
      role: "academy_system",
    }
  );

  return notification;
}

async function sendEmail(input: {
  audience: Audience;
  templateKey: LearnEventKey;
  title: string;
  entityType?: string | null;
  entityId?: string | null;
  layout: EmailLayout;
}) {
  const audience = await resolveAudience(input.audience);
  const recipient = extractEmailAddress(audience.email);
  if (!recipient) {
    return addLearnNotificationRecord({
      userId: audience.userId,
      normalizedEmail: audience.normalizedEmail,
      channel: "email",
      templateKey: input.templateKey,
      recipient: audience.email || "missing-recipient",
      title: input.title,
      body: toText(input.layout),
      status: "skipped",
      reason: "Recipient email is missing.",
      entityType: input.entityType || null,
      entityId: input.entityId || null,
    });
  }

  const resendKey = getOptionalEnv("RESEND_API_KEY");
  if (!resendKey) {
    return addLearnNotificationRecord({
      userId: audience.userId,
      normalizedEmail: audience.normalizedEmail,
      channel: "email",
      templateKey: input.templateKey,
      recipient,
      title: input.title,
      body: toText(input.layout),
      status: "queued",
      reason: "RESEND_API_KEY is not configured for this deployment.",
      entityType: input.entityType || null,
      entityId: input.entityId || null,
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
      reply_to: learn.supportEmail,
      subject: input.layout.subject,
      html: renderEmail(input.layout),
      text: toText(input.layout),
    }),
  });

  const payload = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;
  return addLearnNotificationRecord({
    userId: audience.userId,
    normalizedEmail: audience.normalizedEmail,
    channel: "email",
    templateKey: input.templateKey,
    recipient,
    title: input.title,
    body: toText(input.layout),
    status: response.ok ? "sent" : "failed",
    reason: response.ok
      ? payload?.id ?? null
      : payload?.message || `Resend rejected the email with status ${response.status}.`,
    entityType: input.entityType || null,
    entityId: input.entityId || null,
  });
}

async function sendWhatsApp(input: {
  audience: Audience;
  templateKey: LearnEventKey;
  title: string;
  entityType?: string | null;
  entityId?: string | null;
  body: string;
}) {
  const audience = await resolveAudience(input.audience);
  const result = await sendLearnWhatsAppText({
    phone: audience.phone,
    body: input.body,
  });

  return addLearnNotificationRecord({
    userId: audience.userId,
    normalizedEmail: audience.normalizedEmail,
    channel: "whatsapp",
    templateKey: input.templateKey,
    recipient: audience.phone || "missing-recipient",
    title: input.title,
    body: input.body,
    status: result.status,
    reason: result.reason,
    entityType: input.entityType || null,
    entityId: input.entityId || null,
  });
}

export async function sendAcademyWelcomeNotification(input: {
  audience: Audience;
}) {
  return sendEmail({
    audience: input.audience,
    templateKey: "academy_welcome",
    title: "Welcome to HenryCo Learn",
    entityType: "academy",
    entityId: "welcome",
    layout: {
      subject: "Welcome to HenryCo Learn",
      eyebrow: "Academy welcome",
      title: "Your academy workspace is ready.",
      intro:
        "HenryCo Learn now tracks your enrollments, path progress, certificates, notifications, and internal assignments through one calm academy dashboard.",
      bullets: [
        "Browse public courses and premium tracks from one place.",
        "Keep certificates and training assignments tied to one identity.",
        "Pick up where you stopped without losing progress.",
      ],
      actionLabel: "Open HenryCo account",
      actionHref: getAccountLearnUrl(),
    },
  });
}

export async function sendEnrollmentConfirmedNotification(input: {
  audience: Audience;
  courseTitle: string;
  courseId: string;
  courseSlug: string;
  statusLabel: string;
  amount?: number | null;
  currency?: string | null;
}) {
  await sendEmail({
    audience: input.audience,
    templateKey: "enrollment_confirmed",
    title: "Enrollment confirmed",
    entityType: "course",
    entityId: input.courseId,
    layout: {
      subject: `Enrollment confirmed • ${input.courseTitle}`,
      eyebrow: "Enrollment confirmed",
      title: "Your place in the academy is now recorded.",
      intro:
        "HenryCo Learn has created the enrollment and connected it to your unified academy history so progress, quiz attempts, payments, and certificates stay traceable.",
      highlightLabel: "Access state",
      highlightValue: input.statusLabel,
      sections: [
        { label: "Course", value: input.courseTitle },
        ...(input.amount != null
          ? [{ label: "Price", value: formatCurrency(input.amount, input.currency || "NGN") }]
          : []),
      ],
      actionLabel: "Open course page",
      actionHref: `${baseUrl()}/courses/${input.courseSlug}`,
    },
  });

  await sendWhatsApp({
    audience: input.audience,
    templateKey: "enrollment_confirmed",
    title: "Enrollment confirmed",
    entityType: "course",
    entityId: input.courseId,
    body: [
      `HenryCo Learn • ${input.courseTitle}`,
      `Enrollment confirmed. Access state: ${input.statusLabel}.`,
      `Open course: ${baseUrl()}/courses/${input.courseSlug}`,
    ].join("\n"),
  });
}

export async function sendPaymentConfirmedNotification(input: {
  audience: Audience;
  courseTitle: string;
  courseId: string;
  amount: number;
  currency: string;
  reference: string;
}) {
  return sendEmail({
    audience: input.audience,
    templateKey: "payment_confirmed",
    title: "Payment confirmed",
    entityType: "payment",
    entityId: input.reference,
    layout: {
      subject: `Payment confirmed • ${input.courseTitle}`,
      eyebrow: "Payment confirmed",
      title: "Your course payment is now confirmed.",
      intro:
        "HenryCo Learn recorded the payment, activated the course access lane, and synced the billing event into your unified account history.",
      highlightLabel: "Amount",
      highlightValue: formatCurrency(input.amount, input.currency),
      sections: [
        { label: "Course", value: input.courseTitle },
        { label: "Reference", value: input.reference },
      ],
      actionLabel: "Open HenryCo account",
      actionHref: getAccountLearnUrl("payments"),
    },
  });
}

export async function sendProgressReminderNotification(input: {
  audience: Audience;
  courseTitle: string;
  courseId: string;
  coursePlayerUrl: string;
  percentComplete: number;
}) {
  await sendEmail({
    audience: input.audience,
    templateKey: "progress_reminder",
    title: "Progress reminder",
    entityType: "course",
    entityId: input.courseId,
    layout: {
      subject: `Progress reminder • ${input.courseTitle}`,
      eyebrow: "Progress reminder",
      title: "You already started. Pick it back up cleanly.",
      intro:
        "HenryCo Learn keeps the next lesson and completion state ready so returning feels calm instead of confusing.",
      highlightLabel: "Current progress",
      highlightValue: `${input.percentComplete}%`,
      sections: [{ label: "Course", value: input.courseTitle }],
      actionLabel: "Resume course",
      actionHref: input.coursePlayerUrl,
    },
  });

  await sendWhatsApp({
    audience: input.audience,
    templateKey: "progress_reminder",
    title: "Progress reminder",
    entityType: "course",
    entityId: input.courseId,
    body: [
      `HenryCo Learn • ${input.courseTitle}`,
      `You are ${input.percentComplete}% complete.`,
      `Resume here: ${input.coursePlayerUrl}`,
    ].join("\n"),
  });
}

export async function sendCourseNudgeNotification(input: {
  audience: Audience;
  courseTitle: string;
  courseId: string;
  coursePlayerUrl: string;
}) {
  return sendEmail({
    audience: input.audience,
    templateKey: "course_nudge",
    title: "Course nudge",
    entityType: "course",
    entityId: input.courseId,
    layout: {
      subject: `Course nudge • ${input.courseTitle}`,
      eyebrow: "Course nudge",
      title: "Your course seat is waiting for a first move.",
      intro:
        "The course is active in HenryCo Learn. Starting the first lesson now makes later completion much easier.",
      sections: [{ label: "Course", value: input.courseTitle }],
      actionLabel: "Start learning",
      actionHref: input.coursePlayerUrl,
    },
  });
}

export async function sendCertificateEarnedNotification(input: {
  audience: Audience;
  courseTitle: string;
  certificateId: string;
  certificateNo: string;
  verificationCode: string;
}) {
  const verifyUrl = `${baseUrl()}/certifications/verify/${input.verificationCode}`;
  await sendEmail({
    audience: input.audience,
    templateKey: "certificate_earned",
    title: "Certificate earned",
    entityType: "certificate",
    entityId: input.certificateId,
    layout: {
      subject: `Certificate earned • ${input.courseTitle}`,
      eyebrow: "Certificate earned",
      title: "Your certificate is now live.",
      intro:
        "HenryCo Learn issued the completion record, attached public verification, and synced the credential into your unified account history.",
      highlightLabel: "Certificate no",
      highlightValue: input.certificateNo,
      sections: [
        { label: "Course", value: input.courseTitle },
        { label: "Verification code", value: input.verificationCode },
      ],
      actionLabel: "Verify certificate",
      actionHref: verifyUrl,
    },
  });

  await sendWhatsApp({
    audience: input.audience,
    templateKey: "certificate_earned",
    title: "Certificate earned",
    entityType: "certificate",
    entityId: input.certificateId,
    body: [
      `HenryCo Learn • ${input.courseTitle}`,
      `Certificate issued: ${input.certificateNo}`,
      `Verify: ${verifyUrl}`,
    ].join("\n"),
  });
}

export async function sendInternalAssignmentNotification(input: {
  audience: Audience;
  title: string;
  entityId: string;
  dueAt?: string | null;
  sponsorName?: string | null;
  note?: string | null;
}) {
  await sendEmail({
    audience: input.audience,
    templateKey: "internal_assignment",
    title: "Internal training assigned",
    entityType: "assignment",
    entityId: input.entityId,
    layout: {
      subject: `Internal training assigned • ${input.title}`,
      eyebrow: "Internal assignment",
      title: "A HenryCo training assignment was added to your queue.",
      intro:
        "The assignment is now visible in HenryCo Learn with progress tracking, due date visibility, and certificate readiness when applicable.",
      sections: [
        { label: "Assigned training", value: input.title },
        ...(input.sponsorName ? [{ label: "Sponsor", value: input.sponsorName }] : []),
        ...(input.dueAt ? [{ label: "Due", value: new Date(input.dueAt).toLocaleDateString("en-NG") }] : []),
      ],
      bullets: input.note ? [input.note] : [],
      actionLabel: "Open HenryCo account",
      actionHref: getAccountLearnUrl("assignments"),
    },
  });

  await sendWhatsApp({
    audience: input.audience,
    templateKey: "internal_assignment",
    title: "Internal training assigned",
    entityType: "assignment",
    entityId: input.entityId,
    body: [
      `HenryCo Learn • ${input.title}`,
      input.sponsorName ? `Sponsor: ${input.sponsorName}` : null,
      input.dueAt ? `Due: ${new Date(input.dueAt).toLocaleDateString("en-NG")}` : null,
      `Dashboard: ${getAccountLearnUrl("assignments")}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

export async function sendAcademyAnnouncementNotification(input: {
  audience: Audience;
  title: string;
  body: string;
  entityId: string;
}) {
  return sendEmail({
    audience: input.audience,
    templateKey: "academy_announcement",
    title: input.title,
    entityType: "announcement",
    entityId: input.entityId,
    layout: {
      subject: `Academy announcement • ${input.title}`,
      eyebrow: "Academy announcement",
      title: input.title,
      intro: input.body,
      actionLabel: "Open HenryCo account",
      actionHref: getAccountLearnUrl("notifications"),
    },
  });
}

export async function sendTeacherApplicationSubmittedNotification(input: {
  audience: Audience;
  fullName: string;
  expertiseArea: string;
  teachingTopics: string[];
  applicationId: string;
  manageUrl: string;
}) {
  await sendEmail({
    audience: input.audience,
    templateKey: "teacher_application_submitted",
    title: "Teaching application submitted",
    entityType: "teacher_application",
    entityId: input.applicationId,
    layout: {
      subject: "Teaching application received • HenryCo Learn",
      eyebrow: "Teach with HenryCo",
      title: "Your teaching application is with the academy team.",
      intro:
        "HenryCo Learn has recorded your application and attached it to your HenryCo identity so review, onboarding, and future instructor operations stay connected.",
      sections: [
        { label: "Applicant", value: input.fullName },
        { label: "Expertise", value: input.expertiseArea },
        ...(input.teachingTopics.length
          ? [{ label: "Proposed topics", value: input.teachingTopics.join(", ") }]
          : []),
      ],
      actionLabel: "Review application",
      actionHref: input.manageUrl,
    },
  });

  await sendWhatsApp({
    audience: input.audience,
    templateKey: "teacher_application_submitted",
    title: "Teaching application submitted",
    entityType: "teacher_application",
    entityId: input.applicationId,
    body: [
      "HenryCo Learn • Teach with HenryCo",
      "Your teaching application has been received.",
      `Review it here: ${input.manageUrl}`,
    ].join("\n"),
  });
}

export async function sendTeacherApplicationStatusNotification(input: {
  audience: Audience;
  fullName: string;
  applicationId: string;
  status: "submitted" | "under_review" | "changes_requested" | "approved" | "rejected";
  reviewNotes?: string | null;
  manageUrl: string;
}) {
  const statusLabel =
    input.status === "changes_requested"
      ? "Changes requested"
      : input.status === "approved"
        ? "Approved"
        : input.status === "rejected"
          ? "Not approved"
          : input.status === "under_review"
            ? "Under review"
            : "Submitted";

  const templateKey =
    input.status === "changes_requested"
      ? "teacher_application_changes_requested"
      : input.status === "approved"
        ? "teacher_application_approved"
        : input.status === "rejected"
          ? "teacher_application_rejected"
          : "teacher_application_submitted";

  const intro =
    input.status === "approved"
      ? "Your application is approved and ready to move into instructor onboarding."
      : input.status === "changes_requested"
        ? "HenryCo Learn needs a few updates before the application can move forward."
        : input.status === "rejected"
          ? "The academy team has reviewed the application and it is not moving forward in its current form."
          : "Your application is currently being reviewed by the academy team.";

  await sendEmail({
    audience: input.audience,
    templateKey,
    title: `Teaching application ${statusLabel.toLowerCase()}`,
    entityType: "teacher_application",
    entityId: input.applicationId,
    layout: {
      subject: `Teaching application ${statusLabel} • HenryCo Learn`,
      eyebrow: "Teach with HenryCo",
      title: `Application ${statusLabel.toLowerCase()}.`,
      intro,
      sections: [{ label: "Applicant", value: input.fullName }],
      bullets: input.reviewNotes ? [input.reviewNotes] : [],
      actionLabel:
        input.status === "approved"
          ? "Open instructor application"
          : input.status === "changes_requested"
            ? "Update application"
            : "Open application",
      actionHref: input.manageUrl,
    },
  });

  await sendWhatsApp({
    audience: input.audience,
    templateKey,
    title: `Teaching application ${statusLabel.toLowerCase()}`,
    entityType: "teacher_application",
    entityId: input.applicationId,
    body: [
      "HenryCo Learn • Teach with HenryCo",
      `Application status: ${statusLabel}.`,
      input.reviewNotes ? `Notes: ${input.reviewNotes}` : null,
      `Open application: ${input.manageUrl}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

export async function sendOwnerAlert(input: {
  title: string;
  body: string;
  entityType?: string | null;
  entityId?: string | null;
  actionUrl?: string | null;
}) {
  const owners = await getOwnerRecipients();
  for (const owner of owners) {
    await sendEmail({
      audience: { email: owner },
      templateKey: "owner_alert",
      title: input.title,
      entityType: input.entityType || null,
      entityId: input.entityId || null,
      layout: {
        subject: `Owner alert • ${input.title}`,
        eyebrow: "Owner alert",
        title: input.title,
        intro: input.body,
        actionLabel: input.actionUrl ? "Open academy ops" : null,
        actionHref: input.actionUrl || null,
      },
    });
  }
}
