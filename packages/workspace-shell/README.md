# @henryco/workspace-shell

The shared workspace chrome engine — sidebar, mobile-header, bottom-nav,
primitives, skeletons, and error boundary — that every authenticated
HenryCo workspace surface composes from.

## Why this exists

Before Phase 1 of the workspace-standardization pass, every division
re-implemented its own chrome:

- Studio `/client` had a hand-rolled portal sidebar + mobile-header + bottom-nav
- Jobs `/candidate`, `/employer`, `/recruiter` shared a `WorkspaceShell` component
  but its nav rendered the same `Sparkles` icon for every link
- Care, Property, Marketplace, Logistics each rolled their own
- Mobile bottom-navs collided with the support duck
- Loading skeletons existed for some surfaces and not others

This package replaces all of that with one engine. Every consumer wires
in the same way; new divisions onboard with a single CSS block.

## Quick start

```ts
// app/(workspace)/layout.tsx
import { headers } from "next/headers";
import { WorkspaceShell, type WorkspaceBrand } from "@henryco/workspace-shell";
import { Sparkles } from "lucide-react";
import { requireMyWorkspaceUser } from "@/lib/auth";
import { getMySnapshot } from "@/lib/data";
import { workspaceNav, workspaceMobileNav } from "@/lib/navigation";

const BRAND: WorkspaceBrand = {
  shortName: "Candidate hub",
  kicker: "Henry Onyx Jobs",
  href: "/candidate",
  icon: Sparkles,
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const viewer = await requireMyWorkspaceUser();
  const snapshot = await getMySnapshot(viewer);
  const pathname = (await headers()).get("x-pathname") ?? "";

  return (
    <WorkspaceShell
      division="jobs-candidate"
      brand={BRAND}
      viewer={viewer}
      navigation={workspaceNav}
      mobileNavigation={workspaceMobileNav}
      badges={{ "/candidate/messages": snapshot.unread }}
      attentionCount={snapshot.attentionCount}
      notificationsHref="/candidate/notifications"
      profileHref="/candidate/profile"
      accountSettingsUrl="https://account.henrycogroup.com"
      takeoverPrefixes={["/candidate/messages"]}
      pathname={pathname}
    >
      {children}
    </WorkspaceShell>
  );
}
```

## Token mapping (one-time per division)

The engine reads `--ws-*` CSS variables. Each host division supplies a
mapping in its globals.css that redirects those onto its own brand
tokens:

```css
@import "../../../packages/workspace-shell/src/styles.css";

[data-workspace-division="jobs-candidate"] {
  --ws-bg: var(--jobs-paper);
  --ws-bg-soft: rgba(255, 255, 255, 0.025);
  --ws-bg-elev: rgba(255, 255, 255, 0.04);
  --ws-ink: var(--jobs-ink);
  --ws-ink-soft: var(--jobs-muted);
  --ws-line: var(--jobs-line);
  --ws-line-strong: rgba(16, 33, 36, 0.18);
  --ws-accent: var(--jobs-accent);
  --ws-accent-soft: var(--jobs-accent-soft);
  --ws-signal: var(--jobs-accent);
}
```

**That's it.** The engine renders in the division's brand colors with
zero per-app component code.

## Architecture invariants

1. **Server-component compatible end-to-end.** No client hooks anywhere
   in the engine. The host passes `pathname` as a prop (typically read
   from the proxy-stamped `x-pathname` header).

2. **No data fetching, no auth, no routing.** Hosts handle all of that.
   The engine composes typed props into chrome.

3. **One nav contract.** Every nav item is `{ href, label, icon, matchPrefix?, hasIndicator?, description? }`. The required `icon` field
   prevents the "every link uses Sparkles" regression we hit pre-Phase-1.

4. **Takeover-route opt-out.** Routes in `takeoverPrefixes` short-circuit
   the chrome and render full-bleed. Studio's `/client/messages` inbox
   is the canonical example; any inbox/thread surface should opt out.

5. **Mobile / desktop split is CSS-driven.** `<WorkspaceMobileHeader>`
   hides at lg+ via media query. `<WorkspaceBottomNav>` same. The
   sidebar shows only at lg+. No `useMediaQuery` hooks.

## Components

### Layout

- `WorkspaceShell` — the orchestrator. Use this in `layout.tsx`.
- `WorkspaceSidebar`, `WorkspaceMobileHeader`, `WorkspaceBottomNav` —
  standalone, if a host wants finer control.

### Primitives

- `WorkspaceCard` (with `elevated?: boolean`)
- `WorkspaceButton` (variant: `primary | secondary | ghost`)
- `WorkspaceLinkButton` — same styles, renders as `<a>`
- `WorkspaceStatusBadge` (tones: `neutral | good | warn | danger | info`)
- `WorkspaceEmptyState` (calm dashed-border block with icon + body + action)
- `WorkspaceDivider`

### Recovery / loading

- `WorkspaceErrorBoundary` — drop into `error.tsx`
- `WorkspaceDashboardSkeleton`, `WorkspaceListSkeleton`,
  `WorkspaceDetailSkeleton` — drop into `loading.tsx`

## Class reference (for hosts that need ad-hoc styling)

| Class | Purpose |
|---|---|
| `.ws-shell-root` | Layout wrapper |
| `.ws-sidebar`, `.ws-sidebar-link[aria-current="page"]` | Desktop sidebar |
| `.ws-mobile-header`, `.ws-mobile-icon-button` | Mobile top bar |
| `.ws-bottom-nav`, `.ws-bottom-nav-item[aria-current="page"]` | Mobile bottom-nav |
| `.ws-card`, `.ws-card-elev` | Surface cards |
| `.ws-button`, `.ws-button-primary`, `.ws-button-secondary`, `.ws-button-ghost` | Buttons |
| `.ws-status-badge[data-tone="good\|warn\|danger\|info"]` | Status pills |
| `.ws-empty-state[data-tone="muted"]` | Empty states |
| `.ws-skeleton` | Animated skeleton block |

## Roadmap

- [x] **Phase 1** — Engine + studio /client migration
- [ ] **Phase 2** — Notifications + realtime spine (consolidate
      `@henryco/dashboard-shell` realtime feed into the engine)
- [ ] **Phase 3** — Shared messaging thread engine
- [ ] **Phase 4** — Interview room (LiveKit-backed, Cloudinary recording)
- [ ] **Phase 5** — AI-proctored assessment engine
- [ ] **Phase 6** — Cross-division command palette
- [ ] **Phase 7** — Onboard remaining divisions
