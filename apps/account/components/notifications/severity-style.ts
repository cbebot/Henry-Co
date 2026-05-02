/**
 * Customer-side severity-style entry point.
 *
 * The implementation now lives in @henryco/notifications-ui so the staff
 * bell (PR-β) and the customer bell stay token-aligned. apps/account
 * binds the customer token scheme (`--acct-*`) once via
 * createSeverityResolver(); all existing call sites continue to import
 * the same names from this module.
 */

import {
  ACCOUNT_NOTIFICATION_TOKENS,
  createSeverityResolver,
  isSafeNotificationDeepLink as isSafeNotificationDeepLinkShared,
  type Division,
  type SeverityStyle,
  type SignalSeverity,
} from "@henryco/notifications-ui";

const resolver = createSeverityResolver(ACCOUNT_NOTIFICATION_TOKENS);

export const resolveSeverity = resolver.resolveSeverity;
export const autoDismissMs = resolver.autoDismissMs;
export const badgeColorVar = resolver.badgeColorVar;
export const highestSeverity = resolver.highestSeverity;
export const divisionAccentVar = resolver.divisionAccentVar;
export const isSafeNotificationDeepLink = isSafeNotificationDeepLinkShared;

export type { Division, SeverityStyle, SignalSeverity };
