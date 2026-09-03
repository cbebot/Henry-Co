import "server-only";

import {
  renderHenryCoEmail,
  renderHenryCoEmailText,
  resolveRecipientLocale,
  sendTransactionalEmail,
  type HenryCoEmailLayout,
} from "@henryco/email";
import { getBusinessCopy, formatBusinessTemplate } from "@henryco/i18n/server";
import type { AppLocale } from "@henryco/i18n";
import { createAdminSupabase } from "@/lib/supabase";
import type { BusinessRole } from "@/lib/business";

/**
 * V3-57 — business-team invitation email.
 *
 * Localized through the surface:business copy (UI strings) with the tokenized
 * accept link carried verbatim as data. Uses purpose 'auth' (Resend/DKIM rail)
 * since this is a tokenized account-link flow. Never throws — returns the
 * dispatch status so the caller can decide whether to surface a soft failure.
 */
export async function sendBusinessInvitationEmail(input: {
  to: string;
  businessName: string;
  role: Exclude<BusinessRole, "owner">;
  acceptUrl: string;
  expiresAt: string;
}): Promise<"sent" | "skipped" | "error"> {
  let admin;
  try {
    admin = createAdminSupabase();
  } catch {
    return "error";
  }

  const locale = (await resolveRecipientLocale(admin as never, { email: input.to })) as AppLocale;
  const copy = getBusinessCopy(locale);
  const roleLabel = copy.roles[input.role];
  const expiryDate = formatExpiry(input.expiresAt, locale);

  const layout: HenryCoEmailLayout = {
    purpose: "auth",
    locale,
    subject: formatBusinessTemplate(copy.invitationEmail.subject, { business: input.businessName }),
    eyebrow: copy.common.business,
    title: formatBusinessTemplate(copy.invitationEmail.heading, { business: input.businessName }),
    intro: formatBusinessTemplate(copy.invitationEmail.body, {
      business: input.businessName,
      role: roleLabel,
    }),
    actionLabel: copy.invitationEmail.cta,
    actionHref: input.acceptUrl,
    footnote: `${formatBusinessTemplate(copy.invitationEmail.expiry, { date: expiryDate })} ${copy.invitationEmail.ignore}`,
  };

  const dispatch = await sendTransactionalEmail({
    to: input.to,
    purpose: "auth",
    subject: layout.subject,
    html: renderHenryCoEmail(layout),
    text: renderHenryCoEmailText(layout),
  });
  return dispatch.status;
}

function formatExpiry(iso: string, locale: AppLocale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}
