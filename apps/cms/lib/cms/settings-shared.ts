/**
 * Client-safe settings constant, shared by the server data layer
 * (lib/cms/settings.ts) and the client write layer (settings-actions.ts).
 * No server-only imports, so it ships safely to the browser.
 */
export const SETTINGS_ID = "primary" as const;
