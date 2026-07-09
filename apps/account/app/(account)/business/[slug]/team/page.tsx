import { notFound } from "next/navigation";
import { toBrandName } from "@henryco/config";
import { getBusinessCopy } from "@henryco/i18n/server";
import type { AppLocale } from "@henryco/i18n";
import { HeroCard, DivisionLanding } from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";
import {
  getBusinessInvitations,
  getBusinessMembers,
  getBusinessMembershipBySlug,
} from "@/lib/business";
import InviteMemberForm from "@/components/business/InviteMemberForm";
import MemberActions from "@/components/business/MemberActions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: toBrandName(`Team · ${slug} · Henry Onyx`) };
}

export default async function BusinessTeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, user, locale] = await Promise.all([
    params,
    requireAccountUser(),
    getAccountAppLocale(),
  ]);
  const copy = getBusinessCopy(locale as AppLocale);
  const membership = await getBusinessMembershipBySlug(slug);
  if (!membership) notFound();

  const { business, role } = membership;
  const canManage = role === "owner" || role === "admin";
  const isOwner = role === "owner";

  const [members, invitations] = await Promise.all([
    getBusinessMembers(business.id),
    canManage ? getBusinessInvitations(business.id) : Promise.resolve([]),
  ]);

  const sections = [
    {
      id: "team-members",
      title: copy.team.membersHeading,
      meta: `${members.length}`,
      content: (
        <ul className="divide-y divide-[color:var(--hc-border,#e5e7eb)]">
          {members.map((m) => {
            const isSelf = m.userId === user.id;
            return (
              <li key={m.userId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <span className="block text-sm font-medium text-[color:var(--hc-text,#111827)]">
                    {m.displayName || m.email || m.userId}
                    {isSelf ? ` (${copy.team.you})` : ""}
                  </span>
                  <span className="text-xs text-[color:var(--hc-text-muted,#6b7280)]">{copy.roles[m.role]}</span>
                </div>
                {isOwner && !isSelf && m.role !== "owner" ? (
                  <MemberActions
                    slug={slug}
                    userId={m.userId}
                    role={m.role}
                    copy={{
                      remove: copy.team.remove,
                      makeAdmin: `${copy.team.changeRole}: ${copy.roles.admin}`,
                      makeMember: `${copy.team.changeRole}: ${copy.roles.member}`,
                      error: copy.errors.generic,
                    }}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      ),
    },
  ];

  if (canManage) {
    sections.push({
      id: "team-pending",
      title: copy.team.pendingHeading,
      meta: `${invitations.length}`,
      content:
        invitations.length === 0 ? (
          <p className="text-sm text-[color:var(--hc-text-muted,#6b7280)]">{copy.team.emptyPending}</p>
        ) : (
          <ul className="divide-y divide-[color:var(--hc-border,#e5e7eb)]">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 py-3">
                <span className="text-sm text-[color:var(--hc-text,#111827)]">{inv.email}</span>
                <span className="text-xs text-[color:var(--hc-text-muted,#6b7280)]">{copy.roles[inv.role]}</span>
              </li>
            ))}
          </ul>
        ),
    });
    sections.push({
      id: "team-invite",
      title: copy.team.invite.cta,
      meta: isOwner ? copy.roles.owner : copy.roles.admin,
      content: (
        <InviteMemberForm
          slug={slug}
          canInviteAdmin={isOwner}
          copy={{
            email: copy.team.invite.email,
            role: copy.team.invite.role,
            send: copy.team.invite.send,
            roleAdmin: copy.roles.admin,
            roleMember: copy.roles.member,
            hint: isOwner ? copy.team.invite.hint : copy.team.invite.adminHint,
          }}
        />
      ),
    });
  }

  return (
    <DivisionLanding
      hero={
        <HeroCard
          variant="paired"
          tone="active"
          eyebrow={business.tradingName || business.legalName}
          headline={copy.team.title}
          blurb={copy.team.subtitle}
          ariaLabel={copy.team.title}
          tiles={[{ label: copy.team.membersHeading, value: members.length, tone: "active" }]}
          side={{ kicker: copy.roles[role], title: copy.team.membersHeading, body: `${members.length}` }}
        />
      }
      sections={sections}
    />
  );
}
