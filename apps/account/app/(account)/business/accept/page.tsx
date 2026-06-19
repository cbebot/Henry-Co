import { toBrandName } from "@henryco/config";
import { getBusinessCopy } from "@henryco/i18n/server";
import type { AppLocale } from "@henryco/i18n";
import { HeroCard, DivisionLanding } from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";
import AcceptInvitationButton from "@/components/business/AcceptInvitationButton";

export const dynamic = "force-dynamic";

export const metadata = { title: toBrandName("Join a business · HenryCo") };

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ token }, user, locale] = await Promise.all([
    searchParams,
    requireAccountUser(),
    getAccountAppLocale(),
  ]);
  void user;
  const copy = getBusinessCopy(locale as AppLocale);
  const validToken = typeof token === "string" ? token : "";

  return (
    <DivisionLanding
      hero={
        <HeroCard
          variant="paired"
          tone="active"
          eyebrow={toBrandName("HenryCo · Business")}
          headline={copy.team.accept.title}
          blurb={copy.team.subtitle}
          ariaLabel={copy.team.accept.title}
          tiles={[{ label: copy.common.business, value: copy.team.title, tone: "active" }]}
          side={{ kicker: copy.common.business, title: copy.team.accept.title, body: copy.team.subtitle }}
        />
      }
      sections={[
        {
          id: "accept-invitation",
          title: copy.team.accept.title,
          meta: copy.common.business,
          content: validToken ? (
            <AcceptInvitationButton
              token={validToken}
              label={copy.team.accept.cta}
              copy={{ invalid: copy.errors.invalidInvitation }}
            />
          ) : (
            <p className="text-sm text-[color:var(--hc-danger,#b91c1c)]">{copy.errors.invalidInvitation}</p>
          ),
        },
      ]}
    />
  );
}
