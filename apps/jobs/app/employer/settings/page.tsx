import Link from "next/link";
import { Bell, Building2, MessageSquare, ShieldCheck, Wallet } from "lucide-react";
import { getAccountUrl, henryDomainHost } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n";
import { requireJobsRoles } from "@/lib/auth";
import { getEmployerDashboardData, getEmployerProfileBySlug } from "@/lib/jobs/data";
import { employerNav } from "@/lib/jobs/navigation";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { SectionCard, StatusPill, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

function toneForVerification(status: string) {
  if (status === "verified") return "good" as const;
  if (status === "watch" || status === "rejected") return "danger" as const;
  return "warn" as const;
}

/**
 * V3 follow-up — Employer settings is a directive hand-off surface, not a
 * decorative "Coming soon" tile. Names the canonical surface for each
 * setting category, deep-links to it, and shows current company status.
 */
export default async function EmployerSettingsPage() {
  const viewer = await requireJobsRoles(["employer", "admin", "owner"], "/employer/settings");
  const locale = await getJobsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const data = await getEmployerDashboardData(viewer.user!.id, viewer.user!.email, locale);
  const membership = data.memberships[0] ?? null;
  const companyRecord = membership
    ? await getEmployerProfileBySlug(membership.employerSlug, { includeUnpublished: true, locale })
    : null;
  const employer = companyRecord?.employer ?? null;
  const verificationStatus = String(employer?.verificationStatus ?? "pending");

  return (
    <WorkspaceShell
      area="employer"
      title={t("Employer Settings")}
      subtitle={t("Identity, hiring channels and billing — every change syncs to every job posting and every conversation.")}
      nav={employerNav}
      activeHref="/employer/settings"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
    >
      <SectionCard
        title={t("Company profile")}
        body={t("The canonical employer record. Logo, legal name, location, hiring contact and verification documents live here — every job posting reads from this single source.")}
        actions={
          <Link
            href="/employer/company"
            className="inline-flex h-10 items-center rounded-full bg-[var(--jobs-accent)] px-4 text-sm font-semibold text-white hover:bg-[var(--jobs-accent-strong)]"
          >
            {t("Open profile")}
          </Link>
        }
      >
        <div className="jobs-soft-panel flex flex-col gap-3 rounded-[1.5rem] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--jobs-accent-soft)] text-[var(--jobs-accent-strong)]">
              <Building2 size={20} aria-hidden />
            </span>
            <div>
              <p className="text-base font-semibold text-[var(--jobs-ink)]">
                {employer?.name ?? membership?.employerName ?? t("Set up your company")}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-[var(--jobs-muted)]">
                {employer?.slug
                  ? `${henryDomainHost("hub")}/employer/${employer.slug}`
                  : t("No public slug yet — set one in the company profile.")}
              </p>
            </div>
          </div>
          <StatusPill
            label={
              verificationStatus === "verified"
                ? t("Verified")
                : verificationStatus === "rejected"
                  ? t("Verification rejected")
                  : verificationStatus === "watch"
                    ? t("Under review")
                    : t("Verification pending")
            }
            tone={toneForVerification(verificationStatus)}
          />
        </div>
      </SectionCard>

      <SectionCard
        title={t("Conversations & alerts")}
        body={t("Applicant messages, interview reminders, and hiring alerts are all managed from your account preferences.")}
        actions={
          <Link
            href={getAccountUrl("/settings/notifications")}
            className="inline-flex h-10 items-center rounded-full border border-[var(--jobs-line)] bg-white px-4 text-sm font-semibold text-[var(--jobs-ink)] hover:bg-[var(--jobs-paper-soft)]"
          >
            {t("Manage channels")}
          </Link>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="jobs-soft-panel rounded-[1.5rem] p-4">
            <div className="jobs-kicker flex items-center gap-2">
              <MessageSquare size={14} aria-hidden /> {t("Applicant messages")}
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--jobs-muted)]">
              {t("Every applicant thread appears in your conversations inbox and in your unified messages view across Henry Onyx.")}
            </p>
          </div>
          <div className="jobs-soft-panel rounded-[1.5rem] p-4">
            <div className="jobs-kicker flex items-center gap-2">
              <Bell size={14} aria-hidden /> {t("Hiring alerts")}
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--jobs-muted)]">
              {t("Email, WhatsApp and in-app notifications — quiet hours and digest cadence are set in your account preferences.")}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={t("Plan & billing")}
        body={t("Posting credits, featured-listing add-ons and team-seat billing are part of the unified Henry Onyx wallet — same balance, same payout history, same KYC tier.")}
        actions={
          <Link
            href={getAccountUrl("/wallet")}
            className="inline-flex h-10 items-center rounded-full border border-[var(--jobs-line)] bg-white px-4 text-sm font-semibold text-[var(--jobs-ink)] hover:bg-[var(--jobs-paper-soft)]"
          >
            {t("Open wallet")}
          </Link>
        }
      >
        <div className="jobs-soft-panel rounded-[1.5rem] p-4">
          <div className="jobs-kicker flex items-center gap-2">
            <Wallet size={14} aria-hidden /> {t("Posting credits")}
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--jobs-muted)]">
            {t("Posting credits and listing fees draw from your Henry Onyx wallet. For team billing, contact support.")}
          </p>
        </div>
      </SectionCard>

      <SectionCard
        title={t("Identity & access")}
        body={t("Your identity, password, and session security apply across every Henry Onyx service you use — manage them from your account.")}
        actions={
          <Link
            href={getAccountUrl("/security")}
            className="inline-flex h-10 items-center rounded-full border border-[var(--jobs-line)] bg-white px-4 text-sm font-semibold text-[var(--jobs-ink)] hover:bg-[var(--jobs-paper-soft)]"
          >
            {t("Open security")}
          </Link>
        }
      >
        <div className="jobs-soft-panel rounded-[1.5rem] p-4">
          <div className="jobs-kicker flex items-center gap-2">
            <ShieldCheck size={14} aria-hidden /> {t("Single identity across Henry Onyx")}
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--jobs-muted)]">
            {t("Sign in once at Henry Onyx and access Jobs as employer, Care as a customer, Studio as a buyer — all from the same identity. Security settings (password, MFA, signed-out sessions) live at the account hub.")}
          </p>
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
