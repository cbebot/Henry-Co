"use client";

import type { ReactNode } from "react";
import { PublicHeader, type PublicHeaderProps } from "./public-header";
import { getSiteNavigationConfig } from "./navigation/registry";
import type { PublicNavigationSiteId } from "./navigation/types";

type ConfiguredProps = {
  siteId: PublicNavigationSiteId;
  brand: PublicHeaderProps["brand"];
  accountMenu?: ReactNode;
  items?: PublicHeaderProps["items"];
} & Partial<Omit<PublicHeaderProps, "brand" | "accountMenu" | "items">>;

/**
 * Renders `PublicHeader` from a registered {@link PublicNavigationSiteId} config
 * (primary links + default CTAs). Pass overrides for any `PublicHeader` prop.
 */
export function ConfiguredPublicHeader({
  siteId,
  items: itemsOverride,
  accountMenu,
  brand,
  primaryCta,
  secondaryCta,
  auxLink,
  variant,
  ...rest
}: ConfiguredProps) {
  const cfg = getSiteNavigationConfig(siteId);
  const items = itemsOverride ?? [...cfg.primaryNav];

  return (
    <PublicHeader
      brand={brand}
      items={items}
      accountMenu={accountMenu}
      primaryCta={primaryCta ?? cfg.defaultCtas?.primary}
      secondaryCta={secondaryCta ?? cfg.defaultCtas?.secondary}
      auxLink={auxLink ?? cfg.defaultCtas?.aux}
      variant={variant ?? cfg.headerVariant ?? "default"}
      {...rest}
    />
  );
}
