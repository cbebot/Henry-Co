import { getAccountCopy } from "@henryco/i18n/server";
import { HeroCard, DivisionLanding } from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";
import { getCanonicalUserAddresses } from "@/lib/account-data";
import AddressManagerClient from "@/components/addresses/AddressManagerClient";
import type { UserAddressRecord } from "@henryco/address-selector";

export const dynamic = "force-dynamic";

/**
 * Addresses landing.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2D). Drops the legacy PageHeader +
 * inline `if (locale === "fr")` ternary; consumes the existing
 * `accountCopy.addresses.hero` slice. Compact HeroCard since this is a
 * form-only surface.
 */
export default async function AddressesPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const copy = getAccountCopy(locale).addresses;
  const addresses = (await getCanonicalUserAddresses(user.id)) as UserAddressRecord[];

  return (
    <DivisionLanding
      className="acct-fade-in"
      hero={
        <HeroCard
          variant="compact"
          tone={addresses.length === 0 ? "empty" : "calm"}
          eyebrow={copy.metadata.title}
          headline={copy.hero.title}
          blurb={copy.hero.description}
        />
      }
      sections={[
        {
          id: "addresses-manager",
          title: copy.metadata.title,
          meta: addresses.length === 0 ? copy.empty.body : `${addresses.length}`,
          content: <AddressManagerClient addresses={addresses} countryHint="ng" />,
        },
      ]}
    />
  );
}
