import Link from "next/link";
import { headers } from "next/headers";
import { getAccountUrl, getDivisionConfig } from "@henryco/config";
import { HenryCoPublicAccountPresets, PublicAccountChip, PublicFooter } from "@henryco/ui";
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
  const viewer = await getJobsViewer();
  const resolvedPrimary =
    primaryCta ??
    (viewer.user
      ? { label: "My hiring hub", href: "/candidate" }
      : { label: "Browse open jobs", href: "/jobs" });
  const resolvedSecondary =
    secondaryCta ??
    (viewer.user
      ? { label: "Saved jobs", href: "/candidate/saved-jobs" }
      : { label: "Hire with HenryCo", href: "/hire" });
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
        headerClassName="jobs-public-header"
        auxLink={{ label: "HenryCo account", href: accountJobsUrl, external: true }}
        accountMenu={
          <PublicAccountChip
            {...HenryCoPublicAccountPresets.standard}
            user={chipUser}
            loginHref={loginHref}
            accountHref={accountJobsUrl}
            preferencesHref={getAccountUrl("/settings#privacy-controls")}
            settingsHref={getAccountUrl("/security")}
            signupHref={signupHref}
            showSignOut
            menuItems={[
              { label: "Candidate home", href: "/candidate" },
              { label: "Applications", href: "/candidate/applications" },
              { label: "Saved jobs", href: "/candidate/saved-jobs" },
              { label: "Browse jobs", href: "/jobs" },
              { label: "Hire with HenryCo", href: "/hire" },
            ]}
          />
        }
      />
      <main className="jobs-main">{children}</main>
      <PublicFooter
        brand={jobs.name}
        description={jobs.description}
        support={{ email: jobs.supportEmail, phone: jobs.supportPhone }}
        groups={[
          {
            title: "Discover",
            links: [
              { label: "Jobs", href: "/jobs" },
              { label: "Talent", href: "/talent" },
              { label: "Trust", href: "/trust" },
              { label: "Help", href: "/help" },
            ],
          },
          {
            title: "For teams",
            links: [
              { label: "Candidates", href: "/candidate" },
              { label: "Hire with HenryCo", href: "/hire" },
              { label: "Employer workspace", href: "/employer" },
              { label: "Recruiters", href: "/recruiter" },
              { label: "Careers", href: "/careers" },
            ],
          },
          {
            title: "HenryCo",
            links: [
              { label: "My HenryCo account", href: accountJobsUrl, external: true },
              { label: "Internal Careers", href: "/careers" },
              { label: "Group Hub", href: "https://henrycogroup.com", external: true },
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
