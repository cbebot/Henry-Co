"use client";

import {
  CheckCircle2,
  Gauge,
  Layers,
  Lock,
  Quote,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { formatNaira, readinessBand } from "@/components/studio/request-builder-data";
import { StudioReferenceAttachments } from "@/components/studio/studio-reference-attachments";
import { StudioSubmitButton } from "@/components/studio/submit-button";
import { StudioListbox } from "@/components/studio/studio-listbox";
import type {
  RequestBuilderSelectionProps,
  StudioBriefReviewSummary,
} from "@/components/studio/request-builder-types";

/** One label/value row in a dossier definition list. Renders an em-dash when
 * the value is empty so the buyer can see what is still open at a glance.
 * The label arrives already localized; the value is dynamic buyer data. */
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
        {label}
      </dt>
      <dd className="min-w-0 text-right text-sm font-medium text-[var(--studio-ink)]">
        {value.trim() ? value : <span className="text-[var(--studio-ink-soft)]">—</span>}
      </dd>
    </div>
  );
}

/** A labelled wrap of selection chips. Renders nothing when empty, so the
 * scope band only shows the categories the buyer actually picked. */
function ReviewChips({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <div>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-signal)]">
        {label}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {values.map((value) => (
          <span
            key={value}
            className="rounded-full border border-[var(--studio-line)] bg-[color:var(--home-surface-04)] px-3 py-1 text-[12.5px] font-medium text-[var(--studio-ink)] transition hover:border-[color:var(--home-accent-ring)]"
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

/** A quoted free-text block (goals, deliverables, inspiration). Hidden when
 * the buyer left it blank. Label is localized; value is the buyer's prose. */
function ReviewNote({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="rounded-[1.3rem] border border-[var(--studio-line)] bg-[color:var(--home-surface-04)] p-4">
      <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-signal)]">
        <Quote className="h-3 w-3" aria-hidden />
        {label}
      </div>
      <p className="mt-2 whitespace-pre-line text-[13.5px] leading-7 text-[var(--studio-ink-soft)]">
        {value.trim()}
      </p>
    </div>
  );
}

/** Best-effort label for the domain plan captured in the previous step. The
 * intent is a serialized JSON blob; parse defensively and fall back to null.
 * Heads are localized copy; the desired name is the buyer's own text. */
function domainSummary(intentJson: string, t: (text: string) => string): string | null {
  if (!intentJson) return null;
  try {
    const intent = JSON.parse(intentJson) as {
      path?: string;
      desiredLabel?: string;
      backupLabel?: string;
    };
    const head =
      intent.path === "have"
        ? t("Existing domain")
        : intent.path === "later"
          ? t("Decide with HenryCo")
          : t("New domain");
    const name = intent.desiredLabel?.trim();
    return name ? `${head} · ${name}` : head;
  } catch {
    return null;
  }
}

export function StudioRequestActivationStep({
  teams,
  selectedTeamId,
  setSelectedTeamId,
  review,
}: Pick<RequestBuilderSelectionProps, "teams" | "selectedTeamId" | "setSelectedTeamId"> & {
  review: StudioBriefReviewSummary;
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const teamOptions = teams.map((team) => ({
    value: team.id,
    label: `${team.name} · ${team.availability}`,
  }));
  const selectedTeam = teams.find((team) => team.id === selectedTeamId);
  const depositPct = Math.round(review.pricing.depositRate * 100);
  const lineCount = review.pricing.lines.length;
  const domainLine = domainSummary(review.domainIntentJson, t);
  const stackChips = [
    review.framework,
    review.backend,
    review.programmingLanguage,
    review.hosting,
  ].filter((value) => value && value.trim().length > 0) as string[];

  const pathValue =
    review.pathway === "package"
      ? `${t("Package")}${review.packageName ? ` · ${review.packageName}` : ""}`
      : t("Custom build");

  const hasScope =
    review.pages.length > 0 ||
    review.modules.length > 0 ||
    review.addOns.length > 0 ||
    review.tech.length > 0 ||
    stackChips.length > 0;
  const hasNotes =
    review.goals.trim().length > 0 ||
    review.scopeNotes.trim().length > 0 ||
    review.inspirationSummary.trim().length > 0;

  const nextSteps = [
    t("A senior lead is assigned by name and confirms scope with you inside one business day."),
    t("You receive a proposal link, workspace, and payment reference — never a silent inbox."),
    t("Deposit secures the lane; we explain domain, hosting, and go-live before anything ships."),
  ];

  return (
    <div className="space-y-6">
      {/* ── Panel 1 · Investment + brief dossier ──────────────────────────
          studio-mesh lays an engraved-grid + cyan/copper glow under the
          dossier; the metallic top rule and copper deposit accent give the
          "expensive" cue without a giant hero. */}
      <section className="studio-panel studio-mesh relative overflow-hidden rounded-[1.75rem] p-5 sm:p-8">
        <div
          className="studio-metal-rule pointer-events-none absolute inset-x-0 top-0 h-px opacity-80"
          aria-hidden
        />
        <div className="studio-rise-group relative space-y-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="studio-kicker">{t("Review & activate")}</div>
              <h3
                className="mt-2.5 text-balance text-[1.55rem] font-semibold leading-[1.08] tracking-[-0.025em] text-[var(--studio-ink)] sm:text-[1.85rem]"
                style={{ fontFamily: "var(--font-studio-display)" }}
              >
                {t("Confirm the brief. Lock the price you see.")}
              </h3>
              <p className="mt-2.5 max-w-xl text-pretty text-sm leading-7 text-[var(--studio-ink-soft)]">
                {t(
                  "Everything below becomes a real Studio record — proposal, workspace, and payment checkpoints. Nothing is charged until you approve scope with your assigned lead.",
                )}
              </p>
            </div>
            <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--studio-line-strong)] bg-[color:var(--home-surface-07)] px-3 py-1.5">
              <Gauge className="h-3.5 w-3.5 text-[var(--studio-signal)]" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--studio-ink)] tabular-nums">
                {review.readinessScore}/100 · {t(readinessBand(review.readinessScore))}
              </span>
            </div>
          </div>

          {/* Investment receipt — the same live pricing the side panel shows,
              dressed as a private-bank proforma. */}
          <div className="studio-receipt rounded-[1.5rem] border border-[var(--studio-line-strong)] bg-[var(--studio-surface-strong)] shadow-[var(--studio-shadow-soft)]">
            <div className="studio-metal-rule h-[2px] w-full opacity-90" aria-hidden />
            <div className="flex items-center justify-between gap-3 px-5 pt-4 sm:px-6">
              <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--studio-ink-soft)]">
                {t("Proforma estimate")}
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--home-accent)] bg-[color:var(--home-accent-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--home-accent-text)]">
                <Lock className="h-3 w-3" aria-hidden />
                {t("Locked at acceptance")}
              </span>
            </div>
            <div className="mt-4 grid gap-px bg-[var(--studio-line)] sm:grid-cols-[1.25fr_1fr]">
              <div className="bg-[var(--studio-surface-strong)] p-5 sm:p-6">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-ink-soft)]">
                  {t("Estimated investment")}
                </div>
                <div className="mt-2 font-mono text-[2.05rem] font-semibold leading-none tabular-nums tracking-tight text-[var(--studio-ink)] sm:text-[2.6rem]">
                  {formatNaira(review.pricing.total)}
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--studio-ink-soft)]">
                  {t("Fixed at proposal acceptance — no surprise overages.")}
                </p>
              </div>
              <div className="bg-[var(--studio-surface-strong)] p-5 sm:p-6">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-ink-soft)]">
                  {t("Deposit to start")} · <span className="tabular-nums">{depositPct}%</span>
                </div>
                <div className="mt-2 font-mono text-[1.65rem] font-semibold leading-none tabular-nums tracking-tight text-[var(--studio-copper)] sm:text-[2.05rem]">
                  {formatNaira(review.pricing.depositAmount)}
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--studio-ink-soft)]">
                  {t("Secures your delivery lane and a senior team.")}
                </p>
              </div>
            </div>

            {lineCount > 0 ? (
              <details className="group border-t border-[var(--studio-line)] [&>summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-ink-soft)] transition hover:text-[var(--studio-ink)] sm:px-6">
                  <span>
                    {t("How this total is built")} · <span className="tabular-nums">{lineCount}</span>{" "}
                    {lineCount === 1 ? t("line") : t("lines")}
                  </span>
                  <span
                    aria-hidden
                    className="text-[var(--studio-signal)] transition group-open:rotate-180"
                  >
                    ▾
                  </span>
                </summary>
                <ul className="divide-y divide-[var(--studio-line)]/60 px-5 pb-4 sm:px-6">
                  {review.pricing.lines.map((line) => (
                    <li
                      key={`${line.label}-${line.amount}`}
                      className="flex items-baseline justify-between gap-4 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-[var(--studio-ink)]">
                          {line.label}
                        </div>
                        {line.detail ? (
                          <div className="mt-0.5 truncate text-[10.5px] uppercase tracking-[0.14em] text-[var(--studio-ink-soft)]">
                            {line.detail}
                          </div>
                        ) : null}
                      </div>
                      <div className="shrink-0 font-mono text-[13px] font-semibold tabular-nums text-[var(--studio-signal)]">
                        {formatNaira(line.amount)}
                      </div>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>

          {/* Brief dossier — Build / Commercial side by side. */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-signal)]">
                <Layers className="h-3.5 w-3.5" aria-hidden />
                {t("Build")}
              </div>
              <dl className="mt-2 divide-y divide-[var(--studio-line)] border-t border-[var(--studio-line)]">
                <ReviewRow label={t("Path")} value={pathValue} />
                <ReviewRow label={t("Type")} value={review.projectType} />
                <ReviewRow label={t("Platform")} value={review.platform} />
                <ReviewRow label={t("Design")} value={review.design} />
                <ReviewRow label={t("Language")} value={review.preferredLanguage} />
              </dl>
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-signal)]">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                {t("Commercial")}
              </div>
              <dl className="mt-2 divide-y divide-[var(--studio-line)] border-t border-[var(--studio-line)]">
                <ReviewRow label={t("Business")} value={review.businessType} />
                <ReviewRow label={t("Budget")} value={review.budgetBand} />
                <ReviewRow label={t("Urgency")} value={review.urgency} />
                <ReviewRow label={t("Timeline")} value={review.timeline} />
                {domainLine ? <ReviewRow label={t("Web address")} value={domainLine} /> : null}
              </dl>
            </div>
          </div>

          {hasScope ? (
            <div className="space-y-4 rounded-[1.4rem] border border-[var(--studio-line)] bg-[color:var(--home-surface-04)] p-5">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-ink-soft)]">
                {t("Scope captured")}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ReviewChips label={t("Pages & surfaces")} values={review.pages} />
                <ReviewChips label={t("Functional modules")} values={review.modules} />
                <ReviewChips label={t("Growth add-ons")} values={review.addOns} />
                <ReviewChips label={t("Tech preferences")} values={review.tech} />
                <ReviewChips label={t("Stack")} values={stackChips} />
              </div>
            </div>
          ) : null}

          {hasNotes ? (
            <div className="grid gap-3">
              <ReviewNote label={t("What this should achieve")} value={review.goals} />
              <ReviewNote label={t("What must exist when done")} value={review.scopeNotes} />
              <ReviewNote label={t("References & tone")} value={review.inspirationSummary} />
            </div>
          ) : null}
        </div>
      </section>

      {/* ── Panel 2 · Activate ────────────────────────────────────────── */}
      <section
        className="studio-panel studio-rise relative overflow-hidden rounded-[1.75rem] p-5 sm:p-8"
        style={{ animationDelay: "460ms" }}
      >
        <div className="grid gap-8 xl:grid-cols-2">
          {/* Left — team fit + references */}
          <div className="space-y-7">
            <div>
              <div className="studio-kicker">{t("Team fit")}</div>
              <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">
                {t(
                  "Pick a team, or let HenryCo match the strongest fit to your scope, urgency, and industry.",
                )}
              </p>
              <div className="mt-3">
                <StudioListbox
                  label={t("Preferred team")}
                  value={selectedTeamId}
                  onChange={setSelectedTeamId}
                  placeholder={t("Let HenryCo recommend the best-fit team")}
                  options={teamOptions}
                />
              </div>
              {selectedTeam ? (
                <div className="mt-4 rounded-[1.4rem] border border-[var(--studio-line)] bg-[color:var(--home-surface-04)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-base font-semibold text-[var(--studio-ink)]">
                      {selectedTeam.name}
                    </div>
                    <span className="shrink-0 rounded-full border border-[var(--studio-line)] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                      {selectedTeam.availability}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                    {selectedTeam.summary}
                  </p>
                </div>
              ) : (
                <p className="mt-4 border-l-2 border-[var(--studio-signal)]/55 pl-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                  {t(
                    "We will match the strongest team to your brief based on scope, urgency, and your industry signals.",
                  )}
                </p>
              )}
            </div>

            <div>
              <div className="studio-kicker">{t("References & inspiration")}</div>
              <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">
                {t(
                  "Optional, but it sharpens the proposal. Links and files attach to your Studio record.",
                )}
              </p>
              <div className="mt-4">
                <StudioReferenceAttachments />
              </div>
            </div>
          </div>

          {/* Right — contact + commit + submit */}
          <div className="space-y-5">
            <div>
              <div className="studio-kicker">{t("Your details")}</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  name="customerName"
                  required
                  className="studio-input rounded-[1.2rem] px-4 py-3"
                  placeholder={t("Full name")}
                  autoComplete="name"
                />
                <input
                  name="companyName"
                  className="studio-input rounded-[1.2rem] px-4 py-3"
                  placeholder={t("Company, school, or brand (optional)")}
                  autoComplete="organization"
                />
                <input
                  name="email"
                  type="email"
                  required
                  className="studio-input rounded-[1.2rem] px-4 py-3"
                  placeholder={t("Best email for updates")}
                  autoComplete="email"
                />
                <input
                  name="phone"
                  className="studio-input rounded-[1.2rem] px-4 py-3"
                  placeholder={t("WhatsApp or phone (optional)")}
                  autoComplete="tel"
                />
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-[1.4rem] border border-[var(--studio-line)] bg-[color:var(--home-surface-04)] px-4 py-4 text-sm leading-7 text-[var(--studio-ink-soft)]">
              <input type="checkbox" name="depositNow" className="mt-1" />
              <span>
                {t(
                  "I am ready to secure a deposit-backed lane as soon as HenryCo confirms scope and pricing with me.",
                )}
              </span>
            </label>

            <StudioSubmitButton
              label={t("Submit Studio brief")}
              pendingLabel={t("Building your Studio brief...")}
            />

            <p className="text-xs leading-5 text-[var(--studio-ink-soft)]">
              {t(
                "Nothing goes live until you approve scope and payment. You can still adjust references or details with your lead before the deposit lands.",
              )}
            </p>

            <div className="rounded-[1.5rem] border border-[var(--studio-line)] bg-[color:var(--home-surface-04)] p-5">
              <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-signal)]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                {t("What happens after you submit")}
              </div>
              <div className="mt-4 space-y-3">
                {nextSteps.map((item) => (
                  <div
                    key={item}
                    className="flex gap-3 text-[13px] leading-6 text-[var(--studio-ink-soft)]"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--studio-signal)]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
