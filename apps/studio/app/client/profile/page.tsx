import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink, MailIcon, ShieldCheck, UserCircle } from "lucide-react";

import { requireClientPortalViewer } from "@/lib/portal/auth";
import { getStudioAccountUrl } from "@/lib/studio/links";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ClientProfilePage() {
  const viewer = await requireClientPortalViewer("/client/profile");
  const accountUrl = getStudioAccountUrl();

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
          Account
        </div>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)] sm:text-3xl">
          Profile
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--studio-ink-soft)]">
          Your sign-in details and security settings live on the shared HenryCo account. Open it
          there to update your name, password, two-factor settings, and connected divisions.
        </p>
      </header>

      <section className="portal-card-elev flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-7">
        {viewer.avatarUrl ? (
          <Image
            src={viewer.avatarUrl}
            alt={viewer.fullName || "Profile"}
            width={64}
            height={64}
            unoptimized
            className="h-16 w-16 flex-shrink-0 rounded-2xl border border-[var(--studio-line-strong)] object-cover"
          />
        ) : (
          <span className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-2xl border border-[var(--studio-line-strong)] bg-[rgba(151,244,243,0.08)] text-[var(--studio-signal)]">
            <UserCircle className="h-8 w-8" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="text-[18px] font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
            {viewer.fullName || viewer.email || "Studio client"}
          </div>
          {viewer.email ? (
            <div className="mt-1 inline-flex items-center gap-1.5 text-[13px] text-[var(--studio-ink-soft)]">
              <MailIcon className="h-3.5 w-3.5" />
              {viewer.email}
            </div>
          ) : null}

          <div className="mt-5 grid gap-3">
            <ProfileLink
              icon={ExternalLink}
              title="Update profile"
              body="Change your name, avatar, and contact details on your HenryCo account."
              href={accountUrl}
              external
            />
            <ProfileLink
              icon={ShieldCheck}
              title="Security & sign-in"
              body="Update your password, manage two-factor authentication, and review active sessions."
              href={`${accountUrl}/security`}
              external
            />
            <ProfileLink
              icon={UserCircle}
              title="HenryCo account home"
              body="See all your divisions in one place — Studio, Care, Hub, and more."
              href={accountUrl}
              external
            />
          </div>
        </div>
      </section>

      <section className="portal-card p-5 sm:p-6">
        <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
          Need help?
        </h2>
        <p className="mt-2 text-[13px] leading-5 text-[var(--studio-ink-soft)]">
          For anything project-related, message the team directly inside your project. For account
          questions, billing escalations, or anything else, you can always reach support.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/contact" className="portal-button portal-button-secondary">
            Contact support
          </Link>
          <Link href="/client/messages" className="portal-button portal-button-ghost">
            Open inbox
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function ProfileLink({
  icon: Icon,
  title,
  body,
  href,
  external = false,
}: {
  icon: typeof UserCircle;
  title: string;
  body: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="flex items-start gap-3 rounded-2xl border border-[var(--studio-line)] bg-[rgba(255,255,255,0.03)] px-4 py-3 transition hover:border-[rgba(151,244,243,0.4)] hover:bg-[rgba(255,255,255,0.05)]"
    >
      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl border border-[var(--studio-line-strong)] bg-[rgba(255,255,255,0.04)] text-[var(--studio-ink-soft)]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold text-[var(--studio-ink)]">{title}</div>
        <div className="mt-0.5 text-[12.5px] leading-5 text-[var(--studio-ink-soft)]">{body}</div>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--studio-ink-soft)]" />
    </a>
  );
}
