"use client";

import { useMemo, useState } from "react";
import type { NewsletterDivision, NewsletterTopicDefinition } from "@henryco/newsletter";
import type { HubPublicCopy } from "@henryco/i18n";
import { PublicCTA } from "@henryco/ui/public-design";

type GroupProps = {
  groups: Array<{
    division: NewsletterDivision;
    topics: NewsletterTopicDefinition[];
  }>;
  copy: HubPublicCopy["newsletter"]["form"];
};

type SubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; preferenceUrl: string | null; created: boolean; topics: string[] }
  | { status: "error"; message: string };

// Division names are brand proper nouns (left untranslated, like the public selector).
const DIVISION_LABEL: Record<NewsletterDivision, string> = {
  hub: "Henry Onyx",
  account: "Account",
  care: "Care",
  jobs: "Jobs",
  learn: "Learn",
  logistics: "Logistics",
  marketplace: "Marketplace",
  property: "Property",
  studio: "Studio",
};

const FIELD_CLASS =
  "rounded-xl border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] px-3 py-2.5 text-sm text-[color:var(--home-ink)] outline-none placeholder:text-[color:var(--home-ink-35)] focus:border-[color:var(--home-accent)] focus:ring-2 focus:ring-[color:var(--home-accent-ring)]";

export default function NewsletterSignupClient({ groups, copy }: GroupProps) {
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [locale, setLocale] = useState("en-NG");
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(() => new Set(["company_digest"]));
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<SubmissionState>({ status: "idle" });

  const canSubmit = useMemo(() => {
    if (!email.trim()) return false;
    if (selectedTopics.size === 0) return false;
    if (!consent) return false;
    return state.status !== "submitting";
  }, [email, selectedTopics, consent, state.status]);

  const toggleTopic = (key: string) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    setState({ status: "submitting" });
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          topicKeys: Array.from(selectedTopics),
          locale,
          country: country.trim().toUpperCase() || null,
          sourceSurface: "hub/newsletter",
          sourceDivision: "hub",
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        code?: string;
        message?: string;
        preferenceUrl?: string;
        created?: boolean;
        topicKeys?: string[];
      };
      if (!res.ok || !body.ok) {
        const message =
          body.message ||
          (body.code === "suppressed" ? copy.errorSuppressed : copy.errorGeneric);
        setState({ status: "error", message });
        return;
      }
      setState({
        status: "success",
        preferenceUrl: body.preferenceUrl ?? null,
        created: Boolean(body.created),
        topics: body.topicKeys ?? Array.from(selectedTopics),
      });
    } catch {
      setState({
        status: "error",
        message: copy.errorNetwork,
      });
    }
  };

  if (state.status === "success") {
    return (
      <div className="rounded-[var(--home-radius)] border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-02)] p-6">
        <h2 className="home-title">
          {state.created ? copy.successCreatedTitle : copy.successUpdatedTitle}
        </h2>
        <p className="mt-2 text-sm text-[color:var(--home-ink-65)]">
          {copy.successBody
            .replace("{email}", email)
            .replace("{topics}", state.topics.join(", "))}
        </p>
        {state.preferenceUrl ? (
          <p className="mt-4 text-sm text-[color:var(--home-ink-65)]">
            {copy.managePrefs}{" "}
            <a
              href={state.preferenceUrl}
              className="home-focus font-medium text-[color:var(--home-accent-text)] underline decoration-dotted underline-offset-4"
            >
              {copy.openPreferenceCenter}
            </a>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--home-ink-70)]">
          <span>{copy.emailLabel}</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={copy.emailPlaceholder}
            className={FIELD_CLASS}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--home-ink-70)]">
          <span>{copy.countryLabel}</span>
          <input
            type="text"
            maxLength={2}
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase())}
            placeholder={copy.countryPlaceholder}
            className={`${FIELD_CLASS} uppercase`}
          />
        </label>
      </div>

      <div>
        <p className="text-sm font-medium text-[color:var(--home-ink)]">{copy.topicsTitle}</p>
        <p className="mt-1 text-xs text-[color:var(--home-ink-55)]">{copy.topicsHint}</p>
        <div className="mt-4 space-y-6">
          {groups.map((group) => (
            <section key={group.division} className="space-y-3">
              <h3 className="home-eyebrow text-[color:var(--home-ink-50)]">
                {DIVISION_LABEL[group.division]}
              </h3>
              <div className="space-y-2">
                {group.topics.map((topic) => {
                  const id = `topic-${topic.key}`;
                  const active = selectedTopics.has(topic.key);
                  return (
                    <label
                      key={topic.key}
                      htmlFor={id}
                      className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors ${
                        active
                          ? "border-[color:var(--home-accent)] bg-[color:var(--home-accent-soft)]"
                          : "border-[color:var(--home-line-12)] hover:border-[color:var(--home-line-15)]"
                      }`}
                    >
                      <input
                        id={id}
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleTopic(topic.key)}
                        className="mt-1 h-4 w-4 accent-[color:var(--home-accent)]"
                      />
                      <span>
                        <span className="block text-sm font-medium text-[color:var(--home-ink)]">
                          {topic.label}
                        </span>
                        <span className="mt-1 block text-xs text-[color:var(--home-ink-60)]">
                          {topic.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      <label className="flex items-start gap-3 text-xs text-[color:var(--home-ink-60)]">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 accent-[color:var(--home-accent)]"
        />
        <span>{copy.consent}</span>
      </label>

      <input
        type="hidden"
        name="locale"
        value={locale}
        onChange={(e) => setLocale((e.target as HTMLInputElement).value)}
      />

      <div className="flex items-center gap-4">
        <PublicCTA type="submit" variant="primary" disabled={!canSubmit}>
          {state.status === "submitting" ? copy.submitting : copy.submit}
        </PublicCTA>
        {state.status === "error" ? (
          <span className="text-sm text-[color:var(--hc-status-danger-text)]">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
