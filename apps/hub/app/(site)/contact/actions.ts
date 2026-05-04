"use server";

import { sendTransactionalEmail } from "@henryco/email";
import { COMPANY } from "@henryco/config";

export type ContactSubmitState = {
  status: "idle" | "success" | "error";
  message: string;
};

const REASONS = new Set([
  "general",
  "partnerships",
  "media",
  "supplier",
  "investor",
  "complaint",
  "other",
]);

function cleanText(value: FormDataEntryValue | null, max = 4000): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function isLikelyEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Server action for the company contact form (CHROME-01B FIX 3). Routes
 * through the shared transactional email provider so the message lands
 * in the configured group inbox; falls back to a friendly error when the
 * provider is unavailable so the user is not left guessing.
 */
export async function submitContactMessage(
  _prev: ContactSubmitState,
  formData: FormData
): Promise<ContactSubmitState> {
  const name = cleanText(formData.get("name"), 200);
  const email = cleanText(formData.get("email"), 320);
  const reasonRaw = cleanText(formData.get("reason"), 80).toLowerCase();
  const message = cleanText(formData.get("message"), 4000);

  if (!name || name.length < 2) {
    return { status: "error", message: "Please enter your name." };
  }
  if (!email || !isLikelyEmail(email)) {
    return {
      status: "error",
      message: "Please enter a valid email so we can reply.",
    };
  }
  const reason = REASONS.has(reasonRaw) ? reasonRaw : "general";
  if (!message || message.length < 10) {
    return {
      status: "error",
      message: "Please add a short note (at least a sentence or two).",
    };
  }

  const supportEmail = COMPANY.group.supportEmail;
  const subject = `[Hub contact · ${reason}] ${name}`;

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeReason = escapeHtml(reason);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");

  const html = `
    <p><strong>From:</strong> ${safeName} &lt;${safeEmail}&gt;</p>
    <p><strong>Reason:</strong> ${safeReason}</p>
    <p>${safeMessage}</p>
  `;
  const text = `From: ${name} <${email}>\nReason: ${reason}\n\n${message}`;

  const dispatch = await sendTransactionalEmail({
    to: supportEmail,
    subject,
    html,
    text,
    purpose: "support",
    replyTo: email,
    fromName: "Henry & Co. Hub",
  }).catch(() => ({
    status: "error" as const,
    provider: "none" as const,
    safeError: "Email send failed.",
  }));

  if (dispatch.status === "sent") {
    return {
      status: "success",
      message:
        "Thanks — your message is in. The company team replies within one business day.",
    };
  }

  if (dispatch.status === "skipped") {
    return {
      status: "error",
      message: `The form is paused right now. Please email ${supportEmail} directly and we will reply.`,
    };
  }

  return {
    status: "error",
    message: `Something went wrong sending your note. Please email ${supportEmail} directly.`,
  };
}
