/**
 * @henryco/command-contract — the publish-to-command contract for the Henry
 * Onyx Command Center. Runtime-safe barrel (every module is node-only/pure).
 *
 * See `docs/v3/command-center-architecture.md`. STAGED (V3-COMMAND-02): the only
 * sink is in-memory and the only feed is mock. Live wiring is V3-COMMAND-03.
 */

export * from "./types";
export * from "./errors";
export * from "./state-machine";
export * from "./access";
export * from "./aggregate";
export * from "./publish";
export { mockAttentionFeed } from "./mock/feed";
