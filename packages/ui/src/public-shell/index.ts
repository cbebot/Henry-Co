export { PublicHeader } from "./public-header";
export type { PublicHeaderProps, PublicHeaderBrand, PublicNavItem } from "./public-header";

export { PublicChrome } from "./public-chrome";
export type {
  PublicChromeProps,
  PublicChromeBrand,
  PublicChromeNavItem,
  PublicChromeAccount,
} from "./public-chrome";

export { ConfiguredPublicHeader } from "./configured-public-header";

export { createDivisionPublicThemeStyle } from "./division-public-theme";
export type { DivisionPublicThemeOptions } from "./division-public-theme";

export { PublicAccountChip } from "../public/public-account-chip";
export { HenryCoPublicAccountPresets } from "../public/henryco-account-chip-presets";
export { PublicAccountChip as AccountChip } from "../public/public-account-chip";
export type {
  PublicAccountUser,
  PublicAccountMenuLink,
  PublicAccountMenuAction,
  PublicAccountMenuItem,
} from "../public/public-account-chip";

export { AccountDropdown } from "./account-dropdown";

export { PublicRouteLoader } from "./public-route-loader";
export { LaunchInterceptor } from "./launch-interceptor";
export type { LaunchDivision } from "./launch-interceptor";
export {
  LaunchTransitionProvider,
  useLaunchTransition,
} from "./launch-transition";
export type { LaunchTarget } from "./launch-transition";
export { PublicPageSkeleton } from "./public-page-skeleton";
export { PublicHomeSkeleton } from "./public-home-skeleton";
export { PublicShellLayout } from "./public-shell-layout";
export { PublicThemeGuard } from "./public-theme-guard";
export { PublicBrandLoader } from "./public-brand-loader";
export { AvatarFallback, getInitials } from "./avatar-fallback";
export { PublicEmptyState, PublicErrorState } from "./public-empty-state";

export {
  usePublicSession,
  useOptionalPublicSession,
  PublicSessionProvider,
} from "./use-public-session";
export type { PublicSessionState } from "./use-public-session";

export { PublicFooter } from "../public/public-footer";
export { ThemeToggle } from "../public/theme-toggle";
export { EcosystemPreferences } from "../public/ecosystem-preferences";
export { HenryCoPublicRouteLoading, HenryCoPublicInlineLoading, HenryCoPublicContentSkeleton } from "../public/public-route-loading";
export { ThirdPartyRuntimeProviders, useHenryCoVisitorData } from "./third-party-runtime-providers";
export { ConsentNotice } from "./consent-notice";
export { LocaleSuggestion } from "./locale-suggestion";

export * from "./navigation";
export { HenryCoPublicSurfaceTokens } from "./surface-tokens";
export {
  PublicMotionTokens,
  PublicSpacingTokens,
  PublicHeaderActions,
  PublicSearchSlot,
  PublicStatusStrip,
  PublicSurface,
  PublicHeaderGuard,
} from "./public-standard";
export type { PublicMenuItem, PublicMenuSection } from "./public-standard";

export {
  PublicDesignTokens,
  PublicBrandTokens,
  PublicTypographyTokens,
  PublicRadiusTokens,
  PublicElevationTokens,
  PublicFocusTokens,
  PublicSafeAreaTokens,
  PublicSurfaceStyles,
} from "./public-tokens";
export type { PublicDesignTokensNamespace } from "./public-tokens";

export { PublicCard, PublicCardGrid, PublicCardHeader } from "./public-card";
export { PublicBadge, PublicStatusDot } from "./public-badge";
export { SellerTierBadge } from "./seller-tier-badge";
export type { SellerTier } from "./seller-tier-badge";
export {
  PublicField,
  PublicLabel,
  PublicInput,
  PublicTextarea,
  PublicSelect,
  PublicFormStack,
  PublicFormActions,
} from "./public-form";
export { PublicHero, PublicHeroActions } from "./public-hero";
export { PublicSpotlight } from "./public-spotlight";
export type { PublicSpotlightProps } from "./public-spotlight";
export { HenryCoHeroCard, HenryCoTactileCard } from "./henryco-hero-card";
export type { HenryCoHeroCardProps } from "./henryco-hero-card";
export { PublicProofRail } from "./public-proof-rail";
export type { PublicProofRailProps, PublicProofItem } from "./public-proof-rail";
// V3-FEEDBACK-01: the dormant PublicToastProvider is retired — the shared
// action-feedback system lives at @henryco/ui/feedback (`toast.*` + the
// FeedbackToastViewport that PublicThemeGuard mounts).
export {
  FeedbackToastViewport,
  toast,
  useInterfaceSoundsEnabled,
  setInterfaceSoundsEnabled,
  type FeedbackToastInput,
  type FeedbackToastTone,
} from "../feedback";
export { PublicEyebrow, PublicDivider, PublicBrandMark, PublicTrustStrip } from "./public-micro";
export { HenryCoBrandedSpinner } from "../loading/HenryCoBrandedSpinner";

export { PublicThemeProvider, PublicLocaleProvider, PublicPreferencesProvider } from "./public-providers";
export {
  CrossDivisionSearchExperience,
  HenryCoSearchBreadcrumb,
} from "../search/CrossDivisionSearchExperience";

/** Mobile navigation drawer lives inside `PublicHeader`; this type marks the contract as centralized. */
export type PublicMobileMenu = { readonly embeddedIn: "PublicHeader" };

export { HenryCoErrorFallback, HenryCoNotFound } from "./error-fallback";
