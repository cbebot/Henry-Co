import { MapPin } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getCanonicalUserAddresses } from "@/lib/account-data";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";
import AddressManagerClient from "@/components/addresses/AddressManagerClient";
import type { UserAddressRecord } from "@henryco/address-selector";

export const dynamic = "force-dynamic";

export default async function SettingsAddressesPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const addresses = (await getCanonicalUserAddresses(user.id)) as UserAddressRecord[];

  const copy =
    locale === "fr"
      ? {
          title: "Adresses",
          description:
            "Une seule adresse par type (maison, bureau, boutique...). Vérifiée avec votre KYC et réutilisée dans toutes les divisions.",
        }
      : {
          title: "Addresses",
          description:
            "One address per type (home, office, shop, warehouse, alternative). Verified against your KYC and reused across every HenryCo division.",
        };

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader title={copy.title} description={copy.description} icon={MapPin} />
      <AddressManagerClient addresses={addresses} countryHint="ng" />
    </div>
  );
}
