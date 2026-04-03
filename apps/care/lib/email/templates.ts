import "server-only";

import { getDivisionConfig } from "@henryco/config";
import type { CareSettingsRecord } from "@/lib/care-settings-shared";

type EmailSection = {
  label: string;
  value: string;
};

type EmailListBlock = {
  title: string;
  items: string[];
};

type EmailAction = {
  label: string;
  href: string;
};

type EmailLayout = {
  subject: string;
  templateKey: CareEmailTemplate["type"];
  preview: string;
  eyebrow: string;
  title: string;
  intro: string;
  highlightLabel?: string | null;
  highlightValue?: string | null;
  sections?: EmailSection[];
  lists?: EmailListBlock[];
  primaryAction?: EmailAction | null;
  secondaryAction?: EmailAction | null;
  closing?: string[];
};

export type BookingConfirmationEmailProps = {
  customerName: string;
  trackingCode: string;
  serviceFamilyLabel: string;
  serviceType: string;
  pickupDate: string | null;
  serviceWindow: string | null;
  addressSummary: string | null;
  orderSummary: string | null;
  trackUrl: string;
  nextSteps: string[];
};

export type BookingStatusUpdateEmailProps = {
  customerName: string;
  trackingCode: string;
  serviceFamilyLabel: string;
  serviceType: string;
  statusLabel: string;
  statusMeaning: string;
  nextSteps: string[];
  trackUrl: string;
};

export type TrackingCodeEmailProps = {
  customerName: string;
  trackingCode: string;
  serviceFamilyLabel: string;
  trackUrl: string;
};

export type StaffInvitationEmailProps = {
  staffName: string;
  roleLabel: string;
  accessUrl: string;
  invitedBy: string | null;
};

export type PasswordRecoveryEmailProps = {
  staffName: string;
  recoveryUrl: string;
};

export type PaymentRequestEmailProps = {
  customerName: string;
  trackingCode: string;
  amountDue: string;
  currencyLabel: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  instructions: string;
  trackUrl: string;
};

export type PaymentReceivedEmailProps = {
  customerName: string;
  trackingCode: string;
  amountPaid: string;
  balanceDue: string;
  paymentMethod: string;
  reference: string | null;
  trackUrl: string;
};

export type PaymentReceiptReceivedEmailProps = {
  customerName: string;
  trackingCode: string;
  amountDue: string;
  serviceType: string;
  trackUrl: string;
};

export type PaymentProofUpdateEmailProps = {
  customerName: string;
  trackingCode: string;
  serviceType: string;
  statusLabel: string;
  message: string;
  trackUrl: string;
};

export type ReviewRequestEmailProps = {
  customerName: string;
  trackingCode: string;
  serviceType: string;
  serviceFamilyLabel: string;
  reviewUrl: string;
};

export type AdminNotificationEmailProps = {
  heading: string;
  summary: string;
  lines: string[];
  action?: EmailAction | null;
};

export type ContactConfirmationEmailProps = {
  customerName: string;
  threadRef: string;
  subject: string;
  messagePreview: string;
  preferredContactMethod: string;
  serviceCategoryLabel: string;
  contactUrl: string;
};

export type SupportReplyEmailProps = {
  customerName: string;
  subject: string;
  threadRef: string;
  message: string;
  contactUrl: string;
};

export type OwnerMonthlySummaryEmailProps = {
  ownerName: string;
  monthLabel: string;
  inflow: string;
  outflow: string;
  net: string;
  bookingsCount: number;
  deliveredCount: number;
  outstandingBalance: string;
  pendingExpenseCount: number;
  topExpenseCategories: string[];
  keySignals: string[];
  financeUrl: string;
};

export type PaymentReminderEmailProps = {
  customerName: string;
  trackingCode: string;
  amountDue: string;
  currencyLabel: string;
  dueLabel: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  instructions: string;
  trackUrl: string;
};

export type ServiceReminderEmailProps = {
  customerName: string;
  serviceFamilyLabel: string;
  serviceType: string;
  timingLabel: string;
  recommendation: string;
  bookUrl: string;
  contactUrl: string;
  unsubscribeUrl: string;
};

export type CustomerReengagementEmailProps = {
  customerName: string;
  serviceFamilyLabel: string;
  serviceType: string;
  comebackNote: string;
  bookUrl: string;
  contactUrl: string;
  unsubscribeUrl: string;
};

export type CareEmailTemplate =
  | { type: "booking_confirmation"; props: BookingConfirmationEmailProps }
  | { type: "booking_status_update"; props: BookingStatusUpdateEmailProps }
  | { type: "tracking_code_confirmation"; props: TrackingCodeEmailProps }
  | { type: "staff_invitation"; props: StaffInvitationEmailProps }
  | { type: "password_recovery"; props: PasswordRecoveryEmailProps }
  | { type: "payment_request"; props: PaymentRequestEmailProps }
  | { type: "payment_received"; props: PaymentReceivedEmailProps }
  | { type: "payment_receipt_received"; props: PaymentReceiptReceivedEmailProps }
  | { type: "payment_proof_update"; props: PaymentProofUpdateEmailProps }
  | { type: "review_request"; props: ReviewRequestEmailProps }
  | { type: "contact_confirmation"; props: ContactConfirmationEmailProps }
  | { type: "support_reply"; props: SupportReplyEmailProps }
  | { type: "owner_monthly_summary"; props: OwnerMonthlySummaryEmailProps }
  | { type: "payment_reminder"; props: PaymentReminderEmailProps }
  | { type: "service_reminder"; props: ServiceReminderEmailProps }
  | { type: "customer_reengagement"; props: CustomerReengagementEmailProps }
  | { type: "admin_notification"; props: AdminNotificationEmailProps };

export type RenderedCareEmail = {
  subject: string;
  templateKey: CareEmailTemplate["type"];
  html: string;
  text: string;
};

const care = getDivisionConfig("care");

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function paragraphize(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function renderSections(sections: EmailSection[]) {
  if (!sections.length) return "";

  const rows = sections
    .map(
      (section) => `
        <tr>
          <td style="padding: 0 0 10px 0;">
            <div style="font-size:12px; letter-spacing:0.12em; text-transform:uppercase; color:#6b7c93; font-weight:700;">${escapeHtml(section.label)}</div>
            <div style="margin-top:6px; font-size:15px; line-height:1.7; color:#122033;">${paragraphize(section.value)}</div>
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      ${rows}
    </table>
  `;
}

function renderLists(lists: EmailListBlock[]) {
  if (!lists.length) return "";

  return lists
    .map((list) => {
      const items = list.items
        .map(
          (item) => `
            <li style="margin:0 0 10px 0; color:#24324a; line-height:1.7;">${escapeHtml(item)}</li>
          `
        )
        .join("");

      return `
        <div style="margin-top:24px;">
          <div style="font-size:12px; letter-spacing:0.12em; text-transform:uppercase; color:#6b7c93; font-weight:700;">${escapeHtml(list.title)}</div>
          <ul style="padding-left:18px; margin:12px 0 0 0;">
            ${items}
          </ul>
        </div>
      `;
    })
    .join("");
}

function renderAction(action: EmailAction | null | undefined, variant: "primary" | "secondary") {
  if (!action) return "";

  const background = variant === "primary" ? "#6B7CFF" : "#E8EBFF";
  const color = variant === "primary" ? "#07111F" : "#122033";

  return `
    <a
      href="${escapeHtml(action.href)}"
      style="display:inline-block; margin-top:24px; padding:14px 22px; border-radius:999px; background:${background}; color:${color}; text-decoration:none; font-weight:700; font-size:14px;"
    >
      ${escapeHtml(action.label)}
    </a>
  `;
}

function renderText(layout: EmailLayout, settings: CareSettingsRecord) {
  const lines = [
    `${care.name}`,
    layout.eyebrow,
    layout.title,
    "",
    layout.intro,
    "",
  ];

  if (layout.highlightLabel && layout.highlightValue) {
    lines.push(`${layout.highlightLabel}: ${layout.highlightValue}`, "");
  }

  for (const section of layout.sections ?? []) {
    lines.push(`${section.label}: ${section.value}`, "");
  }

  for (const list of layout.lists ?? []) {
    lines.push(`${list.title}:`);
    for (const item of list.items) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }

  if (layout.primaryAction) {
    lines.push(`${layout.primaryAction.label}: ${layout.primaryAction.href}`, "");
  }

  if (layout.secondaryAction) {
    lines.push(`${layout.secondaryAction.label}: ${layout.secondaryAction.href}`, "");
  }

  for (const line of layout.closing ?? []) {
    lines.push(line);
  }

  lines.push(
    "",
    `${care.name}`,
    settings.support_email ? `Support: ${settings.support_email}` : "",
    settings.support_phone ? `Phone: ${settings.support_phone}` : ""
  );

  return lines.filter(Boolean).join("\n");
}

function renderHtml(layout: EmailLayout, settings: CareSettingsRecord) {
  const supportLine = [settings.support_email, settings.support_phone].filter(Boolean).join(" • ");

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(layout.subject)}</title>
      </head>
      <body style="margin:0; padding:0; background:#edf2f8; font-family:Inter,Segoe UI,Arial,sans-serif;">
        <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(layout.preview)}</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#edf2f8; padding:32px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; overflow:hidden; border-radius:28px; background:#ffffff; box-shadow:0 20px 70px rgba(7,17,31,0.10);">
                <tr>
                  <td style="padding:32px 32px 24px; background:linear-gradient(135deg, #07111F 0%, #101B46 52%, #152860 100%); color:#ffffff;">
                    <div style="font-size:12px; letter-spacing:0.22em; text-transform:uppercase; color:#8BDCF8; font-weight:700;">${escapeHtml(layout.eyebrow)}</div>
                    <div style="margin-top:14px; font-size:34px; line-height:1.08; font-weight:800; letter-spacing:-0.04em;">${escapeHtml(layout.title)}</div>
                    <div style="margin-top:14px; max-width:520px; font-size:15px; line-height:1.8; color:rgba(255,255,255,0.76);">${paragraphize(layout.intro)}</div>
                    ${
                      layout.highlightLabel && layout.highlightValue
                        ? `
                          <div style="margin-top:22px; display:inline-block; border-radius:22px; border:1px solid rgba(139,220,248,0.22); background:rgba(255,255,255,0.06); padding:14px 18px;">
                            <div style="font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:#A8F3E8; font-weight:700;">${escapeHtml(layout.highlightLabel)}</div>
                            <div style="margin-top:6px; font-size:22px; line-height:1.2; font-weight:800; color:#ffffff;">${escapeHtml(layout.highlightValue)}</div>
                          </div>
                        `
                        : ""
                    }
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 32px 30px; color:#122033;">
                    ${renderSections(layout.sections ?? [])}
                    ${renderLists(layout.lists ?? [])}
                    ${renderAction(layout.primaryAction, "primary")}
                    ${layout.secondaryAction ? `<div style="margin-top:12px;">${renderAction(layout.secondaryAction, "secondary")}</div>` : ""}
                    ${
                      (layout.closing ?? []).length > 0
                        ? `<div style="margin-top:24px; font-size:14px; line-height:1.8; color:#31425c;">${(layout.closing ?? [])
                            .map((line) => escapeHtml(line))
                            .join("<br />")}</div>`
                        : ""
                    }
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 32px 24px; border-top:1px solid rgba(16,27,70,0.08); background:#f6f8fc;">
                    <div style="font-size:12px; letter-spacing:0.16em; text-transform:uppercase; color:#6b7c93; font-weight:700;">${escapeHtml(care.name)}</div>
                    <div style="margin-top:8px; font-size:13px; line-height:1.7; color:#55657d;">
                      Garment care, home cleaning, office cleaning, and pickup delivery.
                      ${supportLine ? `<br />${escapeHtml(supportLine)}` : ""}
                    </div>
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

function buildLayout(template: CareEmailTemplate): EmailLayout {
  switch (template.type) {
    case "booking_confirmation": {
      const props = template.props;
      return {
        subject: `Booking confirmed • ${props.trackingCode}`,
        templateKey: template.type,
        preview: `Your ${props.serviceFamilyLabel.toLowerCase()} booking is confirmed.`,
        eyebrow: "Booking confirmation",
        title: "Your service request is confirmed.",
        intro:
          "HenryCo Care has registered the request and issued a live tracking code so you can follow every next step clearly. If payment is required before processing, the next message in this same email thread will carry the account details.",
        highlightLabel: "Tracking code",
        highlightValue: props.trackingCode,
        sections: [
          { label: "Customer", value: props.customerName },
          { label: "Service family", value: props.serviceFamilyLabel },
          { label: "Service line", value: props.serviceType },
          ...(props.pickupDate ? [{ label: "Scheduled date", value: props.pickupDate }] : []),
          ...(props.serviceWindow ? [{ label: "Window", value: props.serviceWindow }] : []),
          ...(props.addressSummary ? [{ label: "Address", value: props.addressSummary }] : []),
          ...(props.orderSummary ? [{ label: "Request summary", value: props.orderSummary }] : []),
        ],
        lists: props.nextSteps.length > 0 ? [{ title: "Next steps", items: props.nextSteps }] : [],
        primaryAction: { label: "Track this service", href: props.trackUrl },
        closing: [
          "After payment, reply to this same email with your receipt so the team can verify and continue the booking.",
          "If any detail changes before dispatch, reply to this email or contact the Care desk.",
          "HenryCo Care",
        ],
      };
    }
    case "booking_status_update": {
      const props = template.props;
      return {
        subject: `Booking update • ${props.trackingCode}`,
        templateKey: template.type,
        preview: `Your ${props.serviceFamilyLabel.toLowerCase()} booking moved to ${props.statusLabel.toLowerCase()}.`,
        eyebrow: "Status update",
        title: `Your booking is now ${props.statusLabel.toLowerCase()}.`,
        intro: props.statusMeaning,
        highlightLabel: "Tracking code",
        highlightValue: props.trackingCode,
        sections: [
          { label: "Customer", value: props.customerName },
          { label: "Service family", value: props.serviceFamilyLabel },
          { label: "Service line", value: props.serviceType },
          { label: "Current status", value: props.statusLabel },
        ],
        lists: props.nextSteps.length > 0 ? [{ title: "What this means", items: props.nextSteps }] : [],
        primaryAction: { label: "Track the latest progress", href: props.trackUrl },
        closing: [
          "If you need to change access notes, delivery timing, or support details, reply to this email.",
          "HenryCo Care",
        ],
      };
    }
    case "tracking_code_confirmation": {
      const props = template.props;
      return {
        subject: `Tracking code ready • ${props.trackingCode}`,
        templateKey: template.type,
        preview: `Keep ${props.trackingCode} close for ${props.serviceFamilyLabel.toLowerCase()}.`,
        eyebrow: "Tracking ready",
        title: "Keep this code for live service tracking.",
        intro:
          "Use the tracking code below any time you want to check progress, status movement, or final completion.",
        highlightLabel: "Tracking code",
        highlightValue: props.trackingCode,
        sections: [
          { label: "Customer", value: props.customerName },
          { label: "Service family", value: props.serviceFamilyLabel },
        ],
        primaryAction: { label: "Open tracking", href: props.trackUrl },
        closing: ["HenryCo Care"],
      };
    }
    case "staff_invitation": {
      const props = template.props;
      return {
        subject: `Workspace access setup • ${props.roleLabel}`,
        templateKey: template.type,
        preview: "Set a password and activate your internal HenryCo Care workspace access.",
        eyebrow: "Staff invitation",
        title: "Your HenryCo Care workspace is ready.",
        intro:
          "Use the secure setup link below to create a password and open the correct role-based dashboard.",
        sections: [
          { label: "Name", value: props.staffName },
          { label: "Assigned role", value: props.roleLabel },
          ...(props.invitedBy ? [{ label: "Invited by", value: props.invitedBy }] : []),
          { label: "Secure setup link", value: props.accessUrl },
        ],
        primaryAction: { label: "Open secure setup link", href: props.accessUrl },
        closing: [
          "If the button does not open in your email app, copy the full secure setup link shown above into your browser.",
          "This setup link is sensitive and should only be used by the invited staff member.",
          "HenryCo Care",
        ],
      };
    }
    case "password_recovery": {
      const props = template.props;
      return {
        subject: "Recover your HenryCo Care workspace access",
        templateKey: template.type,
        preview: "Use the secure link below to reset your workspace password.",
        eyebrow: "Access recovery",
        title: "Reset your internal workspace password.",
        intro:
          "A recovery request was submitted for your HenryCo Care staff account. Use the secure link below to set a new password.",
        sections: [
          { label: "Account", value: props.staffName },
          { label: "Secure recovery link", value: props.recoveryUrl },
        ],
        primaryAction: { label: "Reset password", href: props.recoveryUrl },
        closing: [
          "If the button does not open in your email app, copy the full recovery link shown above into your browser.",
          "If you did not request this, ignore the email and inform an owner or support lead.",
          "HenryCo Care",
        ],
      };
    }
    case "payment_request": {
      const props = template.props;
      return {
        subject: `Payment details • ${props.trackingCode}`,
        templateKey: template.type,
        preview: `Payment instructions for booking ${props.trackingCode}.`,
        eyebrow: "Payment request",
        title: "Payment details for your service request.",
        intro:
          "The service has reached a payment checkpoint. The account details and amount due are below. Once the transfer is complete, reply to this same email with the receipt so the team can verify the booking.",
        highlightLabel: "Amount due",
        highlightValue: props.amountDue,
        sections: [
          { label: "Customer", value: props.customerName },
          { label: "Tracking code", value: props.trackingCode },
          { label: "Currency", value: props.currencyLabel },
          { label: "Account name", value: props.accountName },
          { label: "Account number", value: props.accountNumber },
          { label: "Bank", value: props.bankName },
          { label: "Instructions", value: props.instructions },
        ],
        primaryAction: { label: "Track booking", href: props.trackUrl },
        closing: [
          "After making payment, reply to this same email with your receipt and keep the tracking code visible in the thread.",
          "If WhatsApp support is available for this account, you may also send the same proof there as a fallback.",
          "HenryCo Care",
        ],
      };
    }
    case "payment_received": {
      const props = template.props;
      return {
        subject: `Payment received • ${props.trackingCode}`,
        templateKey: template.type,
        preview: "Your payment has been verified successfully.",
        eyebrow: "Payment verified",
        title: "Your payment has been verified.",
        intro:
          "HenryCo Care has confirmed the payment against your booking and updated the account balance for the next operational step.",
        sections: [
          { label: "Customer", value: props.customerName },
          { label: "Tracking code", value: props.trackingCode },
          { label: "Amount received", value: props.amountPaid },
          { label: "Balance due", value: props.balanceDue },
          { label: "Method", value: props.paymentMethod },
          ...(props.reference ? [{ label: "Reference", value: props.reference }] : []),
        ],
        primaryAction: { label: "Track booking", href: props.trackUrl },
        closing: ["Thank you. The service will continue from the verified payment state.", "HenryCo Care"],
      };
    }
    case "payment_receipt_received": {
      const props = template.props;
      return {
        subject: `Receipt received • ${props.trackingCode}`,
        templateKey: template.type,
        preview: "The receipt has been received and moved into manual verification.",
        eyebrow: "Receipt received",
        title: "Your payment proof is under review.",
        intro:
          "The Care desk has received the receipt and moved it into manual verification against the company account before the booking continues.",
        highlightLabel: "Tracking code",
        highlightValue: props.trackingCode,
        sections: [
          { label: "Customer", value: props.customerName },
          { label: "Service line", value: props.serviceType },
          { label: "Expected amount", value: props.amountDue },
        ],
        primaryAction: { label: "Track booking", href: props.trackUrl },
        closing: [
          "You will receive a follow-up as soon as verification is complete.",
          "If you notice an error in the proof, reply to this same email with the corrected receipt.",
          "HenryCo Care",
        ],
      };
    }
    case "payment_proof_update": {
      const props = template.props;
      return {
        subject: `${props.statusLabel} • ${props.trackingCode}`,
        templateKey: template.type,
        preview: "The payment-review team needs a quick update on the submitted proof.",
        eyebrow: "Payment review update",
        title: props.statusLabel,
        intro:
          "The payment-review team checked the submitted proof and sent the guidance below so the booking can keep moving cleanly.",
        highlightLabel: "Tracking code",
        highlightValue: props.trackingCode,
        sections: [
          { label: "Customer", value: props.customerName },
          { label: "Service line", value: props.serviceType },
          { label: "Next step", value: props.message },
        ],
        primaryAction: { label: "Track booking", href: props.trackUrl },
        closing: [
          "Reply to this same email with the corrected proof or any clarification the support team requested.",
          "HenryCo Care",
        ],
      };
    }
    case "review_request": {
      const props = template.props;
      return {
        subject: `Share your HenryCo Care review • ${props.trackingCode}`,
        templateKey: template.type,
        preview: "Your service is complete. Share a verified review if the experience met the standard.",
        eyebrow: "Review request",
        title: "Tell us how the service felt.",
        intro:
          "Only completed bookings can leave a verified review. The form is short, moderation stays internal, and approved comments appear publicly.",
        sections: [
          { label: "Tracking code", value: props.trackingCode },
          { label: "Service family", value: props.serviceFamilyLabel },
          { label: "Service line", value: props.serviceType },
        ],
        primaryAction: { label: "Leave a verified review", href: props.reviewUrl },
        closing: ["Thank you for using HenryCo Care.", "HenryCo Care"],
      };
    }
    case "contact_confirmation": {
      const props = template.props;
      return {
        subject: `We received your message • ${props.threadRef}`,
        templateKey: template.type,
        preview: "HenryCo Care logged the request and assigned a live support reference.",
        eyebrow: "Contact received",
        title: "Your message is now with the Care desk.",
        intro:
          "The support team has received the request and logged it under the reference below so follow-up stays organized.",
        highlightLabel: "Support reference",
        highlightValue: props.threadRef,
        sections: [
          { label: "Contact", value: props.customerName },
          { label: "Subject", value: props.subject },
          { label: "Preferred route", value: props.preferredContactMethod },
          { label: "Service area", value: props.serviceCategoryLabel },
          { label: "Message preview", value: props.messagePreview },
        ],
        primaryAction: { label: "Contact HenryCo Care", href: props.contactUrl },
        closing: [
          "Keep the support reference close if you need to continue the same conversation.",
          "HenryCo Care",
        ],
      };
    }
    case "support_reply": {
      const props = template.props;
      return {
        subject: `HenryCo Care support reply • ${props.threadRef}`,
        templateKey: template.type,
        preview: "A support specialist replied to your HenryCo Care request.",
        eyebrow: "Support reply",
        title: "A Care specialist has replied.",
        intro:
          "The message below comes directly from the HenryCo Care support desk so the next step stays clear and documented.",
        highlightLabel: "Support reference",
        highlightValue: props.threadRef,
        sections: [
          { label: "Original subject", value: props.subject },
          { label: "Reply", value: props.message },
        ],
        primaryAction: { label: "Continue the conversation", href: props.contactUrl },
        closing: [
          "Reply to this email if you need to continue the same request.",
          "HenryCo Care",
        ],
      };
    }
    case "owner_monthly_summary": {
      const props = template.props;
      return {
        subject: `HenryCo Care monthly owner summary • ${props.monthLabel}`,
        templateKey: template.type,
        preview: `Owner summary for ${props.monthLabel}: inflow ${props.inflow}, outflow ${props.outflow}, net ${props.net}.`,
        eyebrow: "Owner monthly summary",
        title: `Division summary for ${props.monthLabel}`,
        intro:
          "This monthly snapshot captures money movement, completed work, outstanding recovery, and the signals that deserve owner attention next.",
        highlightLabel: "Net position",
        highlightValue: props.net,
        sections: [
          { label: "Owner", value: props.ownerName },
          { label: "Recorded inflow", value: props.inflow },
          { label: "Recorded outflow", value: props.outflow },
          { label: "Outstanding customer balance", value: props.outstandingBalance },
          { label: "Bookings logged", value: String(props.bookingsCount) },
          { label: "Bookings delivered", value: String(props.deliveredCount) },
          { label: "Pending expense decisions", value: String(props.pendingExpenseCount) },
        ],
        lists: [
          ...(props.keySignals.length > 0 ? [{ title: "Owner watchlist", items: props.keySignals }] : []),
          ...(props.topExpenseCategories.length > 0
            ? [{ title: "Top expense pressure", items: props.topExpenseCategories }]
            : []),
        ],
        primaryAction: { label: "Open owner finance", href: props.financeUrl },
        closing: ["This summary is generated automatically from live Care operations data.", "HenryCo Care"],
      };
    }
    case "payment_reminder": {
      const props = template.props;
      return {
        subject: `Payment reminder • ${props.trackingCode}`,
        templateKey: template.type,
        preview: `A payment reminder is still open for booking ${props.trackingCode}.`,
        eyebrow: "Payment reminder",
        title: "Your payment reminder is still open.",
        intro:
          "This is a polite reminder that the balance on the service request is still awaiting confirmation. The account details are repeated below for convenience.",
        highlightLabel: "Amount due",
        highlightValue: props.amountDue,
        sections: [
          { label: "Customer", value: props.customerName },
          { label: "Tracking code", value: props.trackingCode },
          { label: "Due checkpoint", value: props.dueLabel },
          { label: "Currency", value: props.currencyLabel },
          { label: "Account name", value: props.accountName },
          { label: "Account number", value: props.accountNumber },
          { label: "Bank", value: props.bankName },
          { label: "Instructions", value: props.instructions },
        ],
        primaryAction: { label: "Track booking", href: props.trackUrl },
        closing: ["Once transfer is complete, reply with payment confirmation so the team can close the balance.", "HenryCo Care"],
      };
    }
    case "service_reminder": {
      const props = template.props;
      return {
        subject: `Plan your next ${props.serviceFamilyLabel.toLowerCase()} visit with HenryCo Care`,
        templateKey: template.type,
        preview: `${props.timingLabel} is usually a good moment to schedule the next ${props.serviceFamilyLabel.toLowerCase()} visit.`,
        eyebrow: "Service reminder",
        title: "A good time to book the next service.",
        intro:
          "Clients who prefer a steady finish usually book before the next rush. We kept this reminder calm, simple, and easy to act on when the timing feels right.",
        sections: [
          { label: "Customer", value: props.customerName },
          { label: "Service family", value: props.serviceFamilyLabel },
          { label: "Service line", value: props.serviceType },
          { label: "Suggested timing", value: props.timingLabel },
          { label: "Recommendation", value: props.recommendation },
        ],
        primaryAction: { label: "Book the next service", href: props.bookUrl },
        secondaryAction: { label: "Pause reminders", href: props.unsubscribeUrl },
        closing: ["If you prefer to pause these reminder emails, use the pause button above.", "HenryCo Care"],
      };
    }
    case "customer_reengagement": {
      const props = template.props;
      return {
        subject: "A quiet HenryCo Care check-in",
        templateKey: template.type,
        preview: "A calm follow-up from HenryCo Care in case you want another pickup, cleaning visit, or premium care slot.",
        eyebrow: "Client follow-up",
        title: "Whenever you are ready, we can take the next one.",
        intro:
          "This is a light follow-up for past clients who may want another pickup, refresh, or service window. No pressure, just a clean route back into the system.",
        sections: [
          { label: "Customer", value: props.customerName },
          { label: "Last service family", value: props.serviceFamilyLabel },
          { label: "Last service line", value: props.serviceType },
          { label: "Care note", value: props.comebackNote },
        ],
        primaryAction: { label: "Book again", href: props.bookUrl },
        secondaryAction: { label: "Pause outreach", href: props.unsubscribeUrl },
        closing: ["If you no longer want these outreach notes, use the pause button above.", "HenryCo Care"],
      };
    }
    case "admin_notification": {
      const props = template.props;
      return {
        subject: props.heading,
        templateKey: template.type,
        preview: props.summary,
        eyebrow: "Internal notification",
        title: props.heading,
        intro: props.summary,
        lists: props.lines.length > 0 ? [{ title: "Details", items: props.lines }] : [],
        primaryAction: props.action ?? null,
        closing: ["This message was generated by HenryCo Care operations."],
      };
    }
  }
}

export function renderCareEmailTemplate(
  template: CareEmailTemplate,
  settings: CareSettingsRecord
): RenderedCareEmail {
  const layout = buildLayout(template);

  return {
    subject: layout.subject,
    templateKey: layout.templateKey,
    html: renderHtml(layout, settings),
    text: renderText(layout, settings),
  };
}
