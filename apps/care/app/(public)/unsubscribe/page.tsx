import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { MailCheck, MailX, RotateCcw } from "lucide-react";
import { CARE_ACCENT, CARE_ACCENT_SECONDARY } from "@/lib/care-theme";

export const metadata: Metadata = {
  title: "Messaging Preferences | HenryCo Care",
  description:
    "Pause or restore HenryCo Care reminder and outreach messages from the customer preference center.",
};

type SearchParams = {
  status?: string | string[];
  mode?: string | string[];
  email?: string | string[];
  phone?: string | string[];
  token?: string | string[];
};

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? String(value[0] || "").trim() : String(value || "").trim();
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const status = readParam(params.status) || "success";
  const mode = readParam(params.mode) || "unsubscribe";
  const email = readParam(params.email);
  const phone = readParam(params.phone);
  const token = readParam(params.token);
  const isSuccess = status === "success";
  const isResubscribe = mode === "resubscribe";

  return (
    <main
      className="min-h-[80vh] px-4 py-16 sm:px-6 lg:px-10"
      style={
        {
          "--accent": CARE_ACCENT,
          "--accent-secondary": CARE_ACCENT_SECONDARY,
        } as CSSProperties
      }
    >
      <section className="mx-auto max-w-2xl">
        <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[color:var(--accent)]">
          {isSuccess ? (
            isResubscribe ? (
              <RotateCcw className="h-3.5 w-3.5" />
            ) : (
              <MailX className="h-3.5 w-3.5" />
            )
          ) : (
            <MailCheck className="h-3.5 w-3.5" />
          )}
          Messaging preferences
        </p>
        <h1 className="mt-5 text-balance care-display text-zinc-950 dark:text-white">
          {isSuccess
            ? isResubscribe
              ? "Marketing messages are active again."
              : "Marketing messages are now paused."
            : "We could not update this preference link."}
        </h1>
        <p className="mt-5 text-pretty text-base leading-[1.7] text-zinc-600 sm:text-lg dark:text-white/68">
          {isSuccess
            ? isResubscribe
              ? "HenryCo Care can send future service reminders and occasional re-engagement notes again."
              : "HenryCo Care will stop sending reminder and outreach messages tied to this customer contact. Transactional updates like active booking progress can still continue when required."
            : "The preference token was missing or invalid. Use the most recent email link or contact the Care team directly."}
        </p>

        {email || phone ? (
          <ul className="mt-8 divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">
            {email ? (
              <li className="flex items-baseline gap-3 py-3">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-white/55">
                  Email
                </span>
                <span className="ml-auto text-right text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
                  {email}
                </span>
              </li>
            ) : null}
            {phone ? (
              <li className="flex items-baseline gap-3 py-3">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-white/55">
                  Phone
                </span>
                <span className="ml-auto text-right text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
                  {phone}
                </span>
              </li>
            ) : null}
          </ul>
        ) : null}

        <div className="mt-8 border-l-2 border-[color:var(--accent)]/55 pl-5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--accent)]">
            What still sends
          </p>
          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/68">
            Active booking confirmations, service-day reminders, and tracking updates continue
            because they are tied to operations &mdash; not marketing. You can pause those by
            contacting support.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="care-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
          >
            Return to HenryCo Care
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:border-[color:var(--accent)]/50 dark:border-white/15 dark:text-white"
          >
            Contact support
          </Link>
          {isSuccess && !isResubscribe && token ? (
            <Link
              href={`/api/care/preferences/unsubscribe?mode=resubscribe&token=${encodeURIComponent(token)}`}
              className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[color:var(--accent)] underline-offset-4 hover:underline"
            >
              Undo and keep reminders on
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
