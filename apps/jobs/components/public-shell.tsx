import Link from "next/link";
import { getDivisionConfig } from "@henryco/config";
import { PublicFooter } from "@henryco/ui";
import { PublicNavbar } from "@henryco/ui";
import { getSharedAccountJobsUrl } from "@/lib/account";

const jobs = getDivisionConfig("jobs");
const accountJobsUrl = getSharedAccountJobsUrl();

export function PublicShell({
  children,
  primaryCta,
  secondaryCta,
}: {
  children: React.ReactNode;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}) {
  return (
    <div className="jobs-page">
      <PublicNavbar
        brand={{ name: jobs.name, sub: jobs.sub }}
        items={[...jobs.publicNav]}
        primaryCta={primaryCta}
        secondaryCta={secondaryCta}
        auxLink={{ label: "HenryCo Account", href: accountJobsUrl, external: true }}
      />
      <main>{children}</main>
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
            title: "Jobs Surfaces",
            links: [
              { label: "Candidate Module", href: "/candidate" },
              { label: "Employer Console", href: "/employer" },
              { label: "Recruiter Console", href: "/recruiter" },
              { label: "Owner Operations", href: "/owner" },
            ],
          },
          {
            title: "HenryCo",
            links: [
              { label: "Account Dashboard", href: accountJobsUrl, external: true },
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
