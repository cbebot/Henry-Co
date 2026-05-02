import Link from "next/link";
import { headers } from "next/headers";
import { getAccountUrl, getDivisionConfig, getHubUrl } from "@henryco/config";
import { getJobsPublicCopy } from "@/lib/public-copy";
import { getJobsPublicLocale } from "@/lib/locale-server";
import {
  HenryCoPublicAccountPresets,
  HenryCoSearchBreadcrumb,
  PublicAccountChip,
  PublicFooter,
} from "@henryco/ui";
import { PublicHeader, getSiteNavigationConfig } from "@henryco/ui/public-shell";
import {
  getSharedAccountJobsUrl,
  getSharedAccountLoginUrl,
  getSharedAccountSignupUrl,
  normalizeJobsPath,
} from "@/lib/account";
import { getJobsViewer } from "@/lib/auth";

const jobs = getDivisionConfig("jobs");
const accountJobsUrl = getSharedAccountJobsUrl();

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
  const copy = getJobsPublicCopy(locale);
  const viewer = await getJobsViewer();
  const resolvedPrimary =
    primaryCta ??
    (viewer.user
      ? { label: copy.home.candidateHub, href: "/candidate" }
      : { label: copy.home.browseJobs, href: "/jobs" });
  const resolvedSecondary =
    secondaryCta ??
    (viewer.user
      ? { label: copy.shell.savedJobs, href: "/candidate/saved-jobs" }
      : { label: copy.home.hireWithHenryCo, href: "/hire" });
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
    <div className="jobs-page jobs-shell">
      <PublicHeader
        brand={{ name: jobs.name, sub: jobs.sub }}
        items={[...getSiteNavigationConfig("jobs").primaryNav]}
        primaryCta={resolvedPrimary}
        secondaryCta={resolvedSecondary}
        actions={
          <HenryCoSearchBreadcrumb
            href={getHubUrl("/search")}
            className="hidden xl:inline-flex"
          />
        }
        headerClassName="jobs-public-header"
        auxLink={{ label: copy.shell.account, href: accountJobsUrl, external: true }}
        accountMenu={
          <PublicAccountChip
            {...HenryCoPublicAccountPresets.standard}
            user={chipUser}
            loginHref={loginHref}
            accountHref={accountJobsUrl}
            preferencesHref={getAccountUrl("/settings")}
            settingsHref={getAccountUrl("/security")}
            signupHref={signupHref}
            showSignOut
            menuItems={[
              { label: copy.shell.candidateHome, href: "/candidate" },
              { label: copy.shell.applications, href: "/candidate/applications" },
              { label: copy.shell.savedJobs, href: "/candidate/saved-jobs" },
              { label: copy.home.browseJobs, href: "/jobs" },
              { label: copy.home.hireWithHenryCo, href: "/hire" },
            ]}
          />
        }
      />
      <main id="henryco-main" tabIndex={-1} className="jobs-main">{children}</main>
      <PublicFooter
        brand={jobs.name}
        description={jobs.description}
        support={{ email: jobs.supportEmail, phone: jobs.supportPhone }}
        groups={[
          {
            title: copy.shell.discover,
            links: [
              { label: copy.shell.jobs, href: "/jobs" },
              { label: copy.shell.talent, href: "/talent" },
              { label: copy.shell.trust, href: "/trust" },
              { label: copy.shell.help, href: "/help" },
            ],
          },
          {
            title: copy.shell.forTeams,
            links: [
              { label: copy.shell.candidateHome, href: "/candidate" },
              { label: copy.home.hireWithHenryCo, href: "/hire" },
              { label: copy.shell.employerWorkspace, href: "/employer" },
              { label: copy.shell.recruiters, href: "/recruiter" },
              { label: copy.shell.careers, href: "/careers" },
            ],
          },
          {
            title: copy.shell.henryCo,
            links: [
              { label: copy.shell.account, href: accountJobsUrl, external: true },
              { label: copy.shell.internalCareers, href: "/careers" },
              { label: copy.shell.groupHub, href: "https://henrycogroup.com", external: true },
            ],
          },
        ]}
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
