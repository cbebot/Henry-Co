import "server-only";

import { BRAND_EMAILS } from "@henryco/config";
import { sendPropertyEvent } from "@/lib/property/notifications";
import { runSavedSearchAlertSweep } from "@/lib/property/saved-searches";
import { readPropertyRuntimeSnapshot } from "@/lib/property/store";
import { runViewingReminderSweep } from "@/lib/property/viewing-reminders";

function hoursBetween(now: Date, value?: string | null) {
  if (!value) return 0;
  const then = new Date(value);
  return (now.getTime() - then.getTime()) / (1000 * 60 * 60);
}

/**
 * V3 PASS 21 — property automation cron sweep.
 *
 * Composes four idempotent sub-sweeps:
 *
 *   1. Stale inquiry alert — pings the support inbox when an inquiry is
 *      open for more than 12 hours.
 *
 *   2. Viewing reminder cycle — fires 24h-before and 1h-before reminders
 *      via `runViewingReminderSweep`. Also promotes waitlist entries
 *      when a scheduled viewing is cancelled.
 *
 *   3. Saved-search alerts — `runSavedSearchAlertSweep` enforces the
 *      cadence floor (instant ≥ 30 min, daily ≥ 22h, weekly ≥ 6d12h).
 *
 *   4. Stale listing alert — listings without an inquiry in 60 days
 *      route an owner_alert email asking the owner whether to refresh
 *      or withdraw.
 */
export async function runPropertyAutomationSweep(now = new Date()) {
  const snapshot = await readPropertyRuntimeSnapshot();
  let staleInquiryAlerts = 0;
  let staleListingAlerts = 0;

  for (const inquiry of snapshot.inquiries) {
    if (inquiry.status === "closed") continue;
    if (hoursBetween(now, inquiry.updatedAt || inquiry.createdAt) < 12) continue;

    await sendPropertyEvent({
      event: "owner_alert",
      recipientEmail: process.env.RESEND_SUPPORT_INBOX || BRAND_EMAILS.property,
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

  const viewingSweep = await runViewingReminderSweep(now);
  const savedSearchSweep = await runSavedSearchAlertSweep(now);

  // Stale listing alert (60 days no inquiry).
  const SIXTY_DAYS_HOURS = 60 * 24;
  for (const listing of snapshot.listings) {
    if (!["approved", "published"].includes(listing.status)) continue;
    const hoursSinceListed = hoursBetween(now, listing.listedAt);
    if (hoursSinceListed < SIXTY_DAYS_HOURS) continue;
    const latestInquiry = snapshot.inquiries
      .filter((inquiry) => inquiry.listingId === listing.id)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
    if (latestInquiry && hoursBetween(now, latestInquiry.createdAt) < SIXTY_DAYS_HOURS) {
      continue;
    }
    if (!listing.ownerEmail) continue;

    await sendPropertyEvent({
      event: "owner_alert",
      userId: listing.ownerUserId,
      normalizedEmail: listing.normalizedEmail,
      recipientEmail: listing.ownerEmail,
      entityType: "property_listing",
      entityId: listing.id,
      payload: {
        listingTitle: listing.title,
        note: "Your listing has not received an inquiry in the last 60 days. Consider refreshing photos, lowering price, or withdrawing.",
      },
    });
    staleListingAlerts += 1;
  }

  return {
    staleInquiryAlerts,
    viewingReminders: viewingSweep.reminders24hSent + viewingSweep.reminders1hSent,
    reminders24hSent: viewingSweep.reminders24hSent,
    reminders1hSent: viewingSweep.reminders1hSent,
    waitlistPromotions: viewingSweep.waitlistPromotions,
    savedSearchAlerts: savedSearchSweep.sent,
    savedSearchSkipped: savedSearchSweep.skipped,
    savedSearchEvaluated: savedSearchSweep.evaluated,
    staleListingAlerts,
    executedAt: now.toISOString(),
  };
}
