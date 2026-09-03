"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { BottomSheet, type BottomSheetCloseReason } from "@henryco/ui/mobile";
import { cn } from "@/lib/utils";

export type WorkspaceNavItem = {
  href: string;
  label: string;
  active?: boolean;
};

export type WorkspaceNavGroup = {
  label: string;
  items: WorkspaceNavItem[];
};

type Props = {
  title: string;
  description: string;
  groups: WorkspaceNavGroup[];
  /** Pre-computed label of the currently active item (e.g., "Orders"). */
  currentLabel?: string | null;
  /** Translated chrome copy — the shell passes these; EN defaults preserve the old API. */
  labels?: {
    kicker: string;
    currentSection: string;
    openMenu: string;
    menuTitle: string;
    closeMenu: string;
    fallbackActive: string;
  };
};

const DRAWER_SURFACE = "marketplace.profile_drawer";

/**
 * Mobile-first workspace navigation. Desktop (`lg`+) renders the
 * sidebar in `shell.tsx`; this component renders only at `lg`-and-
 * below. Tapping the trigger opens a `BottomSheet` (`@henryco/ui/
 * mobile`) with the nav grouped into Activity / Commerce / Saved /
 * Selling / Support so a 10-item flat list never dominates the first
 * mobile screen.
 *
 * Behaviors (DESIGN-01 rebuild):
 *   - Drawer is a curated instance of the platform `BottomSheet`,
 *     inheriting body scroll lock with iOS-Safari scroll restoration
 *     (the "open at bottom of page" fix), focus trap, Android
 *     hardware back, Esc, backdrop tap, swipe-down-to-dismiss, and
 *     reduced-motion gating.
 *   - Active group auto-expands on open; inactive groups collapsed.
 *   - Animated group expand/collapse via measured `max-height`.
 *   - Internal scroll container is independent (`overscroll-behavior:
 *     contain`) so flick-scrolling inside the drawer can't bleed into
 *     the page beneath.
 *   - Three telemetry events: `opened`, `closed` (with `via`),
 *     `item_selected` (group + label + href).
 *
 * Public API preserved: `title`, `description`, `groups`, `currentLabel`.
 */
export function WorkspaceMobileNav({ title, description, groups, currentLabel, labels }: Props) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    seedExpanded(groups),
  );
  // The BottomSheet portals to document.body — OUTSIDE any theme scope the page applies
  // (e.g. `.market-workspace-light` on /vendor and /account). Without re-establishing that
  // scope inside the portal, --market-* tokens resolve to the dark :root base and paint
  // near-white ink on the sheet's white surface. Detect the trigger's scope and mirror it.
  const [sheetScopeClass, setSheetScopeClass] = useState<string | null>(null);
  const chrome = {
    kicker: "Workspace",
    currentSection: "Current section",
    openMenu: "Open workspace menu",
    menuTitle: "Workspace menu",
    closeMenu: "Close workspace menu",
    fallbackActive: "Overview",
    ...labels,
  };

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const idBase = useId();
  const drawerId = `market-profile-drawer-${idBase}`;
  const titleId = `${drawerId}-title`;
  const descId = `${drawerId}-desc`;

  const activeLabel = useMemo(() => {
    if (currentLabel) return currentLabel;
    const found = groups.flatMap((g) => g.items).find((item) => item.active);
    return found?.label ?? chrome.fallbackActive;
  }, [currentLabel, groups, chrome.fallbackActive]);

  const handleOpen = useCallback(() => {
    // Re-seed expanded state on every open so a return visit starts
    // fresh on the active group (the active item may have shifted
    // since the last open). Initial state is also seeded via the
    // `useState` initializer — this covers subsequent opens.
    setExpanded(seedExpanded(groups));
    setSheetScopeClass(
      triggerRef.current?.closest(".market-workspace-light") ? "market-workspace-light" : null,
    );
    setOpen(true);
    emitDrawerEvent({
      name: "henry.marketplace.profile_drawer.opened",
      outcome: "started",
      payload: { surface: DRAWER_SURFACE },
    });
  }, [groups]);

  const handleClose = useCallback(
    (reason: BottomSheetCloseReason | "navigation") => {
      setOpen(false);
      emitDrawerEvent({
        name: "henry.marketplace.profile_drawer.closed",
        outcome: "completed",
        payload: { via: reason },
      });
    },
    [],
  );

  const handleItemSelected = useCallback(
    (group: string, item: WorkspaceNavItem) => {
      emitDrawerEvent({
        name: "henry.marketplace.profile_drawer.item_selected",
        outcome: "completed",
        payload: { group, label: item.label, href: item.href },
      });
      // Closing via 'navigation' so analytics can distinguish a link
      // tap from a manual close. The Next.js client transition is in
      // flight at this point; the drawer is gone before paint.
      handleClose("navigation");
    },
    [handleClose],
  );

  const toggleGroup = useCallback((groupLabel: string) => {
    setExpanded((prev) => ({ ...prev, [groupLabel]: !prev[groupLabel] }));
  }, []);

  return (
    <div className="lg:hidden">
      <div className="market-panel rounded-[1.6rem] p-4 sm:p-5">
        <p className="market-kicker">{chrome.kicker}</p>
        <h1 className="mt-2 text-[1.45rem] font-semibold tracking-tight text-[var(--market-paper-white)]">
          {title}
        </h1>
        <p className="mt-2 text-[13px] leading-6 text-[var(--market-muted)]">{description}</p>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[var(--market-line)] bg-[color:var(--market-fill-faint)] px-3.5 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
              {chrome.currentSection}
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-[var(--market-paper-white)]">
              {activeLabel}
            </p>
          </div>
          <button
            ref={triggerRef}
            type="button"
            onClick={handleOpen}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={drawerId}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--market-line-strong)] bg-[color:var(--market-fill-faint)] px-4 py-2.5 text-[12px] font-semibold text-[var(--market-paper-white)] transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-brass)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--market-bg)]"
          >
            <Menu className="h-3.5 w-3.5" />
            {chrome.openMenu}
          </button>
        </div>
      </div>

      <BottomSheet
        open={open}
        onClose={handleClose}
        id={drawerId}
        labelledBy={titleId}
        describedBy={description ? descId : undefined}
        surface={DRAWER_SURFACE}
        triggerRef={triggerRef}
        initialFocusRef={closeRef}
      >
        {/* Re-establish the page's theme scope INSIDE the portal (custom properties inherit
            through display:contents), so the light workspace re-tones reach the sheet. */}
        <div className={cn("contents", sheetScopeClass)}>
        <header className="flex items-start justify-between gap-3 border-b border-[var(--market-line)] px-5 pb-4 pt-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-brass)]">
              {chrome.menuTitle}
            </p>
            <p
              id={titleId}
              className="mt-1 line-clamp-2 text-base font-semibold tracking-tight text-[var(--market-paper-white)]"
            >
              {title}
            </p>
            {description ? (
              <p
                id={descId}
                className="mt-1 line-clamp-2 text-[12px] leading-5 text-[var(--market-muted)]"
              >
                {description}
              </p>
            ) : null}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => handleClose("tap_close")}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--market-line)] text-[var(--market-muted)] transition hover:text-[var(--market-paper-white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]"
            aria-label={chrome.closeMenu}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-6 pt-2"
          style={{ WebkitOverflowScrolling: "touch" } as CSSProperties}
        >
          {groups.map((group) => {
            const isExpanded = expanded[group.label] ?? false;
            const headerId = `${drawerId}-group-${slugify(group.label)}`;
            const listId = `${headerId}-list`;
            return (
              <section
                key={group.label}
                className="border-b border-[var(--market-line)] last:border-b-0"
              >
                <button
                  type="button"
                  id={headerId}
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={isExpanded}
                  aria-controls={listId}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)] transition active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]"
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "h-4 w-4 text-[var(--market-muted)] transition-transform duration-200 ease-out",
                      isExpanded ? "rotate-180" : "rotate-0",
                    )}
                  />
                </button>
                <CollapsibleList
                  id={listId}
                  labelledBy={headerId}
                  expanded={isExpanded}
                >
                  <ul className="space-y-1 px-2 pb-3" role="list">
                    {group.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => handleItemSelected(group.label, item)}
                          aria-current={item.active ? "page" : undefined}
                          className={cn(
                            "flex items-center justify-between gap-2 rounded-2xl px-3.5 py-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]",
                            "min-h-[48px]",
                            item.active
                              ? "text-[color:var(--market-paper-white)] ring-1 ring-inset ring-[color:var(--market-line-strong)]"
                              : "text-[color:var(--market-muted)] active:bg-[color:var(--market-fill-faint)] active:text-[color:var(--market-paper-white)] focus-visible:bg-[color:var(--market-fill-faint)]",
                          )}
                          style={
                            item.active
                              ? { background: "var(--market-nav-active)" }
                              : undefined
                          }
                        >
                          <span className="truncate">{item.label}</span>
                          <ChevronRight
                            aria-hidden="true"
                            className={cn(
                              "h-4 w-4 shrink-0",
                              item.active ? "opacity-90" : "opacity-50",
                            )}
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CollapsibleList>
              </section>
            );
          })}
        </div>
        </div>
      </BottomSheet>
    </div>
  );
}

/**
 * Animated collapsible region. Uses `max-height` + opacity to glide
 * between collapsed and expanded states. Measures the natural content
 * height via `scrollHeight` on each transition so groups of varying
 * sizes don't snap.
 */
function CollapsibleList({
  id,
  labelledBy,
  expanded,
  children,
}: {
  id: string;
  labelledBy: string;
  expanded: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [maxHeight, setMaxHeight] = useState<string | undefined>(undefined);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (expanded) {
      // Measure and set, then settle to "none" after the transition
      // so subsequent layout shifts (e.g. focus ring offsets) don't
      // get clipped by a stale measured height.
      const target = `${el.scrollHeight}px`;
      setMaxHeight(target);
      const settle = window.setTimeout(() => setMaxHeight("none"), 240);
      return () => window.clearTimeout(settle);
    }
    // Going to collapsed: set the current measured height first so
    // the transition can animate from a concrete value to 0px.
    if (maxHeight === "none" || maxHeight === undefined) {
      setMaxHeight(`${el.scrollHeight}px`);
      const raf = window.requestAnimationFrame(() => setMaxHeight("0px"));
      return () => window.cancelAnimationFrame(raf);
    }
    setMaxHeight("0px");
    return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  return (
    <div
      ref={ref}
      id={id}
      role="region"
      aria-labelledby={labelledBy}
      aria-hidden={!expanded}
      style={{
        maxHeight,
        opacity: expanded ? 1 : 0,
        overflow: "hidden",
        transition:
          "max-height 220ms ease-out, opacity 200ms ease-out",
      }}
    >
      {children}
    </div>
  );
}

function seedExpanded(groups: WorkspaceNavGroup[]): Record<string, boolean> {
  const seed: Record<string, boolean> = {};
  for (const group of groups) {
    seed[group.label] = group.items.some((item) => item.active);
  }
  // If nothing is active (rare — usually we're on a known route),
  // expand the first group so the user has an immediate target.
  if (groups[0] && !Object.values(seed).some(Boolean)) {
    seed[groups[0].label] = true;
  }
  return seed;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Emit a drawer-scoped telemetry event via the workspace observability
 * channel. Uses dynamic `import` so the marketplace bundle doesn't
 * pull observability when the drawer isn't tapped — pay-per-use.
 *
 * Failures swallowed (best-effort). The shape mirrors the event
 * taxonomy in `packages/observability/src/events.ts`.
 */
function emitDrawerEvent(params: {
  name:
    | "henry.marketplace.profile_drawer.opened"
    | "henry.marketplace.profile_drawer.closed"
    | "henry.marketplace.profile_drawer.item_selected";
  outcome: "started" | "completed";
  payload: Record<string, unknown>;
}): void {
  void (async () => {
    try {
      const mod = (await import("@henryco/observability")) as {
        emitEvent?: (p: {
          name: string;
          classification: "user_action";
          outcome: string;
          payload: Record<string, unknown>;
        }) => void;
      };
      mod.emitEvent?.({
        name: params.name,
        classification: "user_action",
        outcome: params.outcome,
        payload: params.payload,
      });
    } catch {
      // observability not in this graph — silent.
    }
  })();
}
