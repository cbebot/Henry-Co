"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { Building2, Clock3, ExternalLink, HeartOff, MapPin, MessageCircleMore, Scale, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import type { SavedPropertyCard } from "@/lib/property-module";
import EmptyState from "@/components/layout/EmptyState";

type SavedPropertiesBoardProps = {
  initialProperties: SavedPropertyCard[];
  propertyOrigin: string;
};

function formatPrice(amount: number, currency: string, interval: string) {
  const formatted = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);

  if (!interval || interval === "once") {
    return formatted;
  }

  return `${formatted} / ${interval.replace(/[_-]+/g, " ")}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function prettifyKind(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function prettifyStatus(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

export default function SavedPropertiesBoard({
  initialProperties,
  propertyOrigin,
}: SavedPropertiesBoardProps) {
  const router = useRouter();
  const [properties, setProperties] = useState(initialProperties);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const compareItems = compareIds
    .map((id) => properties.find((property) => property.listingId === id))
    .filter(Boolean) as SavedPropertyCard[];

  function toggleCompare(listingId: string) {
    setError(null);
    setCompareIds((current) => {
      if (current.includes(listingId)) {
        return current.filter((item) => item !== listingId);
      }

      if (current.length >= 3) {
        setError("You can compare up to three saved properties at once.");
        return current;
      }

      return [...current, listingId];
    });
  }

  async function handleRemove(listingId: string) {
    setError(null);
    setRemovingId(listingId);

    try {
      const response = await fetch(`/api/property/saved/${listingId}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Saved property could not be removed.");
      }

      startTransition(() => {
        setProperties((current) => current.filter((property) => property.listingId !== listingId));
        setCompareIds((current) => current.filter((item) => item !== listingId));
        router.refresh();
      });
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Saved property could not be removed.");
    } finally {
      setRemovingId(null);
    }
  }

  if (properties.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No saved properties yet"
        description="Start exploring HenryCo Property and the best listings you save will appear here with compare, inquiry, and follow-up actions."
        action={
          <a
            href={propertyOrigin}
            target="_blank"
            rel="noopener noreferrer"
            className="acct-button-primary rounded-xl"
          >
            Explore Property <ExternalLink size={14} />
          </a>
        }
      />
    );
  }

  return (
    <div className={`space-y-5 ${compareItems.length > 0 ? "pb-32" : ""}`}>
      {error ? (
        <div className="rounded-[1.4rem] border border-[var(--acct-red)]/20 bg-[var(--acct-red-soft)] px-4 py-3 text-sm text-[var(--acct-red)]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {properties.map((property) => {
          const selected = compareIds.includes(property.listingId);
          const removing = removingId === property.listingId;

          return (
            <article
              key={property.listingId}
              className="overflow-hidden rounded-[2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] shadow-[0_16px_48px_rgba(15,23,42,0.08)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-[var(--acct-surface)]">
                {property.heroImage ? (
                  <Image
                    src={property.heroImage}
                    alt={property.title}
                    fill
                    sizes="(min-width: 1280px) 40vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#e8ecf4_0%,#f9f2e1_100%)]">
                    <Building2 size={36} className="text-[var(--acct-muted)]" />
                  </div>
                )}
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[rgba(255,255,255,0.94)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--acct-ink)]">
                    {prettifyStatus(property.status)}
                  </span>
                  <span className="rounded-full bg-[rgba(10,18,32,0.72)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white">
                    {prettifyKind(property.kind)}
                  </span>
                  {property.managedByHenryCo ? (
                    <span className="rounded-full bg-[var(--acct-green-soft)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--acct-green)]">
                      Managed by HenryCo
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-[var(--acct-ink)]">{property.title}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--acct-muted)]">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} />
                        {property.location}
                      </span>
                      <span>{property.district}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-[var(--acct-ink)]">
                      {formatPrice(property.price, property.currency, property.priceInterval)}
                    </p>
                    <p className="mt-1 text-[0.72rem] text-[var(--acct-muted)]">
                      Saved {formatDate(property.savedAt)}
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-7 text-[var(--acct-muted)]">{property.summary}</p>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.2rem] bg-[var(--acct-surface)] px-4 py-3">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--acct-muted)]">
                      Listing type
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">
                      {prettifyKind(property.kind)}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] bg-[var(--acct-surface)] px-4 py-3">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--acct-muted)]">
                      Last updated
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">
                      {formatDate(property.lastUpdatedAt)}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] bg-[var(--acct-surface)] px-4 py-3">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--acct-muted)]">
                      Fit summary
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">
                      {property.bedrooms ? `${property.bedrooms} bed` : "Flexible"}
                      {property.bathrooms ? ` · ${property.bathrooms} bath` : ""}
                      {property.sizeSqm ? ` · ${property.sizeSqm} sqm` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href={property.detailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="acct-button-primary rounded-xl"
                  >
                    Open details <ExternalLink size={14} />
                  </a>
                  <a
                    href={property.inquiryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="acct-button-secondary rounded-xl"
                  >
                    Contact / inquire <MessageCircleMore size={14} />
                  </a>
                  <button
                    type="button"
                    onClick={() => toggleCompare(property.listingId)}
                    className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                      selected
                        ? "border-[var(--acct-blue)] bg-[var(--acct-blue-soft)] text-[var(--acct-blue)]"
                        : "border-[var(--acct-line)] bg-white text-[var(--acct-ink)] hover:border-[var(--acct-blue)]/30"
                    }`}
                  >
                    <Scale size={14} className="mr-2 inline-flex" />
                    {selected ? "In compare" : "Compare"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRemove(property.listingId)}
                    disabled={removing || isPending}
                    className="rounded-xl border border-[var(--acct-red)]/20 bg-[var(--acct-red-soft)] px-4 py-2 text-sm font-semibold text-[var(--acct-red)] transition hover:border-[var(--acct-red)]/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <HeartOff size={14} className="mr-2 inline-flex" />
                    {removing ? "Removing..." : "Remove from saved"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {compareItems.length > 0 ? (
        <section className="sticky bottom-4 z-20 rounded-[1.8rem] border border-[var(--acct-line)] bg-[rgba(255,255,255,0.96)] p-5 shadow-[0_18px_48px_rgba(15,23,42,0.14)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="acct-kicker">Compare tray</p>
              <h3 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">
                {compareItems.length === 1
                  ? "Select one or two more properties to compare side by side."
                  : "Saved properties side by side"}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="rounded-xl border border-[var(--acct-line)] px-4 py-2 text-sm font-semibold text-[var(--acct-muted)] transition hover:border-[var(--acct-gold)]/30 hover:text-[var(--acct-ink)]"
            >
              Clear compare
            </button>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {compareItems.map((property) => (
              <div key={property.listingId} className="rounded-[1.35rem] bg-[var(--acct-surface)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{property.title}</p>
                    <p className="mt-1 text-xs text-[var(--acct-muted)]">{property.location}</p>
                  </div>
                  {property.managedByHenryCo ? (
                    <ShieldCheck size={16} className="text-[var(--acct-green)]" />
                  ) : null}
                </div>

                <div className="mt-4 space-y-2 text-sm text-[var(--acct-muted)]">
                  <p><span className="font-semibold text-[var(--acct-ink)]">Price:</span> {formatPrice(property.price, property.currency, property.priceInterval)}</p>
                  <p><span className="font-semibold text-[var(--acct-ink)]">Status:</span> {prettifyStatus(property.status)}</p>
                  <p><span className="font-semibold text-[var(--acct-ink)]">Type:</span> {prettifyKind(property.kind)}</p>
                  <p><span className="font-semibold text-[var(--acct-ink)]">Bedrooms:</span> {property.bedrooms ?? "N/A"}</p>
                  <p><span className="font-semibold text-[var(--acct-ink)]">Bathrooms:</span> {property.bathrooms ?? "N/A"}</p>
                  <p><span className="font-semibold text-[var(--acct-ink)]">Size:</span> {property.sizeSqm ? `${property.sizeSqm} sqm` : "Not listed"}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={property.detailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-[var(--acct-ink)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Open details
                  </a>
                  <button
                    type="button"
                    onClick={() => toggleCompare(property.listingId)}
                    className="rounded-xl border border-[var(--acct-line)] px-4 py-2 text-sm font-semibold text-[var(--acct-muted)] transition hover:text-[var(--acct-ink)]"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-[var(--acct-muted)]">
            <Clock3 size={14} />
            Compare uses your live saved shortlist, so removing or updating a listing here stays consistent with the Property experience.
          </div>
        </section>
      ) : null}
    </div>
  );
}
