import "server-only";

import { sendPropertyEvent } from "@/lib/property/notifications";
import {
  readPropertyRuntimeSnapshot,
  upsertPropertyViewingRequest,
} from "@/lib/property/store";
import type { PropertyViewingRequest } from "@/lib/property/types";

/**
 * V3 PASS 21 — viewing reminder cycle.
 *
 * Property viewings are scheduled with `scheduledFor` in the future. We
 * want two reminder events:
 *
 *   24h before the appointment — "your viewing is tomorrow"
 *    1h before the appointment — "your viewing is in an hour"
 *
 * Each reminder fires at most once per viewing. The cron is idempotent:
 * it reads `reminder_24h_sent_at` / `reminder_1h_sent_at` to decide
 * whether the reminder is still due.
 *
 * The function also enforces the waitlist contract: if a `scheduled` /
 * `confirmed` viewing transitions to `cancelled` and a waitlisted entry
 * exists, the cron promotes the next waitlist row (in `requested`
 * status with the lowest waitlist_position).
 *
 * Inputs / outputs:
 *
 *   runViewingReminderSweep(now) →
 *     {
 *       reminders24hSent: number,
 *       reminders1hSent: number,
 *       waitlistPromotions: number,
 *     }
 *
 * `now` is injected so unit tests can pin the clock.
 */

function hoursUntil(target: string | null, now: Date) {
  if (!target) return Number.POSITIVE_INFINITY;
  const targetTime = new Date(target).getTime();
  if (!Number.isFinite(targetTime)) return Number.POSITIVE_INFINITY;
  return (targetTime - now.getTime()) / (1000 * 60 * 60);
}

const TWENTY_FOUR_HOUR_WINDOW = { min: 22, max: 25 };
const ONE_HOUR_WINDOW = { min: 0.5, max: 1.5 };

export async function runViewingReminderSweep(now = new Date()) {
  const snapshot = await readPropertyRuntimeSnapshot();
  let reminders24hSent = 0;
  let reminders1hSent = 0;

  for (const viewing of snapshot.viewingRequests) {
    if (!["scheduled", "confirmed"].includes(viewing.status)) continue;
    if (!viewing.scheduledFor) continue;

    const hours = hoursUntil(viewing.scheduledFor, now);
    if (!Number.isFinite(hours) || hours < 0) continue;

    const listing = snapshot.listings.find((l) => l.id === viewing.listingId);
    const listingTitle = listing?.title || "your viewing";

    // 24h reminder.
    if (
      !viewing.reminder24hSentAt &&
      hours >= TWENTY_FOUR_HOUR_WINDOW.min &&
      hours <= TWENTY_FOUR_HOUR_WINDOW.max
    ) {
      await sendPropertyEvent({
        event: "viewing_reminder",
        userId: viewing.userId,
        normalizedEmail: viewing.normalizedEmail,
        recipientEmail: viewing.attendeeEmail,
        recipientPhone: viewing.attendeePhone,
        entityType: "property_viewing_request",
        entityId: viewing.id,
        payload: {
          listingTitle,
          viewingTime: viewing.scheduledFor,
          reminderCycle: "24h",
        },
      });

      await upsertPropertyViewingRequest({
        ...viewing,
        reminder24hSentAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
      reminders24hSent += 1;
      continue;
    }

    // 1h reminder.
    if (
      !viewing.reminder1hSentAt &&
      hours >= ONE_HOUR_WINDOW.min &&
      hours <= ONE_HOUR_WINDOW.max
    ) {
      await sendPropertyEvent({
        event: "viewing_reminder",
        userId: viewing.userId,
        normalizedEmail: viewing.normalizedEmail,
        recipientEmail: viewing.attendeeEmail,
        recipientPhone: viewing.attendeePhone,
        entityType: "property_viewing_request",
        entityId: viewing.id,
        payload: {
          listingTitle,
          viewingTime: viewing.scheduledFor,
          reminderCycle: "1h",
        },
      });

      await upsertPropertyViewingRequest({
        ...viewing,
        reminder1hSentAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
      reminders1hSent += 1;
    }
  }

  // Waitlist promotion: when a viewing on a listing is cancelled and
  // there is a waitlisted viewing on the same listing, promote the
  // lowest-position waitlist row to `requested` so an operator can
  // schedule it. We never schedule waitlist rows automatically — that
  // is an operator decision — but moving from `waitlisted` to
  // `requested` surfaces them in the standard queue.
  const cancellationsByListing = new Map<string, PropertyViewingRequest>();
  for (const viewing of snapshot.viewingRequests) {
    if (viewing.status === "cancelled") {
      const existing = cancellationsByListing.get(viewing.listingId);
      if (!existing || existing.updatedAt < viewing.updatedAt) {
        cancellationsByListing.set(viewing.listingId, viewing);
      }
    }
  }

  let waitlistPromotions = 0;
  for (const [listingId, cancellation] of cancellationsByListing.entries()) {
    const cancelledAt = new Date(cancellation.updatedAt).getTime();
    if (Number.isFinite(cancelledAt) && now.getTime() - cancelledAt > 6 * 60 * 60 * 1000) {
      continue; // Older than 6h — assume already handled.
    }

    const waitlistedRows = snapshot.viewingRequests
      .filter(
        (row) =>
          row.listingId === listingId &&
          row.status === "waitlisted" &&
          row.waitlistPosition !== null
      )
      .sort((a, b) => (a.waitlistPosition ?? 0) - (b.waitlistPosition ?? 0));

    const next = waitlistedRows[0];
    if (!next) continue;

    await upsertPropertyViewingRequest({
      ...next,
      status: "requested",
      waitlistPosition: null,
      updatedAt: now.toISOString(),
    });

    const listing = snapshot.listings.find((l) => l.id === listingId);
    await sendPropertyEvent({
      event: "viewing_requested",
      userId: next.userId,
      normalizedEmail: next.normalizedEmail,
      recipientEmail: next.attendeeEmail,
      recipientPhone: next.attendeePhone,
      entityType: "property_viewing_request",
      entityId: next.id,
      payload: {
        listingTitle: listing?.title || "Property viewing",
        viewingTime: next.preferredDate,
        promotionFromWaitlist: true,
      },
    });
    waitlistPromotions += 1;
  }

  return {
    reminders24hSent,
    reminders1hSent,
    waitlistPromotions,
  };
}
