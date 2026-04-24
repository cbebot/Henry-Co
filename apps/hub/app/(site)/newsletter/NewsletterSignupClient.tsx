"use client";

import { useMemo, useState } from "react";
import type { NewsletterDivision, NewsletterTopicDefinition } from "@henryco/newsletter";

type GroupProps = {
  groups: Array<{
    division: NewsletterDivision;
    topics: NewsletterTopicDefinition[];
  }>;
};

type SubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; preferenceUrl: string | null; created: boolean; topics: string[] }
  | { status: "error"; message: string };

const DIVISION_LABEL: Record<NewsletterDivision, string> = {
  hub: "HenryCo Group",
  account: "Account",
  care: "Care",
  jobs: "Jobs",
  learn: "Learn",
  logistics: "Logistics",
  marketplace: "Marketplace",
  property: "Property",
  studio: "Studio",
};

export default function NewsletterSignupClient({ groups }: GroupProps) {
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
          (body.code === "suppressed"
            ? "This address is on our suppression list."
            : "Something went wrong. Try again.");
        setState({ status: "error", message });
        return;
      }
      setState({
        status: "success",
        preferenceUrl: body.preferenceUrl ?? null,
        created: Boolean(body.created),
        topics: body.topicKeys ?? Array.from(selectedTopics),
      });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  };

  if (state.status === "success") {
    return (
      <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] p-6">
        <h2 className="text-lg font-semibold">
          {state.created ? "You&rsquo;re subscribed" : "Preferences updated"}
        </h2>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
          We&rsquo;ll email {email} about: {state.topics.join(", ")}.
        </p>
        {state.preferenceUrl ? (
          <p className="mt-4 text-sm">
            Manage preferences any time:{" "}
            <a
              href={state.preferenceUrl}
              className="underline decoration-dotted underline-offset-4"
            >
              open preference center
            </a>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span>Email address</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-md border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm outline-none focus:border-[color:var(--ring)] focus:ring-1 focus:ring-[color:var(--ring)]"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span>Country (2 letter, optional)</span>
          <input
            type="text"
            maxLength={2}
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase())}
            placeholder="NG"
            className="rounded-md border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm uppercase outline-none focus:border-[color:var(--ring)] focus:ring-1 focus:ring-[color:var(--ring)]"
          />
        </label>
      </div>

      <div>
        <p className="text-sm font-medium">Pick what you want to hear about</p>
        <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
          You can change or remove any of these later.
        </p>
        <div className="mt-4 space-y-6">
          {groups.map((group) => (
            <section key={group.division} className="space-y-3">
              <h3 className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
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
                      className={`flex cursor-pointer gap-3 rounded-md border p-3 transition-colors ${
                        active
                          ? "border-[color:var(--foreground)]"
                          : "border-[color:var(--border)]"
                      }`}
                    >
                      <input
                        id={id}
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleTopic(topic.key)}
                        className="mt-1 h-4 w-4"
                      />
                      <span>
                        <span className="block text-sm font-medium">{topic.label}</span>
                        <span className="mt-1 block text-xs text-[color:var(--muted-foreground)]">
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

      <label className="flex items-start gap-3 text-xs text-[color:var(--muted-foreground)]">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4"
        />
        <span>
          I agree to receive these newsletters from HenryCo. I understand I can unsubscribe any
          time, and that HenryCo will suppress sends during active support or billing issues.
        </span>
      </label>

      <input
        type="hidden"
        name="locale"
        value={locale}
        onChange={(e) => setLocale((e.target as HTMLInputElement).value)}
      />

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center justify-center rounded-md bg-[color:var(--foreground)] px-4 py-2 text-sm font-medium text-[color:var(--background)] disabled:opacity-50"
        >
          {state.status === "submitting" ? "Subscribing…" : "Subscribe"}
        </button>
        {state.status === "error" ? (
          <span className="text-sm text-[color:var(--destructive)]">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
