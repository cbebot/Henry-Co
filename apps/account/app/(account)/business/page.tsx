import Link from "next/link";
import { SUPPORTED_COUNTRIES, toBrandName } from "@henryco/config";
import { getBusinessCopy } from "@henryco/i18n/server";
import type { AppLocale } from "@henryco/i18n";
import { resolveActingContext } from "@henryco/auth/server/acting-context";
import { HeroCard, DivisionLanding, type HeroCardTile } from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";
import { listMyBusinesses } from "@/lib/business";
import CreateBusinessForm from "@/components/business/CreateBusinessForm";
import BusinessContextSwitcher from "@/components/business/BusinessContextSwitcher";

export const dynamic = "force-dynamic";

export const metadata = {
  title: toBrandName("Business · Henry Onyx"),
  description: "Create and manage your business — a verified company identity beside your personal account.",
};

export default async function BusinessLandingPage() {
  const [user, locale] = await Promise.all([requireAccountUser(), getAccountAppLocale()]);
  void user;
  const copy = getBusinessCopy(locale as AppLocale);
  const [businesses, acting] = await Promise.all([listMyBusinesses(), resolveActingContext()]);

  const countries = SUPPORTED_COUNTRIES.map((c) => ({ code: c.code, name: c.name }));
  const partnerTypes = (
    ["marketplace_seller", "service_provider", "employer", "studio_client", "logistics_shipper"] as const
  ).map((value) => ({ value, label: copy.partnerType[value] }));

  const switcherBusinesses = businesses.map((m) => ({
    id: m.business.id,
    slug: m.business.slug,
    name: m.business.tradingName || m.business.legalName,
  }));

  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: copy.common.business,
      value: businesses.length,
      foot: businesses.length === 0 ? copy.profile.create.subtitle : copy.team.title,
      tone: businesses.length > 0 ? "active" : "default",
    },
  ];

  return (
    <DivisionLanding
      hero={
        <HeroCard
          variant="paired"
          tone={businesses.length === 0 ? "empty" : "active"}
          eyebrow={toBrandName("Henry Onyx · Business")}
          headline={copy.common.business}
          blurb={copy.team.subtitle}
          ariaLabel={copy.common.business}
          tiles={tiles}
          side={{
            kicker: copy.common.business,
            title: copy.profile.create.title,
            body: copy.profile.create.subtitle,
          }}
        />
      }
      sections={[
        {
          id: "business-switcher",
          title: copy.common.switchToBusiness,
          meta: acting.kind === "business" ? copy.common.business : copy.common.personal,
          content: (
            <BusinessContextSwitcher
              businesses={switcherBusinesses}
              activeBusinessId={acting.kind === "business" ? acting.businessId : null}
              copy={{
                actingAsPersonal: copy.common.actingAsPersonal,
                actingAsBusiness: copy.common.actingAsBusiness,
                personal: copy.common.personal,
                switchLabel: copy.common.switchToBusiness,
                error: copy.errors.generic,
              }}
            />
          ),
        },
        {
          id: "business-list",
          title: copy.team.membersHeading,
          meta: `${businesses.length}`,
          content:
            businesses.length === 0 ? (
              <p className="text-sm text-[color:var(--hc-text-muted,#6b7280)]">{copy.profile.emptyListings}</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {businesses.map((m) => (
                  <li key={m.business.id}>
                    <Link
                      href={`/business/${m.business.slug}`}
                      className="block rounded-lg border border-[color:var(--hc-border,#e5e7eb)] p-4 hover:border-[color:var(--hc-accent,#111827)]"
                    >
                      <span className="block font-medium text-[color:var(--hc-text,#111827)]">
                        {m.business.tradingName || m.business.legalName}
                      </span>
                      <span className="mt-1 block text-xs text-[color:var(--hc-text-muted,#6b7280)]">
                        {copy.roles[m.role]} · {copy.status[m.business.status]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ),
        },
        {
          id: "business-create",
          title: copy.profile.create.title,
          meta: copy.common.business,
          content: <CreateBusinessForm copy={copy.profile.create} countries={countries} partnerTypes={partnerTypes} />,
        },
      ]}
    />
  );
}
