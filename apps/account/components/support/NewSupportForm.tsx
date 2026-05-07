"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { translateSurfaceLabel, useHenryCoLocale } from "@henryco/i18n";
import { ButtonPendingContent } from "@henryco/ui";
import { ChatComposer } from "@henryco/chat-composer";
import type { ComposerSendPayload } from "@henryco/chat-composer";

const SUPPORT_CATEGORIES = [
  "general",
  "care",
  "marketplace",
  "jobs",
  "learn",
  "logistics",
  "property",
  "studio",
  "billing",
  "wallet",
  "account",
  "other",
] as const;

type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

type SearchParamsReader = {
  get(name: string): string | null;
};

function cleanSupportParam(value: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

function isSupportCategory(value: string): value is SupportCategory {
  return SUPPORT_CATEGORIES.includes(value as SupportCategory);
}

function normalizeSupportCategory(category: string, division: string): SupportCategory {
  const candidate = (category || division).toLowerCase();
  return isSupportCategory(candidate) ? candidate : "general";
}

function formatSupportContext(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildSupportPrefill(searchParams: SearchParamsReader) {
  const division = cleanSupportParam(searchParams.get("division"));
  const category = cleanSupportParam(searchParams.get("category"));
  const context = cleanSupportParam(searchParams.get("context"));
  const subject = cleanSupportParam(searchParams.get("subject"));
  const message = cleanSupportParam(searchParams.get("message"));

  if (message) {
    return {
      category: normalizeSupportCategory(category, division),
      subject,
      message,
    };
  }

  const messageLines: string[] = [];
  if (division) {
    messageLines.push(`Division: ${formatSupportContext(division)}`);
  }
  if (context) {
    messageLines.push(`Context: ${formatSupportContext(context)}`);
  }
  if (messageLines.length) {
    messageLines.push("");
    messageLines.push("Please describe what happened, when it started, and what you expected instead.");
  }

  return {
    category: normalizeSupportCategory(category, division),
    subject,
    message: messageLines.join("\n"),
  };
}

export default function NewSupportForm() {
  const locale = useHenryCoLocale();
  const t = useCallback((text: string) => translateSurfaceLabel(locale, text), [locale]);
  const searchParams = useSearchParams();
  const categories = [
    { value: "general", label: t("General") },
    { value: "care", label: t("Care Service") },
    { value: "marketplace", label: t("Marketplace") },
    { value: "jobs", label: t("Jobs") },
    { value: "learn", label: t("Learn") },
    { value: "logistics", label: t("Logistics") },
    { value: "property", label: t("Property") },
    { value: "studio", label: t("Studio") },
    { value: "billing", label: t("Billing & Payments") },
    { value: "wallet", label: t("Wallet") },
    { value: "account", label: t("Account & Security") },
    { value: "other", label: t("Other") },
  ];
  const prefill = buildSupportPrefill(searchParams);
  const [subject, setSubject] = useState(prefill.subject);
  const [category, setCategory] = useState<SupportCategory>(prefill.category);
  const [message, setMessage] = useState(prefill.message);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setSubject(prefill.subject);
    setCategory(prefill.category);
    setMessage(prefill.message);
  }, [prefill.category, prefill.message, prefill.subject]);

  const localizeSupportError = useCallback((message: string) => {
    switch (message) {
      case "Unauthorized":
        return t("Please sign in to continue.");
      case "Subject and message required":
        return t("Subject and message required.");
      case "Failed to create thread":
      case "Failed to create support message":
      case "Failed to create request":
        return t("Failed to create request");
      case "Internal error":
        return t("Something went wrong");
      default:
        return t(message);
    }
  }, [t]);

  const submit = useCallback(
    async (bodyText: string) => {
      const trimmedSubject = subject.trim();
      if (!trimmedSubject) {
        throw new Error(localizeSupportError("Subject and message required"));
      }
      const res = await fetch("/api/support/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: trimmedSubject, category, message: bodyText }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(
          localizeSupportError(data.error || "Failed to create request")
        );
      }
      router.push("/support");
      router.refresh();
    },
    [subject, category, router, localizeSupportError]
  );

  const handleSend = useCallback(
    async ({ text }: ComposerSendPayload) => {
      setError(null);
      setLoading(true);
      try {
        await submit(text);
        setMessage("");
      } finally {
        setLoading(false);
      }
    },
    [submit]
  );

  return (
    <div className="acct-card p-6">
      {error && (
        <div className="mb-4 rounded-xl bg-[var(--acct-red-soft)] px-4 py-3 text-sm text-[var(--acct-red)]">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("Category")}</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as SupportCategory)}
            className="acct-select"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("Subject")}</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="acct-input"
            placeholder={t("Brief description of your issue")}
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("Message")}</label>
          <ChatComposer
            threadId={`new-support:${category}`}
            tone="account"
            ariaLabel={t("New support request")}
            placeholder={t("Describe your issue in detail...")}
            initialText={message}
            busy={loading}
            disabled={loading}
            enableAttachments={false}
            labels={{
              sendLabel: t("Submit request"),
              sendingLabel: t("Submitting request..."),
              draftSavedLabel: t("Draft saved"),
              discardDraftLabel: t("Discard"),
              expandLabel: t("Open full-screen"),
              collapseLabel: t("Collapse"),
              fullScreenTitleLabel: t("New support request"),
            }}
            onSend={handleSend}
            onSendError={(err) =>
              setError(localizeSupportError(err.message))
            }
          />
        </div>
      </div>

      {/*
        Hidden fallback button so screen-readers and progressive-enhancement
        users always have a non-keyboard path. The composer's ⌘/Ctrl + Enter
        and on-screen send button remain the primary submit affordance.
      */}
      <ButtonPendingContent
        pending={loading}
        pendingLabel={t("Submitting request...")}
        spinnerLabel={t("Submitting request...")}
      >
        <span className="sr-only">{t("Submit request")}</span>
      </ButtonPendingContent>
    </div>
  );
}
