"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BRAND_EMAIL_DOMAIN } from "@henryco/config";
import { sendTransactionalEmail } from "@henryco/email";
import { requireOwner } from "@/lib/owner-auth";
import {
  getInboxMessage,
  markInboxRead,
  markInboxUnread,
  setInboxArchived,
} from "@/lib/owner-inbox/repository";

/**
 * Owner-inbox mutations. Every action re-asserts requireOwner() (defense in
 * depth — the writes use the service-role client, which bypasses RLS). Reply
 * uses the existing transactional SENDING path (Postmark — the only
 * outbound rail, EMAIL-POSTMARK 2026-07-14), untouched.
 */

export async function markUnreadAction(formData: FormData): Promise<void> {
  await requireOwner();
  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await markInboxUnread(id);
    revalidatePath("/owner/inbox");
    revalidatePath(`/owner/inbox/${id}`);
  }
  redirect("/owner/inbox");
}

export async function toggleArchiveAction(formData: FormData): Promise<void> {
  await requireOwner();
  const id = String(formData.get("id") ?? "").trim();
  const archived = String(formData.get("archived") ?? "") === "true";
  if (id) {
    await setInboxArchived(id, archived);
    revalidatePath("/owner/inbox");
    revalidatePath(`/owner/inbox/${id}`);
  }
  redirect(archived ? "/owner/inbox" : "/owner/inbox?view=archived");
}

export type ReplyState = { ok: boolean; message: string };

export async function sendReplyAction(
  _prev: ReplyState,
  formData: FormData,
): Promise<ReplyState> {
  const owner = await requireOwner();
  const id = String(formData.get("id") ?? "").trim();
  const bodyText = String(formData.get("body") ?? "").trim();
  if (!id) return { ok: false, message: "Missing message reference." };
  if (!bodyText) return { ok: false, message: "Write a reply before sending." };

  const message = await getInboxMessage(id);
  if (!message) return { ok: false, message: "Could not load the original message." };

  const toAddress = message.replyTo || message.fromAddress;
  if (!toAddress) return { ok: false, message: "The original message has no reply address." };

  // Send FROM the brand address the mail arrived at (SES is authorized for
  // henryonyx.com). If it isn't a brand address, fall back to the support sender.
  const fromBrand = message.toAddress.endsWith(`@${BRAND_EMAIL_DOMAIN}`)
    ? message.toAddress
    : undefined;
  const subject = /^re:/i.test(message.subject) ? message.subject : `Re: ${message.subject}`;

  const result = await sendTransactionalEmail({
    to: toAddress,
    subject,
    text: bodyText,
    from: fromBrand,
    replyTo: fromBrand,
    purpose: "support",
  });

  if (result.status === "sent") {
    await markInboxRead(id, owner.id);
    revalidatePath(`/owner/inbox/${id}`);
    return { ok: true, message: `Reply sent to ${toAddress}.` };
  }
  if (result.status === "skipped") {
    return { ok: false, message: result.skippedReason || "No email provider is configured." };
  }
  return { ok: false, message: result.safeError || "Could not send the reply. Try again." };
}
