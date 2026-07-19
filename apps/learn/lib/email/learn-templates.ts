import { getDivisionConfig, getDivisionUrl } from "@henryco/config";
import {
  HENRYCO_EMAIL_TOKENS,
  renderHenryCoEmailFooter,
  renderHenryCoEmailHeader,
  resolveRecipientLocale,
  sendTransactionalEmail,
} from "@henryco/email";
import {
  extractEmailAddress,
  formatCurrency,
} from "@/lib/env";
import { autoTranslateMany } from "@/lib/i18n/auto-translate";
import { getAccountLearnUrl } from "@/lib/learn/links";
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

// PASS 18C — locale-aware layout localizer.
async function localizeLearnLayout(layout: EmailLayout, locale: string): Promise<EmailLayout> {
  if (!locale || locale === "en") return layout;

  const sections = layout.sections ?? [];
  const bullets = layout.bullets ?? [];

  const subjectSeparator = " • ";
  const subjectIdx = layout.subject.indexOf(subjectSeparator);
  const subjectPrefix = subjectIdx >= 0 ? layout.subject.slice(0, subjectIdx) : layout.subject;
  const subjectSuffix = subjectIdx >= 0 ? layout.subject.slice(subjectIdx) : "";

  const inputs: string[] = [
    subjectPrefix,
    layout.eyebrow,
    layout.title,
    layout.intro,
    layout.highlightLabel || "",
    layout.actionLabel || "",
    ...sections.map((s) => s.label),
    ...bullets,
  ];

  let translated: string[];
  try {
    translated = await autoTranslateMany(inputs, locale as never);
    if (!Array.isArray(translated) || translated.length !== inputs.length) {
      return layout;
    }
  } catch {
    return layout;
  }

  const sectionStart = 6;
  const bulletStart = sectionStart + sections.length;

  return {
    ...layout,
    subject: (translated[0] || subjectPrefix) + subjectSuffix,
    eyebrow: translated[1] || layout.eyebrow,
    title: translated[2] || layout.title,
    intro: translated[3] || layout.intro,
    highlightLabel: layout.highlightLabel ? (translated[4] || layout.highlightLabel) : layout.highlightLabel,
    actionLabel: layout.actionLabel ? (translated[5] || layout.actionLabel) : layout.actionLabel,
    sections: sections.map((s, i) => ({ label: translated[sectionStart + i] || s.label, value: s.value })),
    bullets: bullets.map((b, i) => translated[bulletStart + i] || b),
  };
}

function renderEmail(layout: EmailLayout, locale: string = "en") {
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

  const t = HENRYCO_EMAIL_TOKENS;
  const brandHeader = renderHenryCoEmailHeader("learn", "dark");
  const brandFooter = renderHenryCoEmailFooter({
    purpose: "learn",
    supportEmail: learn.supportEmail,
  });

  const isRtl = locale === "ar";
  const dir = isRtl ? "rtl" : "ltr";

  return `
    <!doctype html>
    <html lang="${locale}" dir="${dir}">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <title>${escapeHtml(layout.title)}</title>
        <style>
          :root { color-scheme: light dark; }
          @media (prefers-color-scheme: dark) {
            body { background:#04100e !important; }
            .learn-shell { background:#0a1a17 !important; box-shadow:0 30px 90px rgba(0,0,0,0.62) !important; }
            .learn-body { background:#0a1a17 !important; color:#d7e8e3 !important; }
            .learn-footer-divider { background:#04100e !important; border-color:rgba(216,244,235,0.12) !important; }
          }
        </style>
      </head>
      <body style="margin:0; padding:0; background:${t.outerBg}; font-family:${t.bodyFont}; -webkit-font-smoothing:antialiased;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px; background:${t.outerBg};">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="learn-shell" style="max-width:640px; border-radius:28px; overflow:hidden; background:#ffffff; box-shadow:0 24px 80px rgba(8,18,25,0.12);">
                <tr>
                  <td style="padding:0; background:#0f2b28;">
                    ${brandHeader}
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px; background:linear-gradient(145deg, #071514 0%, #0f2b28 56%, #2d7f71 100%); color:#ffffff;">
                    <div style="font-family:${t.bodyFont}; font-size:12px; letter-spacing:0.22em; text-transform:uppercase; color:#c8f3e6; font-weight:700;">${escapeHtml(layout.eyebrow)}</div>
                    <div style="margin-top:14px; font-family:${t.headingFont}; font-size:32px; line-height:1.1; font-weight:600; letter-spacing:-0.025em;">${escapeHtml(layout.title)}</div>
                    <div style="margin-top:14px; max-width:520px; font-family:${t.bodyFont}; font-size:15px; line-height:1.8; color:rgba(255,255,255,0.78);">${escapeHtml(layout.intro)}</div>
                    ${
                      layout.highlightLabel && layout.highlightValue
                        ? `<div style="margin-top:20px; display:inline-block; border-radius:22px; border:1px solid rgba(216,244,235,0.22); background:rgba(255,255,255,0.06); padding:14px 18px;">
                            <div style="font-family:${t.bodyFont}; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:#d8f4eb; font-weight:700;">${escapeHtml(layout.highlightLabel)}</div>
                            <div style="margin-top:6px; font-family:${t.headingFont}; font-size:22px; line-height:1.2; font-weight:600; color:#ffffff;">${escapeHtml(layout.highlightValue)}</div>
                          </div>`
                        : ""
                    }
                  </td>
                </tr>
                <tr>
                  <td class="learn-body" style="padding:28px 32px 32px; font-family:${t.bodyFont};">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${sections}</table>
                    ${bullets ? `<ul style="padding-left:18px; margin:20px 0 0 0;">${bullets}</ul>` : ""}
                    ${action}
                  </td>
                </tr>
                <tr>
                  <td class="learn-footer-divider" style="padding:0; background:${t.outerBg}; border-top:1px solid rgba(15,43,40,0.08);">
                    ${brandFooter}
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

  // PASS 18C — render in recipient's locale.
  const recipientLocale = await resolveRecipientLocale(createAdminSupabase() as never, {
    userId: audience.userId,
    email: audience.normalizedEmail || recipient,
  });
  const localizedLayout = await localizeLearnLayout(input.layout, recipientLocale);

  const dispatch = await sendTransactionalEmail({
    to: recipient,
    purpose: "learn",
    replyTo: learn.supportEmail,
    subject: localizedLayout.subject,
    html: renderEmail(localizedLayout, recipientLocale),
    text: toText(localizedLayout),
  });

  const status: LearnNotification["status"] =
    dispatch.status === "sent"
      ? "sent"
      : dispatch.status === "skipped"
        ? "queued"
        : "failed";
  const reason =
    dispatch.status === "sent"
      ? // Don't persist the raw provider messageId into the per-notification
        // reason (read back into a learner-scoped record) — mark success opaquely.
        null
      : dispatch.status === "skipped"
        ? dispatch.skippedReason || "Email delivery is temporarily unavailable."
        : dispatch.safeError || "Email dispatch failed.";

  return addLearnNotificationRecord({
    userId: audience.userId,
    normalizedEmail: audience.normalizedEmail,
    channel: "email",
    templateKey: input.templateKey,
    recipient,
    title: localizedLayout.title || input.title,
    body: toText(localizedLayout),
    status,
    reason,
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
    title: "Your Henry Onyx Learn workspace is ready",
    entityType: "academy",
    entityId: "welcome",
    layout: {
      subject: "Your Henry Onyx Learn workspace is ready",
      eyebrow: "Academy onboarding",
      title: "Your academy workspace is ready.",
      intro:
        "Your academy workspace keeps your courses, progress, and certificates in one place.",
      bullets: [
        "Browse public courses and premium tracks from one place.",
        "Keep certificates and training assignments tied to one identity.",
        "Pick up where you stopped without losing progress.",
      ],
      actionLabel: "Open Henry Onyx account",
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
        "Your enrollment is confirmed. Your progress and certificates for this course are saved to your account.",
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
      `Henry Onyx Learn • ${input.courseTitle}`,
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
        "Your payment is confirmed and your course access is active. A record is in your account.",
      highlightLabel: "Amount",
      highlightValue: formatCurrency(input.amount, input.currency),
      sections: [
        { label: "Course", value: input.courseTitle },
        { label: "Reference", value: input.reference },
      ],
      actionLabel: "Open Henry Onyx account",
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
        "Henry Onyx Learn keeps the next lesson and completion state ready so returning feels calm instead of confusing.",
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
      `Henry Onyx Learn • ${input.courseTitle}`,
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
        "The course is active in Henry Onyx Learn. Starting the first lesson now makes later completion much easier.",
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
        "Your certificate has been issued and is publicly verifiable. It is saved to your account.",
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
      `Henry Onyx Learn • ${input.courseTitle}`,
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
      title: "A Henry Onyx training assignment was added to your queue.",
      intro:
        "This training has been added to your account. You can track your progress and see the due date there.",
      sections: [
        { label: "Assigned training", value: input.title },
        ...(input.sponsorName ? [{ label: "Sponsor", value: input.sponsorName }] : []),
        ...(input.dueAt ? [{ label: "Due", value: new Date(input.dueAt).toLocaleDateString("en-NG") }] : []),
      ],
      bullets: input.note ? [input.note] : [],
      actionLabel: "Open Henry Onyx account",
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
      `Henry Onyx Learn • ${input.title}`,
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
      actionLabel: "Open Henry Onyx account",
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
      subject: "Teaching application received • Henry Onyx Learn",
      eyebrow: "Teach with Henry Onyx",
      title: "Your teaching application is with the academy team.",
      intro:
        "Your teaching application has been received and is under review.",
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
      "Henry Onyx Learn • Teach with Henry Onyx",
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
        ? "Henry Onyx Learn needs a few updates before the application can move forward."
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
      subject: `Teaching application ${statusLabel} • Henry Onyx Learn`,
      eyebrow: "Teach with Henry Onyx",
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
      "Henry Onyx Learn • Teach with Henry Onyx",
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
