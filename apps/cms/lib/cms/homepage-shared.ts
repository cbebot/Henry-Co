/**
 * Client-safe homepage constant, shared by the server data layer
 * (lib/cms/homepage.ts) and the client write layer (homepage-actions.ts).
 * No server-only imports, so it ships safely to the browser.
 */
export const HOME_PAGE_KEY = "home";
