export { PublicHeader } from "./public-header";
export type { PublicHeaderProps, PublicHeaderBrand, PublicNavItem } from "./public-header";

export { ConfiguredPublicHeader } from "./configured-public-header";

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
export { PublicPageSkeleton } from "./public-page-skeleton";
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
export { PublicProofRail } from "./public-proof-rail";
export type { PublicProofRailProps, PublicProofItem } from "./public-proof-rail";
export {
  PublicToastProvider,
  usePublicToast,
  makePublicToastApi,
} from "./public-toast";
export type { PublicToastInput, PublicToastTone } from "./public-toast";
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
