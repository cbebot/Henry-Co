# @henryco/rooms

The canonical real-time room engine every HenryCo portal consumes. One provider-abstracted stack across Care consults, Marketplace dispute video, Studio collab reviews, Academy live classes, Logistics live tracking, Property virtual tours, and Jobs interview rooms. Zero per-portal video stack duplication.

V3 Wave A2 — ships standalone on `rebuild/dashboard-rooms`.

## What this package is

- A provider-abstracted real-time room engine (video + chat + screen share + recording + scorecards).
- The single place every portal pulls room primitives from.
- Provider-agnostic UI primitives (`<RoomShell>`, `<PresencePane>`, `<RecordingConsent>`, `<ScreenSharePane>`, `<CollabEditorPane>`, `<ScorecardSidebar>`, `<RoomChat>`, `<RoomBadge>`).
- Typed server actions (`createRoom`, `joinRoom`, `recordConsent`, `startRecording`, `stopRecording`, `submitScorecard`, `sendRoomMessage`, `endRoom`, `leaveRoom`, `toggleHand`).
- A typed lifecycle hook (`useRoomLifecycle`) that composes the server actions + the rooms realtime context.

## What this package is NOT

- A video conferencing service. We compose Daily.co (primary) and Jitsi (fallback) — we don't roll our own WebRTC stack.
- A per-portal feature module. Every portal mounts these primitives via its own page; we expose the building blocks.
- An email / push notification surface. Room-end notifications route through `@henryco/email` and `@henryco/notifications-ui` — never instantiate raw clients here.

## Provider abstraction

| Provider | Driver file | Primary use | Fallback role |
|---|---|---|---|
| Daily.co | `src/providers/daily.ts` | Default — full server-side recording, robust at scale | — |
| Jitsi | `src/providers/jitsi.ts` | When `DAILY_API_KEY` is absent OR `ROOMS_PROVIDER=jitsi` | Degrades to public `meet.jit.si` with zero config |

`src/provider-selector.ts` resolves the driver from env:

```
ROOMS_PROVIDER  | DAILY_*  | Result
────────────────┼──────────┼────────────
"daily"         | present  | daily
"daily"         | absent   | null (→ rooms_unavailable typed error)
"jitsi"         | (any)    | jitsi (custom domain or meet.jit.si)
unset (default) | present  | daily
unset (default) | absent   | jitsi (meet.jit.si)
```

The room route degrades gracefully — `selectProvider()` returning `null` causes `createRoom` to return `{ error: "rooms_unavailable" }`, which the consumer renders as `<EmptyState kicker="Live rooms" headline="Real-time rooms aren't configured yet" />`. Never 500.

## Consumer cookbook

### Host-app setup (once per app)

The host app supplies its own Supabase factories — the package never imports the SDK directly.

```ts
// apps/<portal>/instrumentation.ts (or the layout that mounts the room)
import {
  registerRoomsSupabaseFactory,
  registerRoomsServiceRoleFactory,
} from "@henryco/rooms/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseServiceRole } from "@/lib/supabase/admin";

registerRoomsSupabaseFactory(createSupabaseServer);
registerRoomsServiceRoleFactory(createSupabaseServiceRole);
```

### Mounting a room (Care consult, Jobs interview, etc.)

Server component creates the room:

```tsx
// apps/jobs/app/employer/interviews/[sessionId]/room/page.tsx
import { createRoom, joinRoom } from "@henryco/rooms/server/actions";
import { isRoomError } from "@henryco/rooms";

export default async function InterviewRoomPage({ params }: { params: { sessionId: string } }) {
  const room = await createRoom({ kind: "jobs_interview", metadata: { applicationId: "…" } });
  if (isRoomError(room)) return <RoomFallback error={room} />;
  return <InterviewRoomClient sessionId={room.sessionId} provider={room.provider} joinUrl={room.joinUrl} />;
}
```

Client component composes the primitives:

```tsx
"use client";

import { RoomsRealtimeProvider } from "@henryco/rooms/realtime";
import { useRoomLifecycle } from "@henryco/rooms/hooks/use-room-lifecycle";
import {
  RoomShell,
  PresencePane,
  RoomChat,
  ScorecardSidebar,
  RecordingConsent,
} from "@henryco/rooms/components";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export function InterviewRoomClient({ sessionId, provider, joinUrl }: Props) {
  const [consentOpen, setConsentOpen] = useState(false);
  const lifecycle = useRoomLifecycle({
    sessionId, role: "interviewer", provider, consentGiven: false,
  });
  return (
    <RoomsRealtimeProvider sessionId={sessionId} getSupabase={createSupabaseBrowser}>
      <RoomShell
        room={{ sessionId, provider, joinUrl }}
        role="interviewer"
        lifecycle={lifecycle}
        scorecardEnabled
        recordingConsent={{ consentGiven: false, onOpenConsentDialog: () => setConsentOpen(true) }}
        renderPresence={() => <PresencePane resolveDisplayName={resolveName} />}
        renderChat={() => <RoomChat sessionId={sessionId} selfUserId={viewer.id} resolveDisplayName={resolveName} />}
        renderScorecard={() => <ScorecardSidebar sessionId={sessionId} />}
        title="Interview with Alex"
        kicker="Jobs · Live"
      />
      <RecordingConsent
        open={consentOpen}
        onClose={() => setConsentOpen(false)}
        sessionId={sessionId}
        consentTextVersion="2026-05-14"
        alreadyConsented={false}
      />
    </RoomsRealtimeProvider>
  );
}
```

## Schema reference

Migrations under `apps/hub/supabase/migrations/`:

- `20260515100000_rooms_sessions.sql` — the canonical session row.
- `20260515100100_rooms_participants.sql` — per-user lifecycle (join/leave/hand-raise).
- `20260515100200_rooms_recordings_consent.sql` — GDPR-aligned consent ledger.
- `20260515100300_rooms_recordings.sql` — recording artefacts (service-role write).
- `20260515100400_rooms_scorecards.sql` — reviewer scorecards.
- `20260515100500_rooms_messages.sql` — in-room chat.
- `20260515100600_rooms_realtime_publication.sql` — adds `rooms_messages` + `rooms_participants` to `supabase_realtime`.

RLS is enabled on every table; full predicates documented in each migration. Cross-tenant access denial is verified by the V3 RLS Playwright check on a real Postgres preview branch.

## Env-var checklist

See `docs/audit/dashboard-rebuild-audit.md` §6.1.14 — kept in sync with this package.

| Var | Scope | Required | Purpose |
|---|---|---|---|
| `DAILY_API_KEY` | server | prod / preview | Daily.co REST API key |
| `DAILY_DOMAIN` | server | prod / preview | Daily subdomain (e.g. `henryco`) |
| `NEXT_PUBLIC_DAILY_DOMAIN` | client | prod / preview | Daily subdomain mirrored client-side |
| `NEXT_PUBLIC_JITSI_DOMAIN` | client | optional | Jitsi instance hostname (default `meet.jit.si`) |
| `JITSI_APP_ID` | server | optional | Optional JWT issuer for Jitsi |
| `JITSI_APP_SECRET` | server | optional | Optional HS256 signing secret |
| `ROOMS_PROVIDER` | server | optional | Override (`daily` or `jitsi`) |
| `ROOMS_RECORDING_BUCKET` | server | required if recording enabled | Supabase Storage bucket for recordings |

## Acceptance gate evidence template

Use this in the consumer PR body when mounting rooms on a new surface.

| Gate | Status | Evidence |
|---|---|---|
| V1 typecheck/lint/build clean | ☐ | `pnpm -r typecheck && pnpm -r build` output |
| V3 RLS — cross-tenant denial | ☐ | Playwright run on preview branch |
| V4 realtime — message echo < 2 s | ☐ | Network panel screenshot |
| V6 Lighthouse ≥ 90 perf, ≥ 95 a11y/bp | ☐ | Lighthouse JSON |
| V7 axe-core 0 violations | ☐ | axe report |
| V9 every CTA LIVE | ☐ | CTA table with file:line |
| V10 empty/loading/error/success | ☐ | Playwright matrix |
| R1 happy-path on Daily + Jitsi | ☐ | Two-user video call screenshots |
| R2 consent gate blocks recording | ☐ | Playwright test name + run id |

## Known PARTIAL items (Wave A2)

- **`CollabEditorPane` Yjs persistence layer** — shipped as a scaffold (controlled textarea + onSave callback). Real Yjs CRDT binding requires either a `room_documents` schema extension or a separate Yjs-over-WebSocket service. Out of Wave A2 scope per audit §4.3. Wave C may extend OR a dedicated follow-up pass will land it.
- **Provider webhook receivers** — the rooms package does NOT include the `/api/webhooks/daily/*` route handlers. Consumers wire those in their own app, using `verifyWhatsAppSignature`-style HMAC verification (Daily signs webhooks with `X-Webhook-Signature`). Wave B/C consumers add the receiver routes.
- **Rooms-specific event-taxonomy entries** — the action emitter currently reuses the closest existing `henry.*.*.*` event per kind (e.g. `henry.jobs.application.updated` for `room.joined` on a jobs interview). A follow-up will extend `docs/event-taxonomy.md` with `henry.rooms.session.created/joined/ended/recording.{started,stopped}` events.

## Truth hierarchy

CODE TRUTH (file:line) > DEPLOYMENT TRUTH (vercel.json + deploy logs) > LIVE TRUTH (production with real data). Every assertion in this README cites a file path. Anything unverified is flagged `UNVERIFIED — REQUIRES OWNER CONFIRMATION` in the persisted Wave A2 report at `.codex-temp/v3-dash-a2-rooms/report.md`.
