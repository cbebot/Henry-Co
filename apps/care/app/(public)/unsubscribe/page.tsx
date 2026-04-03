import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck, MailX, RotateCcw } from "lucide-react";

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
    <div className="care-page relative overflow-hidden">
      <div className="care-top-glow" />
      <section className="mx-auto flex min-h-[85vh] w-[min(100%-1.5rem,960px)] items-center py-16">
        <div className="care-glow-card care-sheen w-full rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.8rem] bg-[color:var(--accent)]/12">
              {isSuccess ? (
                isResubscribe ? (
                  <RotateCcw className="h-8 w-8 text-[color:var(--accent)]" />
                ) : (
                  <MailX className="h-8 w-8 text-[color:var(--accent)]" />
                )
              ) : (
                <MailCheck className="h-8 w-8 text-[color:var(--accent)]" />
              )}
            </div>

            <div className="care-kicker mt-6">Messaging preferences</div>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white sm:text-5xl">
              {isSuccess
                ? isResubscribe
                  ? "Marketing messages are active again."
                  : "Marketing messages are now paused."
                : "We could not update this preference link."}
            </h1>
            <p className="mt-4 text-base leading-8 text-zinc-600 dark:text-white/68 sm:text-lg">
              {isSuccess
                ? isResubscribe
                  ? "HenryCo Care can send future service reminders and occasional re-engagement notes again."
                  : "HenryCo Care will stop sending reminder and outreach messages tied to this customer contact. Transactional updates like active booking progress can still continue when required."
                : "The preference token was missing or invalid. Use the most recent email link or contact the Care team directly."}
            </p>

            {email || phone ? (
              <div className="mt-6 rounded-[1.6rem] border border-black/10 bg-black/[0.03] px-5 py-4 text-sm leading-7 text-zinc-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/72">
                {email ? <div>Email: {email}</div> : null}
                {phone ? <div>Phone: {phone}</div> : null}
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="care-button-primary inline-flex h-14 items-center justify-center rounded-full px-7 text-sm font-semibold"
              >
                Return to HenryCo Care
              </Link>
              <Link
                href="/contact"
                className="care-button-secondary inline-flex h-14 items-center justify-center rounded-full px-7 text-sm font-semibold"
              >
                Contact support
              </Link>
              {isSuccess && !isResubscribe && token ? (
                <Link
                  href={`/api/care/preferences/unsubscribe?mode=resubscribe&token=${encodeURIComponent(token)}`}
                  className="inline-flex h-14 items-center justify-center rounded-full border border-black/10 bg-white px-7 text-sm font-semibold text-zinc-900 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                >
                  Undo and keep reminders on
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
