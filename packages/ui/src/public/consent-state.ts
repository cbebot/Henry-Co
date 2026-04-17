import { getSharedCookieDomain } from "@henryco/config";

export const HENRYCO_LEGACY_CONSENT_STORAGE_KEY = "henryco-care-cookie-consent";
export const HENRYCO_LEGACY_CONSENT_COOKIE_KEY = "henryco_care_cookie_consent";
export const HENRYCO_CONSENT_STORAGE_KEY = "henryco-ecosystem-consent";
export const HENRYCO_CONSENT_COOKIE_KEY = "henryco_ecosystem_consent";
export const HENRYCO_CONSENT_UPDATED_EVENT = "henryco:consent-updated";

export type HenryCoConsentState = {
  essential: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  personalizedExperience: boolean;
  updatedAt: string;
};

export const DEFAULT_HENRYCO_CONSENT: HenryCoConsentState = {
  essential: true,
  preferences: false,
  analytics: false,
  marketing: false,
  personalizedExperience: false,
  updatedAt: "",
};

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function buildHenryCoConsentState(
  value?: Partial<Omit<HenryCoConsentState, "essential">> | null
) {
  return {
    essential: true as const,
    preferences: Boolean(value?.preferences),
    analytics: Boolean(value?.analytics),
    marketing: Boolean(value?.marketing),
    personalizedExperience: Boolean(value?.personalizedExperience),
    updatedAt: typeof value?.updatedAt === "string" ? value.updatedAt : "",
  } satisfies HenryCoConsentState;
}

export function readHenryCoCookie(name: string, cookieSource?: string) {
  const source = cookieSource ?? (isBrowser() ? document.cookie : "");
  if (!source) return undefined;

  const prefix = `${name}=`;
  return source
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
}

function parseConsent(raw?: string | null) {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<HenryCoConsentState>;
    return buildHenryCoConsentState(parsed);
  } catch {
    return null;
  }
}

function dispatchConsentUpdated(value: HenryCoConsentState) {
  if (!isBrowser()) return;

  window.dispatchEvent(
    new CustomEvent<HenryCoConsentState>(HENRYCO_CONSENT_UPDATED_EVENT, {
      detail: value,
    })
  );
}

export function persistHenryCoConsent(value: HenryCoConsentState, host: string) {
  if (!isBrowser()) return;

  const serialized = JSON.stringify(value);
  window.localStorage.setItem(HENRYCO_CONSENT_STORAGE_KEY, serialized);

  const domain = getSharedCookieDomain(host);
  const domainPart = domain ? `; domain=${domain}` : "";
  document.cookie = `${HENRYCO_CONSENT_COOKIE_KEY}=${encodeURIComponent(serialized)}; path=/; max-age=31536000; samesite=lax${domainPart}`;

  dispatchConsentUpdated(value);
}

function clearLegacyConsentArtifacts() {
  if (!isBrowser()) return;

  window.localStorage.removeItem(HENRYCO_LEGACY_CONSENT_STORAGE_KEY);
  document.cookie = `${HENRYCO_LEGACY_CONSENT_COOKIE_KEY}=; path=/; max-age=0`;
}

export function migrateLegacyHenryCoConsent(host?: string | null) {
  if (!isBrowser()) return null;

  const local = window.localStorage.getItem(HENRYCO_LEGACY_CONSENT_STORAGE_KEY);
  const cookie = readHenryCoCookie(HENRYCO_LEGACY_CONSENT_COOKIE_KEY);
  const raw = local || (cookie ? decodeURIComponent(cookie) : "");
  const parsed = parseConsent(raw);

  if (!parsed) return null;

  const migrated = buildHenryCoConsentState({
    ...parsed,
    updatedAt: parsed.updatedAt || new Date().toISOString(),
  });
  persistHenryCoConsent(migrated, host || window.location.hostname);
  clearLegacyConsentArtifacts();

  return migrated;
}

export function readStoredHenryCoConsent() {
  if (!isBrowser()) return null;

  const migrated = migrateLegacyHenryCoConsent(window.location.hostname);
  if (migrated) {
    return migrated;
  }

  const local = window.localStorage.getItem(HENRYCO_CONSENT_STORAGE_KEY);
  const cookie = readHenryCoCookie(HENRYCO_CONSENT_COOKIE_KEY);
  return parseConsent(local || (cookie ? decodeURIComponent(cookie) : ""));
}

export function consentAllowsAnalytics(consent?: HenryCoConsentState | null) {
  return Boolean(consent?.analytics);
}

export function consentAllowsMarketing(consent?: HenryCoConsentState | null) {
  return Boolean(consent?.marketing);
}
