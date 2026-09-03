import { Gamepad2 } from "lucide-react";
import {
  viewerCanUseCustomerSurface,
  type DashboardModule,
  type HomeWidget,
  type PaletteEntry,
  type NotificationCategory,
  type RoleDecision,
  type RouteEntry,
  type EmptyTeaching,
} from "@henryco/dashboard-shell";

import { ArenaEntryCard, ArenaStatsCard, LeaderboardCard } from "./widgets";
import { loadPlaySnapshot, hasRankedContent } from "./data";

/**
 * The play module — slug `play`. Division "Henry Onyx Live".
 *
 * Eligibility mirrors the live page
 * (`apps/account/app/(account)/play/page.tsx`), which gates on
 * `requireAccountUser()` — i.e. ANY authenticated viewer of the customer
 * surface. So `getRoleGate` allows every customer-surface viewer
 * (matching the marketplace/wallet modules' `viewerCanUseCustomerSurface`
 * intent). The page never 404s or hides on the flag; it renders a
 * practice/learn foyer when the arena is dark.
 *
 * FLAG-DARK BY DEFAULT. Production leaves the gaming arena off:
 *   - `apps/account/lib/navigation.ts` hides the `/play` nav entry unless
 *     `NEXT_PUBLIC_GAMING_ARENA_ENABLED` is "1"/"true".
 *   - The page only loads `getPlayModuleData` when `isGamingArenaReady()`
 *     (the server capability — flag AND persistence configured).
 *
 * This module reproduces that capability gate in its data layer
 * (`isPlayArenaReady`): when the arena is dark — the production default —
 * `getHomeWidgets` returns ONE calm, honest entry-point widget
 * (`ArenaEntryCard`) with no metrics, and no live tables are touched.
 * When the owner flips the flag and the viewer has a ranked profile, the
 * real `ArenaStatsCard` + `LeaderboardCard` widgets surface live data
 * from `gaming_profiles` and the `get_gaming_leaderboard` RPC.
 */
export const playModule: DashboardModule = {
  slug: "play",
  title: "Henry Onyx Live",
  description:
    "Free-play arena — practice vs AI, learn the games, ranked profile and leaderboard.",
  icon: () => <Gamepad2 size={18} aria-hidden />,
  railSlot: "secondary",
  // The arena's real surface is the top-level `/play` foyer (practice +
  // learn ship with no server; live multiplayer lights up with the flag).
  // Send the rail / mobile drawer / Cmd-jump straight there in one tap.
  homeHref: "/play",

  getEligibleViewer(viewer) {
    return viewerCanUseCustomerSurface(viewer) ? "allowed" : "hidden";
  },

  getRoleGate(viewer): RoleDecision | null {
    if (!viewerCanUseCustomerSurface(viewer)) return null;
    return { kind: "allow", role: viewer.role };
  },

  async getHomeWidgets(viewer): Promise<ReadonlyArray<HomeWidget>> {
    const snapshot = await loadPlaySnapshot(viewer).catch(() => null);

    // Real ranked widgets — only when the arena is enabled AND the viewer
    // has real content (a profile or a populated leaderboard). Never
    // fabricated zeros.
    if (snapshot && hasRankedContent(snapshot)) {
      const widgets: HomeWidget[] = [];

      if (snapshot.profile) {
        const profile = snapshot.profile;
        widgets.push({
          id: "play.stats",
          source: "play",
          title: "Your arena record",
          size: "md",
          weight: 60,
          href: "/play",
          render: async () => <ArenaStatsCard profile={profile} />,
        });
      }

      if (snapshot.leaderboard.length > 0) {
        widgets.push({
          id: "play.leaderboard",
          source: "play",
          title: "Leaderboard",
          size: "md",
          weight: 45,
          href: "/play",
          render: async () => (
            <LeaderboardCard leaderboard={snapshot.leaderboard} />
          ),
        });
      }

      return widgets;
    }

    // Flag-dark default (and non-customer viewers): a single calm,
    // honest entry-point widget — explicitly NOT fake metrics.
    return [
      {
        id: "play.entry",
        source: "play",
        title: "Henry Onyx Live",
        size: "md",
        weight: 35,
        href: "/play",
        render: async () => <ArenaEntryCard />,
      },
    ];
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "", kind: "home", label: "Henry Onyx Live" },
      { path: "practice", kind: "detail", label: "Practice vs AI" },
      { path: "fair-play", kind: "detail", label: "Provably fair" },
      { path: "verify", kind: "detail", label: "Verify a match" },
      {
        path: "[matchId]",
        kind: "detail",
        label: "Match",
        params: ["matchId"],
      },
    ];
  },

  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    // Every entry deep-links to a live top-level `/play` surface. These
    // surfaces (foyer, practice, fairness proof) ship regardless of the
    // arena flag — practice + learn need no server — so a picked entry
    // never 404s.
    return [
      {
        id: "play.open",
        source: "play",
        label: "Open Henry Onyx Live",
        kicker: "Play",
        groupLabel: "Open",
        href: "/play",
        keywords: ["play", "arena", "games", "onyx", "live", "gaming"],
      },
      {
        id: "play.practice",
        source: "play",
        label: "Practice vs AI",
        kicker: "Play",
        groupLabel: "Create",
        href: "/play/practice",
        keywords: ["practice", "ai", "train", "solo", "bot", "drill"],
      },
      {
        id: "play.fair-play",
        source: "play",
        label: "How fairness works",
        kicker: "Play",
        groupLabel: "Open",
        href: "/play/fair-play",
        keywords: ["fair", "fairness", "provably fair", "verify", "proof"],
      },
    ];
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    // The arena's live updates ride per-match Supabase Realtime channels,
    // not the notification-queue spine, so the play module owns no
    // notification categories. Returning [] keeps the drawer honest.
    return [];
  },

  async getEmptyTeaching(): Promise<EmptyTeaching | null> {
    return {
      kicker: "Henry Onyx Live",
      headline: "Play a skill match",
      body: "Practice against the AI, learn the games, and climb the ranked leaderboard — free to play, every match provably fair.",
      action: { label: "Enter the arena", href: "/play" },
    };
  },
};
