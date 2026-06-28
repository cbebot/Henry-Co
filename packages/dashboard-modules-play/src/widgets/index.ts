/**
 * Play (Henry Onyx Live) widgets barrel.
 *
 * Each widget is a server-rendered presentation component. The module
 * manifest (`../module.tsx`) wires each widget into a `HomeWidget` entry
 * the shell's home grid renders. `ArenaEntryCard` is the calm
 * flag-dark default; `ArenaStatsCard` / `LeaderboardCard` render only
 * when the arena is enabled and real ranked data exists.
 */

export { ArenaEntryCard } from "./arena-entry-card";
export { ArenaStatsCard } from "./arena-stats-card";
export { LeaderboardCard } from "./leaderboard-card";
