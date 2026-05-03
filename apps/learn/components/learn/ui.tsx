import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  ChevronRight,
  Clock3,
  GraduationCap,
  Layers3,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import type { AppLocale } from "@henryco/i18n";
import { formatSurfaceTemplate, translateSurfaceLabel } from "@henryco/i18n";
import { HenryCoMonogram } from "@henryco/ui/brand";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/env";
import type { LearnCourse, LearnPath } from "@/lib/learn/types";

type NavItem = {
  href: string;
  label: string;
  active?: boolean;
};

export function humanizeLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * LearnPanel kept for backward compatibility, now flatter:
 * a single hairline border surface, no shadow, no mesh chrome by default.
 */
export function LearnPanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-[1.8rem] border border-[var(--learn-line)] bg-white/[0.02] p-6 sm:p-7",
        className,
      )}
    >
      {children}
    </section>
  );
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
      <h2 className="mt-4 max-w-3xl text-balance text-[1.85rem] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--learn-ink)] sm:text-[2.2rem] md:text-[2.55rem]">
        {title}
      </h2>
      <p className="mt-4 max-w-2xl text-pretty text-[15px] leading-[1.7] text-[var(--learn-ink-soft)] sm:text-base">
        {body}
      </p>
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
    <article className="border-t border-[var(--learn-line)] pt-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
          {label}
        </p>
        {icon ? (
          <span className="text-[var(--learn-mint)]">{icon}</span>
        ) : null}
      </div>
      <p className="mt-3 text-[2rem] font-semibold leading-tight tracking-tight text-[var(--learn-ink)] sm:text-[2.3rem]">
        {value}
      </p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--learn-ink-soft)]">{hint}</p>
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
    <section className="border-l-2 border-[var(--learn-copper)]/55 px-5 py-4">
      <h3 className="text-[1.4rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--learn-ink)] sm:text-[1.65rem]">
        {title}
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--learn-ink-soft)]">{body}</p>
      {action ? <div className="mt-5 flex">{action}</div> : null}
    </section>
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
      ? "border-emerald-200/35 text-emerald-200"
      : tone === "warning"
        ? "border-amber-200/30 text-amber-200"
        : tone === "signal"
          ? "border-[var(--learn-line-strong)] text-[var(--learn-mint-soft)]"
          : "border-[var(--learn-line)] text-[var(--learn-ink-soft)]";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border bg-transparent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]",
        toneClass,
      )}
    >
      {label}
    </span>
  );
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
      <article className="flex h-full flex-col rounded-[1.8rem] border border-[var(--learn-line)] bg-white/[0.02] p-6 transition duration-300 group-hover:-translate-y-1 group-hover:border-[var(--learn-line-strong)] group-hover:bg-white/[0.04]">
        <div className="flex flex-wrap items-center gap-1.5">
          <LearnStatusBadge
            label={visibilityLabel}
            tone={course.visibility === "public" ? "signal" : "warning"}
          />
          <LearnStatusBadge
            label={
              course.accessModel === "free"
                ? t("Free")
                : course.accessModel === "paid"
                  ? t("Paid")
                  : t("Sponsored")
            }
            tone={course.accessModel === "free" ? "success" : "neutral"}
          />
          {course.certification ? <LearnStatusBadge label={t("Certificate")} tone="signal" /> : null}
        </div>

        <div className="mt-5 flex items-start justify-between gap-3">
          <h3 className="text-[1.3rem] font-semibold leading-snug tracking-[-0.015em] text-[var(--learn-ink)] sm:text-[1.4rem]">
            {course.title}
          </h3>
          {saved ? <Bookmark className="mt-1 h-4 w-4 shrink-0 text-[var(--learn-mint)]" /> : null}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[var(--learn-ink-soft)]">{course.subtitle}</p>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--learn-ink-soft)]">
          {course.summary}
        </p>

        <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5 border-y border-[var(--learn-line)] py-4 text-sm text-[var(--learn-ink-soft)]">
          <li className="flex items-center gap-1.5 text-[12.5px]">
            <Clock3 className="h-3.5 w-3.5 text-[var(--learn-copper)]" /> {course.durationText}
          </li>
          <li className="flex items-center gap-1.5 text-[12.5px]">
            <Layers3 className="h-3.5 w-3.5 text-[var(--learn-copper)]" />
            {t(humanizeLabel(course.difficulty))}
          </li>
          <li className="flex items-center gap-1.5 text-[12.5px]">
            <GraduationCap className="h-3.5 w-3.5 text-[var(--learn-copper)]" />
            {formatSurfaceTemplate(t("Pass {score}%"), { score: course.passingScore })}
          </li>
          <li className="flex items-center gap-1.5 text-[12.5px]">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--learn-copper)]" />
            {course.visibility === "public" ? t("Open to learners") : t("Limited access")}
          </li>
        </ul>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <p className="text-[1.05rem] font-semibold tracking-tight text-[var(--learn-ink)]">
            {course.accessModel === "free" || course.price === 0
              ? t("Included")
              : formatCurrency(course.price || 0, course.currency)}
          </p>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--learn-mint-soft)] underline-offset-4 group-hover:underline">
            {t("View course")}
            <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
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
      <article className="flex h-full flex-col rounded-[1.8rem] border border-[var(--learn-line)] bg-white/[0.02] p-6 transition duration-300 group-hover:-translate-y-1 group-hover:border-[var(--learn-line-strong)] group-hover:bg-white/[0.04]">
        <div className="flex items-center justify-between gap-3">
          <LearnStatusBadge
            label={visibilityLabel}
            tone={path.visibility === "public" ? "signal" : "warning"}
          />
          <Sparkles className="h-4 w-4 text-[var(--learn-copper)]" />
        </div>
        <h3 className="mt-5 text-[1.3rem] font-semibold leading-snug tracking-[-0.015em] text-[var(--learn-ink)] sm:text-[1.4rem]">
          {path.title}
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--learn-ink-soft)]">
          {path.summary}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--learn-line)] pt-4 text-sm">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
            {formatSurfaceTemplate(t("{count} courses"), { count: courseCount })}
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--learn-mint-soft)] underline-offset-4 group-hover:underline">
            {t("Open path")}
            <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
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
    <div className="mx-auto grid max-w-[92rem] gap-10 px-5 py-10 sm:px-8 xl:grid-cols-[260px,1fr] xl:px-10">
      <aside className="xl:sticky xl:top-24 xl:self-start">
        <p className="learn-kicker">{kicker}</p>
        <h1 className="mt-4 text-balance text-[1.65rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--learn-ink)] sm:text-[1.85rem]">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--learn-ink-soft)]">{description}</p>
        <nav className="mt-7 divide-y divide-[var(--learn-line)] border-y border-[var(--learn-line)]">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between gap-3 py-3 text-sm font-semibold transition",
                item.active
                  ? "text-[var(--learn-mint-soft)]"
                  : "text-[var(--learn-ink)] hover:text-[var(--learn-mint-soft)]",
              )}
            >
              <span>{item.label}</span>
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition",
                  item.active ? "text-[var(--learn-mint-soft)]" : "text-[var(--learn-ink-soft)]",
                )}
              />
            </Link>
          ))}
        </nav>
      </aside>

      <main id="henryco-main" tabIndex={-1} className="space-y-10">
        <section>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="learn-kicker">{kicker}</p>
              <h2 className="mt-4 text-balance text-[2rem] font-semibold leading-[1.05] tracking-[-0.025em] text-[var(--learn-ink)] sm:text-[2.6rem] md:text-[2.95rem]">
                {title}
              </h2>
              <p className="mt-4 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--learn-ink-soft)]">
                {description}
              </p>
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </section>
        {children}
      </main>
    </div>
  );
}

export function LearnMarkdown({ value }: { value: string }) {
  const blocks = value.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="space-y-5 text-sm leading-[1.75] text-[var(--learn-ink-soft)]">
      {blocks.map((block, index) => {
        if (block.startsWith("## ")) {
          return (
            <h3
              key={index}
              className="text-[1.35rem] font-semibold leading-snug tracking-[-0.015em] text-[var(--learn-ink)] sm:text-[1.5rem]"
            >
              {block.replace(/^## /, "")}
            </h3>
          );
        }

        if (block.split("\n").every((line) => line.trim().startsWith("- "))) {
          return (
            <ul key={index} className="space-y-2">
              {block.split("\n").map((line, lineIndex) => (
                <li key={lineIndex} className="flex gap-3">
                  <Star className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--learn-copper)]" />
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
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5",
        variant === "primary" ? "learn-button-primary" : "learn-button-secondary",
      )}
    >
      {label}
      {variant === "primary" ? <ArrowRight className="h-4 w-4" /> : null}
    </Link>
  );
}

export function QuickMetricStrip({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-[var(--learn-line)] py-5 sm:flex sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-12">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
            {item.label}
          </dt>
          <dd className="text-[1.5rem] font-semibold leading-tight tracking-tight text-[var(--learn-ink)] sm:text-[1.7rem]">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function BrandMark() {
  return (
    <div className="learn-brand-mark" style={{ color: "var(--learn-accent, #C9A227)" }}>
      <HenryCoMonogram size={28} accent="var(--learn-accent, #C9A227)" />
    </div>
  );
}
