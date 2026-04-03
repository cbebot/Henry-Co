import Link from "next/link";
import { ThemeToggle } from "@henryco/ui";
import { getDivisionConfig } from "@henryco/config";
import { getLearnViewer } from "@/lib/learn/auth";
import { BrandMark } from "@/components/learn/ui";

const learn = getDivisionConfig("learn");

export async function LearnSiteHeader() {
  const viewer = await getLearnViewer();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--learn-line)] bg-[color-mix(in_srgb,var(--learn-bg)_84%,transparent)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[92rem] items-center justify-between gap-4 px-5 py-4 sm:px-8 xl:px-10">
        <Link href="/" className="flex items-center gap-3">
          <BrandMark />
          <div>
            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--learn-ink-soft)]">HenryCo</div>
            <div className="font-semibold tracking-[-0.03em] text-[var(--learn-ink)]">{learn.name}</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          {learn.publicNav.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-[var(--learn-ink-soft)] transition hover:text-[var(--learn-ink)]">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link href={viewer.user ? "/learner" : "/login"} className="learn-button-secondary rounded-full px-4 py-2.5 text-sm font-semibold">
            {viewer.user ? "My Academy" : "Sign in"}
          </Link>
          <Link href="/courses" className="learn-button-primary rounded-full px-4 py-2.5 text-sm font-semibold">
            Explore courses
          </Link>
        </div>
      </div>
    </header>
  );
}
