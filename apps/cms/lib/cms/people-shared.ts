/**
 * Client-safe People constants, shared by the server data layer (lib/cms/people.ts)
 * and the client editor (PersonEditor.tsx). No server-only imports, so it ships
 * safely to the browser.
 */
export const PERSON_KINDS = ["owner", "leadership", "team", "manager"] as const;
