/**
 * @henryco/gaming-arena — client-safe barrel (`@henryco/gaming-arena`).
 *
 * Pure types + pure rules + the provably-fair VERIFIER + state machine + Elo.
 * Imports NOTHING server-only — so the client can render, locally predict using
 * the exact same rules the server runs authoritatively, and a third party can
 * verify a finished match. The authoritative EXECUTION (which seed, which move
 * is accepted, what is persisted) lives behind `@henryco/gaming-arena/server`
 * and is deliberately NOT re-exported here, so `server-only` stays out of client
 * bundles (the moderation/kyc boundary discipline).
 */

export * from "./types";
export * from "./errors";

// fairness (pure, Web Crypto — client + server + verifier)
export * from "./fairness/web-crypto";
export * from "./fairness/prng";
export * from "./fairness/commit-reveal";

// rules
export * from "./state/state-machine";
export * from "./rating/elo";

// catalog + games (pure)
export * from "./catalog/index";
export * from "./catalog/onyx-lines";
export * from "./catalog/onyx-cards";

// pure view redaction (server applies before sending state to a participant)
export * from "./view/redact";
