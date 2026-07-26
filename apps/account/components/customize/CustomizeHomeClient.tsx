"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Lock,
  Pin,
  PinOff,
  RotateCcw,
} from "lucide-react";
import type { PersonalizationCopy } from "@henryco/i18n";
import {
  saveHomeLayoutAction,
  resetHomeLayoutAction,
} from "@/app/(account)/customize/actions";

type ModuleEntry = { slug: string; title: string; blocked: boolean };

type CustomizeHomeClientProps = {
  modules: ReadonlyArray<ModuleEntry>;
  initial: {
    desktopOrder: string[];
    mobileOrder: string[];
    hidden: string[];
    pinned: string[];
  };
  copy: PersonalizationCopy["customize"];
};

type Device = "desktop" | "mobile";
type Status = "idle" | "saving" | "saved" | "error";

/** Merge a stored partial order with the full register order (append the rest). */
function buildOrder(stored: string[], allSlugs: string[]): string[] {
  const known = new Set(allSlugs);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of stored) {
    if (known.has(s) && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  for (const s of allSlugs) {
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

export function CustomizeHomeClient({
  modules,
  initial,
  copy,
}: CustomizeHomeClientProps) {
  const allSlugs = useMemo(() => modules.map((m) => m.slug), [modules]);
  const byslug = useMemo(
    () => new Map(modules.map((m) => [m.slug, m])),
    [modules],
  );

  const [desktopOrder, setDesktopOrder] = useState<string[]>(() =>
    buildOrder(initial.desktopOrder, allSlugs),
  );
  const [mobileOrder, setMobileOrder] = useState<string[]>(() =>
    buildOrder(initial.mobileOrder, allSlugs),
  );
  const [pinned, setPinned] = useState<Set<string>>(
    () => new Set(initial.pinned.filter((s) => byslug.has(s))),
  );
  const [hidden, setHidden] = useState<Set<string>>(
    () =>
      new Set(
        initial.hidden.filter((s) => byslug.has(s) && !byslug.get(s)!.blocked),
      ),
  );
  const [device, setDevice] = useState<Device>("desktop");
  const [status, setStatus] = useState<Status>("idle");
  const [isResetting, setIsResetting] = useState(false);

  const order = device === "desktop" ? desktopOrder : mobileOrder;
  const setOrder = device === "desktop" ? setDesktopOrder : setMobileOrder;

  // Focus follows a moved row for keyboard reorder.
  const rowRefs = useRef(new Map<string, HTMLLIElement | null>());
  const pendingFocus = useRef<string | null>(null);
  // Only a device the user actually reordered is persisted — an untouched
  // device keeps its column at the prior value so signal ranking still flows.
  const desktopDirty = useRef(false);
  const mobileDirty = useRef(false);
  useEffect(() => {
    if (pendingFocus.current) {
      rowRefs.current.get(pendingFocus.current)?.focus();
      pendingFocus.current = null;
    }
  });

  const markDirty = useCallback(() => {
    setStatus((s) => (s === "saved" ? "idle" : s));
  }, []);

  const move = useCallback(
    (slug: string, delta: -1 | 1) => {
      setOrder((prev) => {
        const i = prev.indexOf(slug);
        const j = i + delta;
        if (i < 0 || j < 0 || j >= prev.length) return prev;
        const next = prev.slice();
        [next[i], next[j]] = [next[j]!, next[i]!];
        return next;
      });
      pendingFocus.current = slug;
      if (device === "desktop") desktopDirty.current = true;
      else mobileDirty.current = true;
      markDirty();
    },
    [setOrder, markDirty, device],
  );

  const togglePin = useCallback(
    (slug: string) => {
      setPinned((prev) => {
        const next = new Set(prev);
        if (next.has(slug)) next.delete(slug);
        else {
          next.add(slug);
          // Pinning a hidden module reveals it (a pin outranks a hide).
          setHidden((h) => {
            if (!h.has(slug)) return h;
            const nh = new Set(h);
            nh.delete(slug);
            return nh;
          });
        }
        return next;
      });
      markDirty();
    },
    [markDirty],
  );

  const toggleHide = useCallback(
    (slug: string) => {
      if (byslug.get(slug)?.blocked) return; // enforced in UI + server
      setHidden((prev) => {
        const next = new Set(prev);
        if (next.has(slug)) next.delete(slug);
        else {
          next.add(slug);
          setPinned((p) => {
            if (!p.has(slug)) return p;
            const np = new Set(p);
            np.delete(slug);
            return np;
          });
        }
        return next;
      });
      markDirty();
    },
    [byslug, markDirty],
  );

  const onRowKeyDown = useCallback(
    (e: React.KeyboardEvent, slug: string) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        move(slug, -1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        move(slug, 1);
      }
    },
    [move],
  );

  const save = useCallback(async () => {
    setStatus("saving");
    const res = await saveHomeLayoutAction({
      ...(desktopDirty.current ? { desktopOrder } : {}),
      ...(mobileDirty.current ? { mobileOrder } : {}),
      hidden: [...hidden],
      pinned: [...pinned],
    }).catch(() => ({ ok: false as const, error: "save_failed" as const }));
    setStatus(res.ok ? "saved" : "error");
  }, [desktopOrder, mobileOrder, hidden, pinned]);

  const reset = useCallback(async () => {
    setIsResetting(true);
    const res = await resetHomeLayoutAction().catch(() => ({
      ok: false as const,
      error: "save_failed" as const,
    }));
    if (res.ok) {
      setDesktopOrder(buildOrder([], allSlugs));
      setMobileOrder(buildOrder([], allSlugs));
      setPinned(new Set());
      setHidden(new Set());
      desktopDirty.current = false;
      mobileDirty.current = false;
      setStatus("saved");
    } else {
      setStatus("error");
    }
    setIsResetting(false);
  }, [allSlugs]);

  const tabButton = (value: Device, label: string) => {
    const active = device === value;
    // Toggle buttons (aria-pressed), not an ARIA tabs widget — no tabpanel /
    // arrow-key roving is implied, matching the actual behaviour.
    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={() => setDevice(value)}
        className={`rounded-[var(--acct-radius-sm)] px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[var(--acct-gold)] ${
          active
            ? "bg-[var(--acct-gold-soft)] text-[var(--acct-gold-text)]"
            : "text-[var(--acct-muted)] hover:text-[var(--acct-ink)]"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <section className="acct-card flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <p className="acct-kicker text-[var(--acct-gold-text)]">{copy.eyebrow}</p>
        <h1 className="text-2xl font-semibold text-[var(--acct-ink)]">
          {copy.title}
        </h1>
        <p className="max-w-2xl text-sm text-[var(--acct-muted)]">
          {copy.description}
        </p>
      </header>

      <div
        role="group"
        aria-label={copy.listLabel}
        className="flex w-fit gap-1 rounded-[var(--acct-radius-sm)] bg-[var(--acct-surface)] p-1"
      >
        {tabButton("desktop", copy.desktopTab)}
        {tabButton("mobile", copy.mobileTab)}
      </div>

      <p className="text-xs text-[var(--acct-muted)]">{copy.reorderHint}</p>

      {order.length === 0 ? (
        <p className="text-sm text-[var(--acct-muted)]">{copy.emptyState}</p>
      ) : (
        <ul
          aria-label={copy.listLabel}
          className="flex flex-col gap-2"
        >
          {order.map((slug, index) => {
            const entry = byslug.get(slug);
            if (!entry) return null;
            const isPinned = pinned.has(slug);
            const isHidden = hidden.has(slug);
            return (
              <li
                key={slug}
                ref={(el) => {
                  rowRefs.current.set(slug, el);
                }}
                tabIndex={0}
                onKeyDown={(e) => onRowKeyDown(e, slug)}
                aria-label={entry.title}
                className={`flex items-center justify-between gap-3 rounded-[var(--acct-radius-sm)] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--acct-gold)] ${
                  isHidden ? "opacity-60" : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-medium text-[var(--acct-ink)]">
                    {entry.title}
                  </span>
                  {isPinned ? (
                    <span className="rounded-full bg-[var(--acct-gold-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--acct-gold-text)]">
                      {copy.pinnedBadge}
                    </span>
                  ) : null}
                  {isHidden ? (
                    <span className="rounded-full bg-[var(--acct-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--acct-muted)]">
                      {copy.hiddenBadge}
                    </span>
                  ) : null}
                  {entry.blocked ? (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] text-[var(--acct-muted)]"
                      title={copy.blockedReason}
                    >
                      <Lock size={12} aria-hidden="true" />
                      <span className="sr-only">{copy.blockedReason}</span>
                    </span>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <IconButton
                    label={copy.moveUp}
                    disabled={index === 0}
                    onClick={() => move(slug, -1)}
                  >
                    <ArrowUp size={16} aria-hidden="true" />
                  </IconButton>
                  <IconButton
                    label={copy.moveDown}
                    disabled={index === order.length - 1}
                    onClick={() => move(slug, 1)}
                  >
                    <ArrowDown size={16} aria-hidden="true" />
                  </IconButton>
                  <IconButton
                    label={isPinned ? copy.unpin : copy.pin}
                    onClick={() => togglePin(slug)}
                    active={isPinned}
                  >
                    {isPinned ? (
                      <PinOff size={16} aria-hidden="true" />
                    ) : (
                      <Pin size={16} aria-hidden="true" />
                    )}
                  </IconButton>
                  <IconButton
                    label={entry.blocked ? copy.blockedReason : isHidden ? copy.show : copy.hide}
                    onClick={() => toggleHide(slug)}
                    disabled={entry.blocked}
                  >
                    {isHidden ? (
                      <Eye size={16} aria-hidden="true" />
                    ) : (
                      <EyeOff size={16} aria-hidden="true" />
                    )}
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-[var(--acct-muted)]">{copy.consentNote}</p>

      <footer className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          className="rounded-[var(--acct-radius-sm)] bg-[var(--acct-gold)] px-5 py-2.5 text-sm font-semibold text-[var(--acct-on-gold)] transition-opacity disabled:opacity-60"
        >
          {status === "saving" ? copy.saving : status === "saved" ? copy.saved : copy.save}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={isResetting}
          className="inline-flex items-center gap-2 rounded-[var(--acct-radius-sm)] border border-[var(--acct-line)] px-4 py-2.5 text-sm font-medium text-[var(--acct-ink)] transition-colors hover:bg-[var(--acct-surface)] disabled:opacity-60"
        >
          <RotateCcw size={16} aria-hidden="true" />
          {isResetting ? copy.resetting : copy.reset}
        </button>
        <span aria-live="polite" className="text-sm text-[var(--acct-muted)]">
          {status === "saved" ? copy.saved : status === "error" ? copy.saveError : ""}
        </span>
      </footer>
    </section>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-[var(--acct-radius-sm)] border border-[var(--acct-line)] text-[var(--acct-ink)] transition-colors hover:bg-[var(--acct-surface)] focus-visible:ring-2 focus-visible:ring-[var(--acct-gold)] disabled:opacity-40 ${
        active ? "bg-[var(--acct-gold-soft)] text-[var(--acct-gold-text)]" : ""
      }`}
    >
      {children}
    </button>
  );
}
