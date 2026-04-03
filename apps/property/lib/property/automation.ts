import "server-only";

import { sendPropertyEvent } from "@/lib/property/notifications";
import { readPropertyRuntimeSnapshot } from "@/lib/property/store";

function hoursBetween(now: Date, value?: string | null) {
  if (!value) return 0;
  const then = new Date(value);
  return (now.getTime() - then.getTime()) / (1000 * 60 * 60);
}

export async function runPropertyAutomationSweep(now = new Date()) {
  const snapshot = await readPropertyRuntimeSnapshot();
  let staleInquiryAlerts = 0;
  let viewingReminders = 0;

  for (const inquiry of snapshot.inquiries) {
    if (inquiry.status === "closed") continue;
    if (hoursBetween(now, inquiry.updatedAt || inquiry.createdAt) < 12) continue;

    await sendPropertyEvent({
      event: "owner_alert",
      recipientEmail: process.env.RESEND_SUPPORT_INBOX || "property@henrycogroup.com",
      entityType: "property_inquiry",
      entityId: inquiry.id,
      payload: {
        listingTitle:
          snapshot.listings.find((item) => item.id === inquiry.listingId)?.title || "Property inquiry",
        note: `Inquiry ${inquiry.id.slice(0, 8)} has been open for more than 12 hours.`,
      },
    });

    staleInquiryAlerts += 1;
  }

  for (const viewing of snapshot.viewingRequests) {
    if (viewing.status !== "scheduled" || !viewing.scheduledFor) continue;
    const reminderWindow = hoursBetween(new Date(viewing.scheduledFor), now.toISOString());
    if (reminderWindow > 24 || reminderWindow < 0) continue;

    await sendPropertyEvent({
      event: "viewing_reminder",
      userId: viewing.userId,
      normalizedEmail: viewing.normalizedEmail,
      recipientEmail: viewing.attendeeEmail,
      recipientPhone: viewing.attendeePhone,
      entityType: "property_viewing_request",
      entityId: viewing.id,
      payload: {
        listingTitle:
          snapshot.listings.find((item) => item.id === viewing.listingId)?.title || "Property viewing",
        viewingTime: viewing.scheduledFor,
      },
    });

    viewingReminders += 1;
  }

  return {
    staleInquiryAlerts,
    viewingReminders,
    executedAt: now.toISOString(),
  };
}
