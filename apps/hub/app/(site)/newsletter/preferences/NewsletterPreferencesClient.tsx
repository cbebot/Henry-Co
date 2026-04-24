"use client";

import { useState } from "react";
import type {
  NewsletterDivision,
  NewsletterSubscriberStatus,
  NewsletterTopicDefinition,
} from "@henryco/newsletter";

type Props = {
  token: string;
  initialTopicKeys: string[];
  initialStatus: NewsletterSubscriberStatus;
  locale: string;
  country: string | null;
  email: string;
  groups: Array<{
    division: NewsletterDivision;
    topics: NewsletterTopicDefinition[];
  }>;
};

type SubmissionState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; topicKeys: string[]; nextStatus: string }
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

export default function NewsletterPreferencesClient(props: Props) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(props.initialTopicKeys));
  const [paused, setPaused] = useState(props.initialStatus === "paused");
  const [state, setState] = useState<SubmissionState>({ status: "idle" });

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const savePreferences = async (opts: { unsubscribe?: boolean }) => {
    setState({ status: "saving" });
    try {
      const topicKeys = opts.unsubscribe ? [] : Array.from(selected);
      const res = await fetch(
        `/api/newsletter/preferences?token=${encodeURIComponent(props.token)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            topicKeys,
            pause: paused && !opts.unsubscribe ? true : false,
            locale: props.locale,
            country: props.country,
          }),
        }
      );
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        status?: string;
        topicKeys?: string[];
      };
      if (!res.ok || !body.ok) {
        setState({
          status: "error",
          message: body.message ?? "Unable to save preferences.",
        });
        return;
      }
      setState({
        status: "saved",
        topicKeys: body.topicKeys ?? topicKeys,
        nextStatus: body.status ?? "active",
      });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-md border border-[color:var(--border)] p-4">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={paused}
            onChange={(e) => setPaused(e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="font-medium">Pause all promotional sends</span>
            <span className="mt-1 block text-xs text-[color:var(--muted-foreground)]">
              You&rsquo;ll still get transactional emails (receipts, verification, shipping), just
              not newsletters.
            </span>
          </span>
        </label>
      </div>

      <div className="space-y-6">
        {props.groups.map((group) => (
          <section key={group.division} className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
              {DIVISION_LABEL[group.division]}
            </h3>
            <div className="space-y-2">
              {group.topics.map((topic) => {
                const id = `pref-${topic.key}`;
                const active = selected.has(topic.key);
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
                      onChange={() => toggle(topic.key)}
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

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => savePreferences({ unsubscribe: false })}
          disabled={state.status === "saving"}
          className="inline-flex items-center justify-center rounded-md bg-[color:var(--foreground)] px-4 py-2 text-sm font-medium text-[color:var(--background)] disabled:opacity-50"
        >
          {state.status === "saving" ? "Saving…" : "Save preferences"}
        </button>
        <button
          type="button"
          onClick={() => savePreferences({ unsubscribe: true })}
          disabled={state.status === "saving"}
          className="inline-flex items-center justify-center rounded-md border border-[color:var(--border)] px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Unsubscribe from all
        </button>
      </div>

      {state.status === "saved" ? (
        <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--background)] p-4 text-sm">
          <p className="font-medium">Preferences saved.</p>
          <p className="mt-1 text-[color:var(--muted-foreground)]">
            {state.nextStatus === "unsubscribed"
              ? "You&rsquo;ve been unsubscribed. We&rsquo;re sorry to see you go."
              : `Subscribed to: ${state.topicKeys.join(", ") || "nothing"}.`}
          </p>
        </div>
      ) : null}
      {state.status === "error" ? (
        <p className="text-sm text-[color:var(--destructive)]">{state.message}</p>
      ) : null}
    </div>
  );
}
