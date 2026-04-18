import Link from "next/link";
import { ArrowRight, Bookmark, BookOpen, ChevronRight, Clock3, GraduationCap, Layers3, ShieldCheck, Sparkles, Star } from "lucide-react";
import type { AppLocale } from "@henryco/i18n";
import { formatSurfaceTemplate, translateSurfaceLabel } from "@henryco/i18n";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/env";
import type { LearnCourse, LearnPath } from "@/lib/learn/types";

type NavItem = {
  href: string;
  label: string;
  active?: boolean;
};

export function humanizeLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function LearnPanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <section className={cn("learn-panel rounded-[2rem] p-6", className)}>{children}</section>;
}

export function LearnSectionIntro({
  kicker,
  title,
  body,
  className,
}: {
  kicker: string;
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="learn-kicker">{kicker}</p>
      <h2 className="learn-heading mt-4 text-[2.2rem] text-[var(--learn-ink)] sm:text-[3rem]">{title}</h2>
      <p className="mt-4 max-w-3xl text-sm leading-8 text-[var(--learn-ink-soft)] sm:text-[15px]">{body}</p>
    </div>
  );
}

export function LearnMetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon?: React.ReactNode;
}) {
  return (
    <article className="learn-panel rounded-[1.8rem] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">{label}</p>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--learn-ink)]">{value}</p>
        </div>
        {icon ? <div className="rounded-2xl border border-[var(--learn-line)] bg-white/5 p-3 text-[var(--learn-mint)]">{icon}</div> : null}
      </div>
      <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">{hint}</p>
    </article>
  );
}

export function LearnEmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <LearnPanel className="text-center">
      <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">{title}</h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--learn-ink-soft)]">{body}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </LearnPanel>
  );
}

export function LearnStatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "signal";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200/40 bg-emerald-300/10 text-emerald-100 dark:text-emerald-200"
      : tone === "warning"
        ? "border-amber-200/30 bg-amber-300/10 text-amber-100 dark:text-amber-200"
        : tone === "signal"
          ? "border-[var(--learn-line-strong)] bg-[var(--learn-mint-soft)]/10 text-[var(--learn-mint-soft)]"
          : "border-[var(--learn-line)] bg-white/5 text-[var(--learn-ink-soft)]";

  return <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold shadow-[0_12px_30px_rgba(0,0,0,0.14)]", toneClass)}>{label}</span>;
}

export function CourseCard({
  course,
  href,
  saved,
  locale = "en",
}: {
  course: LearnCourse;
  href: string;
  saved?: boolean;
  locale?: AppLocale;
}) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const visibilityLabel =
    course.visibility === "public"
      ? t("Public access")
      : course.visibility === "internal"
        ? t("Assigned access")
        : t("Private access");

  return (
    <Link href={href} className="group block">
      <article className="learn-panel learn-mesh flex h-full flex-col rounded-[2rem] p-6 transition duration-300 group-hover:-translate-y-1.5 group-hover:border-[var(--learn-line-strong)]">
        <div className="flex flex-wrap items-center gap-2">
          <LearnStatusBadge label={visibilityLabel} tone={course.visibility === "public" ? "signal" : "warning"} />
          <LearnStatusBadge label={course.accessModel === "free" ? t("Free") : course.accessModel === "paid" ? t("Paid") : t("Sponsored")} tone={course.accessModel === "free" ? "success" : "neutral"} />
          {course.certification ? <LearnStatusBadge label={t("Certificate")} tone="signal" /> : null}
        </div>

        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">{course.title}</h3>
            <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">{course.subtitle}</p>
          </div>
          {saved ? <Bookmark className="h-5 w-5 text-[var(--learn-mint)]" /> : null}
        </div>

        <p className="mt-4 text-sm leading-7 text-[var(--learn-ink-soft)]">{course.summary}</p>

        <div className="mt-6 grid gap-3 text-sm text-[var(--learn-ink-soft)] sm:grid-cols-2">
          <div className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> {course.durationText}</div>
          <div className="flex items-center gap-2"><Layers3 className="h-4 w-4" /> {t(humanizeLabel(course.difficulty))}</div>
          <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4" /> {formatSurfaceTemplate(t("Pass {score}%"), { score: course.passingScore })}</div>
          <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> {course.visibility === "public" ? t("Open to learners") : t("Limited by role or assignment")}</div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-[var(--learn-line)] pt-5">
          <div className="text-sm font-semibold text-[var(--learn-ink)]">
            {course.accessModel === "free" || course.price === 0 ? t("Included") : formatCurrency(course.price || 0, course.currency)}
          </div>
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--learn-mint-soft)]">
            {t("View course")} <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </article>
    </Link>
  );
}

export function PathCard({
  path,
  courseCount,
  href,
  locale = "en",
}: {
  path: LearnPath;
  courseCount: number;
  href: string;
  locale?: AppLocale;
}) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const visibilityLabel = path.visibility === "public" ? t("Public path") : t("Assigned path");

  return (
    <Link href={href} className="group block">
      <article className="learn-panel rounded-[2rem] p-6 transition duration-300 group-hover:-translate-y-1.5 group-hover:border-[var(--learn-line-strong)]">
        <div className="flex items-center justify-between gap-4">
          <LearnStatusBadge label={visibilityLabel} tone={path.visibility === "public" ? "signal" : "warning"} />
          <Sparkles className="h-5 w-5 text-[var(--learn-copper)]" />
        </div>
        <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">{path.title}</h3>
        <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">{path.summary}</p>
        <div className="mt-5 flex items-center justify-between text-sm text-[var(--learn-ink-soft)]">
          <span>{formatSurfaceTemplate(t("{count} courses in this path"), { count: courseCount })}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-[var(--learn-mint-soft)]">{t("Open path")} <ChevronRight className="h-4 w-4" /></span>
        </div>
      </article>
    </Link>
  );
}

export function LearnWorkspaceShell({
  kicker,
  title,
  description,
  nav,
  actions,
  children,
}: {
  kicker: string;
  title: string;
  description: string;
  nav: NavItem[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-[92rem] gap-6 px-5 py-8 sm:px-8 xl:grid-cols-[280px,1fr] xl:px-10">
      <aside className="learn-panel rounded-[2rem] p-4 xl:sticky xl:top-24 xl:self-start">
        <div className="learn-kicker">{kicker}</div>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--learn-ink)]">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">{description}</p>
        <nav className="mt-6 space-y-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-[1.35rem] px-4 py-3 text-sm font-semibold transition duration-200",
                item.active
                  ? "bg-[linear-gradient(135deg,#0f3730,#2e7c6d)] text-white"
                  : "border border-[var(--learn-line)] bg-black/10 text-[var(--learn-ink)] hover:-translate-y-0.5 hover:border-[var(--learn-line-strong)] hover:bg-white/5"
              )}
            >
              <span>{item.label}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ))}
        </nav>
      </aside>

      <main className="space-y-6">
        <LearnPanel className="learn-mesh p-7 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="learn-kicker">{kicker}</div>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--learn-ink)]">{title}</h2>
              <p className="mt-3 text-sm leading-8 text-[var(--learn-ink-soft)]">{description}</p>
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </LearnPanel>
        {children}
      </main>
    </div>
  );
}

export function LearnMarkdown({ value }: { value: string }) {
  const blocks = value.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="space-y-5 text-sm leading-8 text-[var(--learn-ink-soft)]">
      {blocks.map((block, index) => {
        if (block.startsWith("## ")) {
          return (
            <h3 key={index} className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">
              {block.replace(/^## /, "")}
            </h3>
          );
        }

        if (block.split("\n").every((line) => line.trim().startsWith("- "))) {
          return (
            <ul key={index} className="space-y-2">
              {block.split("\n").map((line, lineIndex) => (
                <li key={lineIndex} className="flex gap-3">
                  <Star className="mt-1 h-4 w-4 shrink-0 text-[var(--learn-copper)]" />
                  <span>{line.replace(/^- /, "")}</span>
                </li>
              ))}
            </ul>
          );
        }

        return <p key={index}>{block.replace(/^# /, "")}</p>;
      })}
    </div>
  );
}

export function ActionLink({
  href,
  label,
  variant = "primary",
}: {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link href={href} className={variant === "primary" ? "learn-button-primary rounded-full px-5 py-3 text-sm font-semibold" : "learn-button-secondary rounded-full px-5 py-3 text-sm font-semibold"}>
      {label}
    </Link>
  );
}

export function QuickMetricStrip({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="grid gap-4 rounded-[2rem] border border-[var(--learn-line)] bg-white/5 p-5 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">{item.label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[var(--learn-ink)]">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export function BrandMark() {
  return (
    <div className="learn-brand-mark">
      <BookOpen className="h-5 w-5" />
    </div>
  );
}
