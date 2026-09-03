"use client";

/**
 * V3-FEEDBACK-01: swipe-to-dismiss moved to `@henryco/ui/feedback` so the
 * shared action-feedback card and this shell's toast cards share ONE
 * gesture implementation. Re-exported here so existing imports keep working.
 */
export { useToastSwipe, type ToastSwipe } from "@henryco/ui/feedback";
