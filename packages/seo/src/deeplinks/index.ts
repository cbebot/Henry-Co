/**
 * V3-04 — `@henryco/seo/deeplinks`.
 *
 * The single source of truth for HenryCo deep-link URLs. Notification
 * publishers (`@henryco/notifications`), email templates
 * (`@henryco/email`), and share surfaces (`@henryco/ui` ShareButton)
 * import from here instead of string-concatenating URLs, so the domain
 * stays abstract (`henryDomain()` / `getAccountUrl`) and every link is
 * canonical + crawlable.
 */

export {
  type DeepLinkDivision,
  divisionUrl,
  accountUrl,
  encodeIdSegment,
} from "./targets";

export {
  // account-app customer detail surfaces
  buildCareBookingLink,
  buildInvoiceLink,
  buildSubscriptionLink,
  buildSupportThreadLink,
  buildWalletFundingLink,
  buildWalletWithdrawalsLink,
  buildStudioPaymentLink,
  buildStudioProjectLink,
  buildJobsInterviewLink,
  buildNotificationMessageLink,
  buildVerificationLink,
  // division public / detail surfaces
  buildMarketplaceProductLink,
  buildMarketplaceStoreLink,
  buildMarketplaceOrderLink,
  buildMarketplaceOrderTrackingLink,
  buildMarketplacePayLink,
  buildPropertyListingLink,
  buildJobsRoleLink,
  buildJobsApplicationLink,
  buildLearnCourseLink,
  buildLearnCertificateVerifyLink,
  buildLogisticsTrackingLink,
  // mobile universal-link aliases
  buildCareBookingAppLink,
  buildMarketplaceOrderAppLink,
  buildJobsApplicationAppLink,
  buildLearnCourseAppLink,
  buildPropertyListingAppLink,
} from "./builders";

export {
  type UtmSource,
  type UtmParams,
  withUtm,
  withEmailUtm,
} from "./utm";

export {
  type ShareAttribution,
  SHARE_REF_VALUE,
  SHARE_REF_PARAM,
  SHARE_FROM_PARAM,
  withShareAttribution,
  parseShareAttribution,
  isShareHashShape,
  hashSharerId,
  verifySharerHash,
} from "./share";

export {
  type DeepLinkSource,
  type DeepLinkArrivedPayload,
  type DeepLinkReturnedAfterAuthPayload,
  type DeepLinkDeadLinkPayload,
  type ShareClickedPayload,
  type ShareAttributedInstallPayload,
} from "./telemetry";

export {
  type MobileTarget,
  type AppleAppSiteAssociation,
  type AndroidAssetLink,
  HENRYCO_MOBILE_BUNDLE_IDS,
  buildAppleAppSiteAssociation,
  buildAndroidAssetLinks,
  wellKnownJsonResponse,
} from "./universal-links";
