/**
 * @henryco/command-surface — the "Onyx operations console" UI shared by the
 * staged Owner Command Center (`apps/command`) and Staff Workspace (`apps/work`).
 * Dense, dark-first, on the locked Henry Onyx design family. Import the design
 * tokens once per app: `@import "@henryco/command-surface/tokens.css"`.
 */

export * from "./format";
export * from "./primitives";
export { AttentionCard } from "./AttentionCard";
export { AttentionFeed } from "./AttentionFeed";
export { ConsoleShell } from "./ConsoleShell";
export { SessionSwitcher } from "./SessionSwitcher";
export { NoAccess } from "./NoAccess";
