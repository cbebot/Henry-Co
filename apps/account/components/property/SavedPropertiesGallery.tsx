import { MapPin } from "lucide-react";

import { formatAccountTemplate } from "@henryco/i18n";

import {
  formatMoney,
  formatRoomCount,
  formatStamp,
  type RoomCountLabels,
} from "./helpers";

export type SavedPropertyCard = {
  listingId: string;
  slug: string;
  title: string;
  location: string | null;
  district: string | null;
  kind: string | null;
  status: string | null;
  price: number | null;
  currency: string;
  priceInterval: string | null;
  heroImage: string | null;
  managedByHenryCo?: boolean;
  featured?: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqm: number | null;
  savedAt: string;
  detailUrl: string;
};

export type SavedPropertiesGalleryCopy = RoomCountLabels & {
  ariaLabel: string;
  managedBadge: string;
  featuredBadge: string;
  locationPending: string;
  contactAgent: string;
  savedAtTemplate: string;
};

type Props = {
  saved: ReadonlyArray<SavedPropertyCard>;
  emptyTitle: string;
  emptyBody: string;
  copy: SavedPropertiesGalleryCopy;
};

export function SavedPropertiesGallery({ saved, emptyTitle, emptyBody, copy }: Props) {
  if (saved.length === 0) {
    return (
      <div className="acct-prop__empty">
        <strong>{emptyTitle}</strong>
        {emptyBody}
      </div>
    );
  }
  const roomCountLabels: RoomCountLabels = {
    bedSingular: copy.bedSingular,
    bedPlural: copy.bedPlural,
    bathSingular: copy.bathSingular,
    bathPlural: copy.bathPlural,
    sizeSqmTemplate: copy.sizeSqmTemplate,
  };
  return (
    <div className="acct-prop__grid" role="list" aria-label={copy.ariaLabel}>
      {saved.slice(0, 8).map((card) => {
        const roomLine = formatRoomCount(card.bedrooms, card.bathrooms, card.sizeSqm, roomCountLabels);
        const locationText = card.location || card.district || copy.locationPending;
        return (
          <a
            key={card.listingId}
            href={card.detailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="acct-prop__listing"
            role="listitem"
            aria-label={`${card.title} · ${locationText}`}
          >
            <div className="acct-prop__listing-image">
              {card.heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.heroImage} alt={card.title} loading="lazy" decoding="async" />
              ) : (
                <div className="acct-prop__listing-image-placeholder">
                  <MapPin size={20} aria-hidden />
                </div>
              )}
              <div className="acct-prop__listing-badges">
                {card.managedByHenryCo ? (
                  <span className="acct-prop__listing-badge" data-tone="info">{copy.managedBadge}</span>
                ) : null}
                {card.featured ? (
                  <span className="acct-prop__listing-badge" data-tone="good">{copy.featuredBadge}</span>
                ) : null}
              </div>
            </div>
            <div className="acct-prop__listing-body">
              <h3 className="acct-prop__listing-title">{card.title}</h3>
              <p className="acct-prop__listing-meta">
                {locationText}
                {roomLine ? ` · ${roomLine}` : ""}
              </p>
              <div className="acct-prop__listing-price-row">
                <span className="acct-prop__listing-price">
                  {formatMoney(card.price, card.currency, copy.contactAgent)}
                </span>
                {card.priceInterval ? (
                  <span className="acct-prop__listing-price-interval">{card.priceInterval}</span>
                ) : null}
              </div>
              <span className="acct-prop__listing-saved-stamp">
                {formatAccountTemplate(copy.savedAtTemplate, { date: formatStamp(card.savedAt) })}
              </span>
            </div>
          </a>
        );
      })}
    </div>
  );
}
