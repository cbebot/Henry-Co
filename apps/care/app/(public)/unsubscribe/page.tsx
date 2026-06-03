import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck, MailX, RotateCcw } from "lucide-react";

export const metadata: Metadata = {
  title: "Messaging Preferences | Henry Onyx Fabric Care",
  description:
    "Pause or restore Henry Onyx Fabric Care reminder and outreach messages from the customer preference center.",
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
      id="henryco-main"
      tabIndex={-1}
      className="min-h-[80vh] px-4 py-16 sm:px-6 lg:px-10"
    >
      <section className="mx-auto max-w-2xl">
        <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[color:var(--home-accent-text)]">
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
        <h1 className="mt-5 text-balance care-display text-[color:var(--home-ink)]">
          {isSuccess
            ? isResubscribe
              ? "Marketing messages are active again."
              : "Marketing messages are now paused."
            : "We could not update this preference link."}
        </h1>
        <p className="mt-5 text-pretty text-base leading-[1.7] text-[color:var(--home-ink-70)] sm:text-lg">
          {isSuccess
            ? isResubscribe
              ? "Henry Onyx Fabric Care can send future service reminders and occasional re-engagement notes again."
              : "Henry Onyx Fabric Care will stop sending reminder and outreach messages tied to this customer contact. Transactional updates like active booking progress can still continue when required."
            : "The preference token was missing or invalid. Use the most recent email link or contact the Care team directly."}
        </p>

        {email || phone ? (
          <ul className="mt-8 divide-y divide-[color:var(--home-line)] border-y border-[color:var(--home-line)]">
            {email ? (
              <li className="flex items-baseline gap-3 py-3">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-ink-50)]">
                  Email
                </span>
                <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[color:var(--home-ink)]">
                  {email}
                </span>
              </li>
            ) : null}
            {phone ? (
              <li className="flex items-baseline gap-3 py-3">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-ink-50)]">
                  Phone
                </span>
                <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[color:var(--home-ink)]">
                  {phone}
                </span>
              </li>
            ) : null}
          </ul>
        ) : null}

        <div className="mt-8 border-l-2 border-[color:var(--home-accent)]/55 pl-5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-accent-text)]">
            What still sends
          </p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--home-ink-70)]">
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
            Return to Henry Onyx
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--home-line)] px-6 py-3 text-sm font-semibold text-[color:var(--home-ink)] transition hover:border-[color:var(--home-accent)]/50 hover:bg-[color:var(--home-surface-04)]"
          >
            Contact support
          </Link>
          {isSuccess && !isResubscribe && token ? (
            <Link
              href={`/api/care/preferences/unsubscribe?mode=resubscribe&token=${encodeURIComponent(token)}`}
              className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[color:var(--home-accent-text)] underline-offset-4 hover:underline"
            >
              Undo and keep reminders on
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
