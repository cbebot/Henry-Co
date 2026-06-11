import { RouteLiveRefresh } from "@henryco/ui";
import { buildUnifiedViewer } from "@henryco/auth/server";
import type { SignalFeedCursor } from "@henryco/data";
import { createDataAdminClient } from "@henryco/data";
import { listUserAbandonedTasks } from "@henryco/data/abandoned-tasks";
import { getRecoveryCopy } from "@henryco/i18n/server";
import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";
import { SmartHome } from "@/components/smart-home/SmartHome";
import { DashboardRefreshTracker } from "@/components/smart-home/DashboardRefreshTracker";
import { RecoveryNudge } from "@/components/recovery/RecoveryNudge";

// Side-effect: register modules. Without this import the registry is
// empty and the Smart Home composition has no widgets to walk.
import "@/app/(account)/_modules";

export const dynamic = "force-dynamic";

/**
 * The Smart Home — DASH-4.
 *
 * Replaces the legacy "Welcome to your dashboard" surface with a
 * ranked, action-first, real-data-only composition. See
 * `apps/account/components/smart-home/SmartHome.tsx` for the
 * composition contract; this page is the thin RSC entry point that
 * resolves the viewer + cursor and hands off.
 *
 * Cursor pagination shape:
 *   /?cursor.score=<numeric>&cursor.created_at=<iso>
 *
 * The `cursor.score` and `cursor.created_at` pair lets the SQL
 * function paginate deterministically across the 30 s cache window
 * without offset pitfalls.
 */
type SearchParams = Record<string, string | string[] | undefined>;

export default async function OverviewPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const cursor = parseCursor(params);
  const prevHref = cursor ? "/" : null;

  const user = await requireAccountUser();
  const viewer = await buildUnifiedViewer({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  });

  // V3-37: first-login resume nudge — count pending recovery tasks (indexed,
  // capped) and let the client surface ONE paced toast pointing at /continue.
  const [locale, pendingRecovery] = await Promise.all([
    getAccountAppLocale(),
    listUserAbandonedTasks(createDataAdminClient(), user.id, {
      statuses: ["pending"],
      limit: 6,
    }),
  ]);
  const recoveryNudge = getRecoveryCopy(locale).nudge;

  return (
    <div className="acct-fade-in">
      <RouteLiveRefresh />
      <DashboardRefreshTracker moduleId="smart-home" />
      <RecoveryNudge
        count={pendingRecovery.length}
        href="/continue"
        titleOne={recoveryNudge.titleOne}
        titleMany={recoveryNudge.titleMany}
        body={recoveryNudge.body}
      />
      <SmartHome viewer={viewer} cursor={cursor} prevHref={prevHref} />
    </div>
  );
}

function parseCursor(params: SearchParams): SignalFeedCursor | null {
  const score = pickString(params["cursor.score"]);
  const createdAt = pickString(params["cursor.created_at"]);
  if (!score || !createdAt) return null;
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) return null;
  // ISO sanity — let the RPC reject malformed timestamps; a NaN parse
  // here just means we drop the cursor and serve the first page.
  if (Number.isNaN(Date.parse(createdAt))) return null;
  return { score: numericScore, createdAt };
}

function pickString(v: string | string[] | undefined): string | null {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return null;
}
