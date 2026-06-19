import Link from "next/link";
import { notFound } from "next/navigation";
import { SUPPORTED_COUNTRIES, henryDomain, toBrandName } from "@henryco/config";
import { getBusinessCopy } from "@henryco/i18n/server";
import type { AppLocale } from "@henryco/i18n";
import { HeroCard, DivisionLanding, type HeroCardTile } from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";
import { businessVerificationStatus, getBusinessMembershipBySlug } from "@/lib/business";
import BusinessProfileForm from "@/components/business/BusinessProfileForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: toBrandName(`${slug} · Business · HenryCo`) };
}

export default async function BusinessProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, user, locale] = await Promise.all([
    params,
    requireAccountUser(),
    getAccountAppLocale(),
  ]);
  void user;
  const copy = getBusinessCopy(locale as AppLocale);
  const membership = await getBusinessMembershipBySlug(slug);
  if (!membership) notFound();

  const { business, role } = membership;
  const canEdit = role === "owner" || role === "admin";
  const verification = businessVerificationStatus(business);
  const verified = verification === "verified";
  const countries = SUPPORTED_COUNTRIES.map((c) => ({ code: c.code, name: c.name }));
  const publicUrl = business.status === "active" ? henryDomain("marketplace", `/business/${business.slug}`) : null;

  const tiles: ReadonlyArray<HeroCardTile> = [
    { label: copy.roles[role], value: copy.profile.status, foot: copy.status[business.status], tone: "default" },
    {
      label: copy.profile.status,
      value: copy.status[business.status],
      tone: business.status === "active" ? "active" : "warning",
    },
    {
      label: copy.profile.verified,
      value: verified ? copy.profile.verified : copy.profile.unverified,
      tone: verified ? "accent" : "warning",
    },
  ];

  return (
    <DivisionLanding
      hero={
        <HeroCard
          variant="paired"
          tone={business.status === "active" ? "active" : "calm"}
          eyebrow={toBrandName("HenryCo · Business")}
          headline={business.tradingName || business.legalName}
          blurb={business.legalName}
          ariaLabel={business.tradingName || business.legalName}
          tiles={tiles}
          side={{
            kicker: copy.profile.country,
            title: business.country,
            body: copy.partnerType[business.partnerType],
          }}
        />
      }
      sections={[
        {
          id: "business-links",
          title: copy.common.business,
          meta: copy.roles[role],
          content: (
            <div className="flex flex-wrap gap-3">
              <Link href={`/business/${slug}/team`} className={cardLinkCls}>
                {copy.team.title}
              </Link>
              <Link href={`/business/${slug}/insights`} className={cardLinkCls}>
                {copy.insights.title}
              </Link>
              {publicUrl ? (
                <a href={publicUrl} target="_blank" rel="noreferrer" className={cardLinkCls}>
                  {copy.profile.publicUrl}
                </a>
              ) : null}
            </div>
          ),
        },
        {
          id: "business-profile",
          title: copy.profile.editTitle,
          meta: canEdit ? copy.roles[role] : copy.roles.member,
          content: canEdit ? (
            <BusinessProfileForm
              slug={slug}
              copy={{
                tradingName: copy.profile.tradingName,
                registration: copy.profile.registration,
                country: copy.profile.country,
                save: copy.profile.saveChanges,
              }}
              countries={countries}
              initial={{
                tradingName: business.tradingName ?? "",
                registration: business.registration ?? "",
                country: business.country,
              }}
            />
          ) : (
            <dl className="grid gap-3 sm:grid-cols-2">
              <ReadRow label={copy.profile.legalName} value={business.legalName} />
              <ReadRow label={copy.profile.tradingName} value={business.tradingName ?? "—"} />
              <ReadRow label={copy.profile.country} value={business.country} />
              <ReadRow label={copy.profile.partnerType} value={copy.partnerType[business.partnerType]} />
            </dl>
          ),
        },
      ]}
    />
  );
}

const cardLinkCls =
  "rounded-md border border-[color:var(--hc-border,#e5e7eb)] px-4 py-2 text-sm font-medium text-[color:var(--hc-text,#111827)] hover:border-[color:var(--hc-accent,#111827)]";

function ReadRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[color:var(--hc-text-muted,#6b7280)]">{label}</dt>
      <dd className="text-sm text-[color:var(--hc-text,#111827)]">{value}</dd>
    </div>
  );
}
