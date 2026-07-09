import Link from "next/link";
import { headers } from "next/headers";
import {
  JOBS_ROLE_VOCAB,
  resolveChromePlan,
  standingFromRoles,
  type AwareAction,
} from "@henryco/aware";
import { COMPANY, getAccountUrl, getDivisionConfig, getHubUrl } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n";
import { getJobsPublicCopy } from "@/lib/public-copy";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { HenryCoPublicAccountPresets } from "@henryco/ui";
import { PublicSiteFooter } from "@henryco/ui/public-design";
import { HenryCoMonogram } from "@henryco/ui/brand";
import { PublicChrome, getSiteNavigationConfig } from "@henryco/ui/public-shell";
import { JobsAccountChip } from "@/components/JobsAccountChip";
import { fraunces, manrope, JOBS_PUBLIC_THEME_STYLE } from "@/components/jobs-public-theme";
import {
  getSharedAccountJobsUrl,
  getSharedAccountLoginUrl,
  getSharedAccountSignupUrl,
  normalizeJobsPath,
} from "@/lib/account";
import { getJobsViewer } from "@/lib/auth";

const jobs = getDivisionConfig("jobs");
const accountJobsUrl = getSharedAccountJobsUrl();

/**
 * Jobs public shell — V3-PUBLIC-REBUILD-jobs.
 *
 * The marketing surface now rides the locked --home-* design system through
 * JOBS_PUBLIC_THEME_STYLE (teal soul, Fraunces display) and wears the shared,
 * theme-aware `PublicChrome` instead of the generic PublicHeader. Brand reads
 * "JOBS / Henry Onyx"; the account dropdown + sign-out are preserved via the
 * slotted JobsAccountChip; the page flips light⇄dark with device/toggle.
 */
export async function PublicShell({
  children,
  primaryCta,
  secondaryCta,
}: {
  children: React.ReactNode;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}) {
  const locale = await getJobsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const copy = getJobsPublicCopy(locale);
  const viewer = await getJobsViewer();

  // AWARE-SP1: chrome follows the viewer's STANDING, not just their session —
  // an employer's primary action is their workspace, a candidate's is the hub,
  // a visitor's is the catalog. Policy lives in @henryco/aware (tested matrix),
  // not in per-page conditionals.
  const standing = standingFromRoles(
    { signedIn: Boolean(viewer.user), roles: viewer.roles },
    JOBS_ROLE_VOCAB,
  );
  const plan = resolveChromePlan("jobs", standing);
  // Routes that already carry Pattern-A copy keep those localized labels;
  // aware-only labels ("Your employer workspace") localize via t().
  const copyLabelByHref: Record<string, string> = {
    "/jobs": copy.home.browseJobs,
    "/candidate": copy.home.candidateHub,
    "/candidate/saved-jobs": copy.shell.savedJobs,
    "/hire": copy.home.hireWithHenryCo,
  };
  const localizeAction = (action: AwareAction) => ({
    label: copyLabelByHref[action.href] ?? t(action.label),
    href: action.href,
  });
  const resolvedPrimary = primaryCta ?? localizeAction(plan.primaryCta);
  const resolvedSecondary = secondaryCta ?? (plan.aside ? localizeAction(plan.aside) : undefined);
  const h = await headers();
  const returnPath = h.get("x-jobs-return-path") || "/";
  const loginHref = getSharedAccountLoginUrl(normalizeJobsPath(returnPath));
  const signupHref = getSharedAccountSignupUrl(normalizeJobsPath(returnPath));
  const chipUser = viewer.user
    ? {
        displayName: viewer.user.fullName || viewer.user.email || "Your account",
        email: viewer.user.email,
        avatarUrl: viewer.user.avatarUrl,
      }
    : null;

  return (
    <div
      className={`${fraunces.variable} ${manrope.variable} jobs-shell home-accent-scope flex min-h-screen flex-col text-[color:var(--home-ink)]`}
      style={JOBS_PUBLIC_THEME_STYLE}
    >
      <PublicChrome
        maxWidth="max-w-[92rem]"
        accentStyle={JOBS_PUBLIC_THEME_STYLE}
        brand={{
          href: "/",
          // "<DIVISION> / Henry Onyx" — eyebrow = the division, name = the brand.
          name: COMPANY.group.name,
          eyebrow: jobs.shortName,
          mark: <HenryCoMonogram size={22} accent={jobs.accent || "#0E7C86"} />,
        }}
        items={[...getSiteNavigationConfig("jobs").primaryNav]}
        search={{ href: getHubUrl("/search"), label: "Search Henry Onyx" }}
        account={{
          user: chipUser,
          loginHref,
          signupHref,
          accountHref: accountJobsUrl,
        }}
        accountMenu={
          chipUser ? (
            <JobsAccountChip
              {...HenryCoPublicAccountPresets.standard}
              user={chipUser}
              loginHref={loginHref}
              accountHref={accountJobsUrl}
              preferencesHref={getAccountUrl("/settings")}
              settingsHref={getAccountUrl("/security")}
              signupHref={signupHref}
              showSignOut
              buttonClassName="border-[color:var(--home-line-15)] bg-[color:var(--home-surface-04)] text-[color:var(--home-ink)] hover:border-[color:var(--home-accent)] hover:bg-[color:var(--home-surface-07)]"
              dropdownClassName="border-[color:var(--home-line-15)] bg-[color:var(--home-sheet)] text-[color:var(--home-ink)]"
              // AWARE-SP5: the workspace rides the chip's unified
              // workspaceHref contract (leads the menu); the recruit link
              // ("I'm hiring") is still dropped for people who already hire.
              workspaceHref={standing.kind === "operator" ? plan.workspace?.href : undefined}
              workspaceLabel={
                standing.kind === "operator" && plan.workspace ? t(plan.workspace.label) : undefined
              }
              menuItems={[
                { label: copy.shell.candidateHome, href: "/candidate" },
                { label: copy.shell.applications, href: "/candidate/applications" },
                { label: copy.shell.savedJobs, href: "/candidate/saved-jobs" },
                { label: copy.home.browseJobs, href: "/jobs" },
                ...(standing.kind === "operator"
                  ? []
                  : [{ label: copy.home.hireWithHenryCo, href: "/hire" }]),
              ]}
            />
          ) : null
        }
        primaryCta={resolvedPrimary}
        auxLink={resolvedSecondary}
        /* CHROME-64 (redesign 2026-07-08): announcement strip retired and the
       * toolbar rests dense — the shared <=64px chrome budget. Strip contents
       * (taglines, support links) live in the footer / contact surfaces. */
        dense
      />

      <main id="henryco-main" tabIndex={-1} className="jobs-main flex-1">
        {children}
      </main>

      <PublicSiteFooter
        copy={{
          statement: t(
            "A premium hiring operating system — verified talent, trusted employers, and cleaner recruitment on one record.",
          ),
          divisionsLabel: t("The Henry Onyx group"),
          rightsReserved: t("All rights reserved."),
          attribution: t("Built in-house by Henry Onyx Jobs."),
        }}
        columns={[
          {
            title: t(copy.shell.discover),
            links: [
              { href: "/jobs", label: t(copy.shell.jobs) },
              { href: "/talent", label: t(copy.shell.talent) },
              { href: "/trust", label: t(copy.shell.trust) },
              { href: "/help", label: t(copy.shell.help) },
            ],
          },
          {
            title: t(copy.shell.forTeams),
            links: [
              { href: "/candidate", label: t(copy.shell.candidateHome) },
              { href: "/hire", label: t(copy.home.hireWithHenryCo) },
              { href: "/employer", label: t(copy.shell.employerWorkspace) },
              { href: "/recruiter", label: t(copy.shell.recruiters) },
            ],
          },
          {
            title: t(copy.shell.henryCo),
            links: [
              { href: accountJobsUrl, label: t(copy.shell.account) },
              { href: "/careers", label: t(copy.shell.careers) },
              { href: getHubUrl(), label: t(copy.shell.groupHub) },
            ],
          },
        ]}
        support={{ email: jobs.supportEmail }}
      />
    </div>
  );
}

export function HeroLink({
  href,
  label,
  subtle,
}: {
  href: string;
  label: string;
  subtle?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
        subtle ? "jobs-button-secondary" : "jobs-button-primary"
      }`}
    >
      {label}
    </Link>
  );
}
