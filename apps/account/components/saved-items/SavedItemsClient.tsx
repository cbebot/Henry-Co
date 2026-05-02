"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  CheckSquare,
  ChevronRight,
  Square,
  Trash2,
} from "lucide-react";
import type {
  SavedItemDivision,
  SavedItemRecord,
  SavedItemSnapshotCore,
} from "@henryco/cart-saved-items";
import { formatNaira } from "@/lib/format";

const DIVISION_LABEL: Record<SavedItemDivision, string> = {
  marketplace: "Marketplace",
  care: "Care",
  learn: "Academy",
  logistics: "Logistics",
  property: "Property",
  jobs: "Jobs",
  studio: "Studio",
  account: "Account",
};

const DIVISION_HOME: Record<SavedItemDivision, string> = {
  marketplace: "https://marketplace.henrycogroup.com/cart",
  care: "https://care.henrycogroup.com/book",
  learn: "https://learn.henrycogroup.com",
  logistics: "https://logistics.henrycogroup.com/book",
  property: "https://property.henrycogroup.com",
  jobs: "https://jobs.henrycogroup.com",
  studio: "https://studio.henrycogroup.com",
  account: "/",
};

type SortKey = "newest" | "oldest" | "expiring";

export function SavedItemsClient({
  initialActive,
  initialExpired,
  groupedByDivision,
}: {
  initialActive: SavedItemRecord[];
  initialExpired: SavedItemRecord[];
  groupedByDivision: Record<string, SavedItemRecord[]>;
}) {
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [expired, setExpired] = useState(initialExpired);
  const [filterDivision, setFilterDivision] = useState<SavedItemDivision | "all">("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"none" | "restore" | "remove" | "bulk-restore">("none");

  const divisions = useMemo(() => {
    const set = new Set<SavedItemDivision>();
    for (const item of active) set.add(item.division);
    return ["all" as const, ...Array.from(set)];
  }, [active]);

  const filtered = useMemo(() => {
    let list = active;
    if (filterDivision !== "all") {
      list = list.filter((item) => item.division === filterDivision);
    }
    list = [...list];
    if (sort === "newest") {
      list.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    } else if (sort === "oldest") {
      list.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
    } else if (sort === "expiring") {
      list.sort(
        (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
      );
    }
    return list;
  }, [active, filterDivision, sort]);

  const toggleSelect = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelected(new Set(filtered.map((item) => item.id)));
  const clearSelection = () => setSelected(new Set());

  async function bulkRestore() {
    if (selected.size === 0) return;
    setBusy("bulk-restore");
    try {
      const ids = Array.from(selected);
      const response = await fetch("/api/saved-items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error("Restore failed.");
      setActive((current) => current.filter((item) => !selected.has(item.id)));
      clearSelection();
      startTransition(() => router.refresh());
    } finally {
      setBusy("none");
    }
  }

  async function restoreOne(item: SavedItemRecord) {
    setBusy("restore");
    try {
      const response = await fetch("/api/saved-items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [item.id] }),
      });
      if (!response.ok) throw new Error("Restore failed.");
      setActive((current) => current.filter((row) => row.id !== item.id));
      startTransition(() => router.refresh());
    } finally {
      setBusy("none");
    }
  }

  async function removeOne(item: SavedItemRecord) {
    setBusy("remove");
    try {
      const response = await fetch("/api/saved-items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      if (!response.ok) throw new Error("Remove failed.");
      setActive((current) => current.filter((row) => row.id !== item.id));
      setExpired((current) => current.filter((row) => row.id !== item.id));
      startTransition(() => router.refresh());
    } finally {
      setBusy("none");
    }
  }

  const totalActive = active.length;
  const groupKeys = Object.keys(groupedByDivision) as SavedItemDivision[];

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <section className="acct-card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="acct-chip acct-chip-blue text-[0.65rem]">{totalActive} active</span>
          {expired.length > 0 ? (
            <span className="acct-chip acct-chip-gold text-[0.65rem]">{expired.length} expired</span>
          ) : null}
          <span className="text-xs text-[var(--acct-muted)]">
            Items expire 90 days after they&apos;re saved. We warn you a week early.
          </span>
        </div>

        {groupKeys.length > 1 ? (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {groupKeys.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilterDivision(key)}
                className={`rounded-xl border px-3 py-2 text-left text-xs transition ${
                  filterDivision === key
                    ? "border-[var(--acct-gold)] bg-[var(--acct-gold-soft)] text-[var(--acct-ink)]"
                    : "border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] text-[var(--acct-muted)] hover:border-[var(--acct-gold)]/40"
                }`}
              >
                <p className="text-sm font-semibold text-[var(--acct-ink)]">
                  {DIVISION_LABEL[key]}
                </p>
                <p className="text-[0.65rem] uppercase tracking-[0.16em] text-[var(--acct-muted)]">
                  {groupedByDivision[key].length} saved
                </p>
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {/* Toolbar */}
      <section className="acct-card flex flex-wrap items-center gap-3 p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-[var(--acct-muted)]">
            Show
          </span>
          <select
            value={filterDivision}
            onChange={(event) =>
              setFilterDivision((event.target.value as SavedItemDivision | "all") || "all")
            }
            className="rounded-lg border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-3 py-1.5 text-sm text-[var(--acct-ink)]"
          >
            {divisions.map((key) => (
              <option key={key} value={key}>
                {key === "all" ? "All divisions" : DIVISION_LABEL[key as SavedItemDivision]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-[var(--acct-muted)]">
            Sort
          </span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className="rounded-lg border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-3 py-1.5 text-sm text-[var(--acct-ink)]"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="expiring">Expiring soon</option>
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {selected.size > 0 ? (
            <>
              <span className="text-xs text-[var(--acct-muted)]">
                {selected.size} selected
              </span>
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-lg border border-[var(--acct-line)] px-3 py-1.5 text-xs font-semibold text-[var(--acct-muted)] hover:text-[var(--acct-ink)]"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => void bulkRestore()}
                disabled={busy !== "none" || pending}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--acct-gold)] px-3 py-1.5 text-xs font-semibold text-[var(--acct-noir,#0a0806)] disabled:cursor-wait disabled:opacity-70"
              >
                {busy === "bulk-restore" ? "Moving..." : "Move selected to cart"}
              </button>
            </>
          ) : filtered.length > 0 ? (
            <button
              type="button"
              onClick={selectAll}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--acct-line)] px-3 py-1.5 text-xs font-semibold text-[var(--acct-muted)] hover:text-[var(--acct-ink)]"
            >
              <CheckSquare size={13} /> Select all on page
            </button>
          ) : null}
        </div>
      </section>

      {/* Empty */}
      {filtered.length === 0 && expired.length === 0 ? (
        <section className="acct-card flex flex-col items-center gap-4 px-6 py-14 text-center">
          <Bookmark size={32} className="text-[var(--acct-gold)]" />
          <div>
            <h2 className="text-lg font-semibold text-[var(--acct-ink)]">
              Nothing saved for later yet
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[var(--acct-muted)]">
              When you find something you&apos;re not ready to buy, save it for later from the
              cart. We&apos;ll keep the price you saw at the time and warn you a week before it
              expires.
            </p>
          </div>
          <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-4">
            {(["marketplace", "care", "learn", "logistics"] as SavedItemDivision[]).map(
              (division) => (
                <Link
                  key={division}
                  href={DIVISION_HOME[division]}
                  className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-3 py-3 text-left text-xs transition hover:border-[var(--acct-gold)]/40"
                >
                  <p className="text-sm font-semibold text-[var(--acct-ink)]">
                    {DIVISION_LABEL[division]}
                  </p>
                  <p className="text-[0.65rem] uppercase tracking-[0.16em] text-[var(--acct-muted)]">
                    Browse
                  </p>
                </Link>
              )
            )}
          </div>
        </section>
      ) : null}

      {/* Active grid */}
      {filtered.length > 0 ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <SavedItemCard
              key={item.id}
              item={item}
              selected={selected.has(item.id)}
              onToggle={() => toggleSelect(item.id)}
              onRestore={() => void restoreOne(item)}
              onRemove={() => void removeOne(item)}
              busy={busy}
            />
          ))}
        </section>
      ) : null}

      {/* Expired (read-only — restore resets expiry) */}
      {expired.length > 0 ? (
        <section className="acct-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="acct-kicker">Recently expired</p>
            <span className="text-xs text-[var(--acct-muted)]">
              Restoring resets the 90-day window.
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {expired.map((item) => (
              <SavedItemCard
                key={item.id}
                item={item}
                selected={false}
                onToggle={() => undefined}
                onRestore={() => void restoreOne(item)}
                onRemove={() => void removeOne(item)}
                busy={busy}
                expired
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SavedItemCard({
  item,
  selected,
  onToggle,
  onRestore,
  onRemove,
  busy,
  expired = false,
}: {
  item: SavedItemRecord;
  selected: boolean;
  onToggle: () => void;
  onRestore: () => void;
  onRemove: () => void;
  busy: "none" | "restore" | "remove" | "bulk-restore";
  expired?: boolean;
}) {
  const snapshot = item.itemSnapshot as SavedItemSnapshotCore;
  // Snapshot the "now" reference once on mount — avoids re-render churn and
  // satisfies React 19's purity rule for the lint pass.
  const [renderedAtMs] = useState<number>(() => Date.now());
  const expiresAt = new Date(item.expiresAt);
  const daysToExpire = Math.max(
    0,
    Math.round((expiresAt.getTime() - renderedAtMs) / 86_400_000)
  );
  const isExpiring = !expired && daysToExpire <= 7;

  return (
    <article
      className={`relative flex flex-col gap-3 rounded-2xl border p-4 transition ${
        selected
          ? "border-[var(--acct-gold)] bg-[var(--acct-gold-soft)]"
          : "border-[var(--acct-line)] bg-[var(--acct-bg-elevated)]"
      } ${expired ? "opacity-80" : ""}`}
    >
      {!expired ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label={selected ? "Deselect item" : "Select item"}
          className="absolute left-3 top-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--acct-line)] bg-[var(--acct-bg)] text-[var(--acct-muted)] hover:text-[var(--acct-gold)]"
        >
          {selected ? <CheckSquare size={14} /> : <Square size={14} />}
        </button>
      ) : null}

      <div className="flex gap-3">
        {snapshot?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={snapshot.image}
            alt={snapshot?.title || "Saved item"}
            className="h-20 w-20 shrink-0 rounded-xl object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-20 w-20 shrink-0 rounded-xl bg-[var(--acct-surface)]" />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-[var(--acct-muted)]">
            {DIVISION_LABEL[item.division] || item.division}
          </p>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-[var(--acct-ink)]">
            {snapshot?.title || "Saved item"}
          </h3>
          {snapshot?.vendorName ? (
            <p className="mt-1 text-xs text-[var(--acct-muted)]">{snapshot.vendorName}</p>
          ) : null}
          {snapshot?.priceKobo != null ? (
            <p className="mt-2 text-base font-semibold text-[var(--acct-ink)]">
              {formatNaira(snapshot.priceKobo)}
            </p>
          ) : null}
        </div>
      </div>

      {isExpiring ? (
        <p className="rounded-lg bg-[var(--acct-gold-soft)] px-3 py-2 text-[0.65rem] font-semibold text-[var(--acct-gold)]">
          {daysToExpire <= 1 ? "Expires today" : `Expires in ${daysToExpire} days`}
        </p>
      ) : null}

      {expired ? (
        <p className="rounded-lg bg-[var(--acct-red-soft,#fde8e8)] px-3 py-2 text-[0.65rem] font-semibold text-[var(--acct-red)]">
          Expired — restore resets the 90-day window
        </p>
      ) : null}

      <div className="mt-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onRestore}
          disabled={busy !== "none"}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--acct-ink)] px-3 py-2 text-xs font-semibold text-[var(--acct-bg)] hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
        >
          {busy === "restore" ? "Moving..." : "Move to cart"}
          <ChevronRight size={12} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={busy !== "none"}
          aria-label="Remove from saved items"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--acct-line)] text-[var(--acct-muted)] hover:text-[var(--acct-red)] disabled:cursor-wait"
        >
          <Trash2 size={14} />
        </button>
        {snapshot?.href ? (
          <Link
            href={
              snapshot.href.startsWith("/")
                ? DIVISION_HOME[item.division]?.replace(/\/[^/]*$/, "") + snapshot.href
                : snapshot.href
            }
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--acct-line)] text-[var(--acct-muted)] hover:text-[var(--acct-gold)]"
            aria-label="Open original listing"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ChevronRight size={14} />
          </Link>
        ) : null}
      </div>
    </article>
  );
}
