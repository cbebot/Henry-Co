import Link from "next/link";
import { headers } from "next/headers";
import { Menu } from "lucide-react";
import { PublicAccountChip, ThemeToggle } from "@henryco/ui";
import { getAccountUrl, getDivisionConfig, getHubUrl } from "@henryco/config";
import { getLearnViewer } from "@/lib/learn/auth";
import { getAccountLearnUrl, getSharedAuthUrl } from "@/lib/learn/links";
import { BrandMark } from "@/components/learn/ui";

const learn = getDivisionConfig("learn");

export async function LearnSiteHeader() {
  const viewer = await getLearnViewer();
  const h = await headers();
  const returnPath = h.get("x-learn-return-path") || "/";
  const accountHref = getAccountLearnUrl();
  const loginHref = getSharedAuthUrl("login", returnPath);
  const signupHref = getSharedAuthUrl("signup", returnPath);
  const chipUser = viewer.user
    ? {
        displayName: viewer.user.fullName || viewer.user.email || "Your account",
        email: viewer.user.email,
        avatarUrl: null as string | null,
      }
    : null;

  const accountChip = (
    <PublicAccountChip
      user={chipUser}
      loginHref={loginHref}
      accountHref={accountHref}
      preferencesHref={getHubUrl("/preferences")}
      settingsHref={getAccountUrl("/security")}
      signupHref={signupHref}
      showSignOut
      menuItems={[
        { label: "My courses", href: "/learner/courses" },
        { label: "Browse catalog", href: "/courses" },
        { label: "Teach with HenryCo", href: "/teach" },
      ]}
    />
  );

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--learn-line)] bg-[color-mix(in_srgb,var(--learn-bg)_84%,transparent)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[92rem] items-center justify-between gap-4 px-5 py-4 sm:px-8 xl:px-10">
        <Link href="/" className="flex items-center gap-3">
          <BrandMark />
          <div>
            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--learn-ink-soft)]">
              HenryCo
            </div>
            <div className="font-semibold tracking-[-0.03em] text-[var(--learn-ink)]">{learn.name}</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          {learn.publicNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[var(--learn-ink-soft)] transition hover:text-[var(--learn-ink)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle className="hidden sm:inline-flex" />
          <div className="hidden sm:block">{accountChip}</div>
          <details className="relative lg:hidden">
            <summary className="learn-button-secondary flex h-11 w-11 cursor-pointer items-center justify-center rounded-full p-0 list-none">
              <Menu className="h-4 w-4" />
            </summary>
            <div className="learn-panel absolute right-0 mt-3 w-[min(21rem,calc(100vw-2.5rem))] rounded-[1.8rem] p-4">
              <div className="mb-4 flex flex-col items-stretch gap-2">{accountChip}</div>
              <div className="space-y-2">
                {learn.publicNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex rounded-[1.2rem] border border-[var(--learn-line)] bg-white/5 px-4 py-3 text-sm font-semibold text-[var(--learn-ink)] transition hover:border-[var(--learn-line-strong)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Link href="/courses" className="learn-button-primary rounded-full px-4 py-2.5 text-sm font-semibold">
                  Explore courses
                </Link>
              </div>
            </div>
          </details>
          <Link href="/courses" className="learn-button-primary hidden rounded-full px-4 py-2.5 text-sm font-semibold sm:inline-flex">
            Explore courses
          </Link>
        </div>
      </div>
    </header>
  );
}
