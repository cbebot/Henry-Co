import { ArrowRight } from "lucide-react";
import { createSupportRequestAction } from "@/lib/learn/actions";
import { PendingSubmitButton } from "@/components/learn/pending-submit-button";
import { getAccountLearnUrl } from "@/lib/learn/links";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { getLearnPublicLocale } from "@/lib/locale-server";

export async function generateMetadata() {
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return { title: t("Help - HenryCo Learn") };
}

export default async function HelpPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <section>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--learn-mint-soft)]">
          {t("Help")}
        </p>
        <h1 className="mt-4 max-w-3xl text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--learn-ink)] sm:text-[2.7rem] md:text-[3.1rem]">
          {t("Stuck? We unblock fast.")}
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--learn-ink-soft)]">
          {t(
            "Send a note about certificates, enrollment, assignments, or billing. Include your course name and account email so the academy team can help without back-and-forth.",
          )}
        </p>
      </section>

      {params.sent ? (
        <section className="mt-10 border-l-2 border-[var(--learn-mint-soft)]/55 pl-5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-mint-soft)]">
            {t("Sent")}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
            {t("Message received. We’ll reply using the contact details on your HenryCo account.")}
          </p>
        </section>
      ) : null}

      <section className="mt-12 grid gap-12 lg:grid-cols-[1fr,0.9fr] lg:divide-x lg:divide-[var(--learn-line)]">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--learn-mint-soft)]">
            {t("Send a message")}
          </p>
          <form action={createSupportRequestAction} className="mt-6 space-y-5">
            <div>
              <label className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                {t("Subject")}
              </label>
              <input
                name="subject"
                required
                className="learn-input mt-2 w-full rounded-2xl px-4 py-3"
                placeholder={t("e.g. Certificate not showing, can’t open lesson…")}
              />
            </div>
            <div>
              <label className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                {t("Message")}
              </label>
              <textarea
                name="body"
                required
                rows={6}
                className="learn-textarea mt-2 w-full rounded-2xl px-4 py-3"
                placeholder={t(
                  "What were you trying to do, what happened instead, and any error text you saw?",
                )}
              />
            </div>
            <PendingSubmitButton pendingLabel={t("Sending…")}>
              {t("Send message")}
            </PendingSubmitButton>
          </form>
        </div>

        <div className="lg:pl-12">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--learn-mint-soft)]">
            {t("Quick answers")}
          </p>
          <ul className="mt-6 divide-y divide-[var(--learn-line)] border-y border-[var(--learn-line)]">
            <li className="py-4">
              <h3 className="text-sm font-semibold tracking-tight text-[var(--learn-ink)]">
                {t("How do I continue a course?")}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
                {t("Open")}{" "}
                <a
                  href={getAccountLearnUrl("active")}
                  className="font-semibold text-[var(--learn-mint-soft)] underline-offset-2 hover:underline"
                >
                  {t("Learn → Active")}
                </a>{" "}
                {t(
                  "in your HenryCo account, or go back to the course page and open your learning room.",
                )}
              </p>
            </li>
            <li className="py-4">
              <h3 className="text-sm font-semibold tracking-tight text-[var(--learn-ink)]">
                {t("When do I get a certificate?")}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
                {t(
                  "Only some courses award one. Finish every required lesson and meet any quiz rules; your learning room shows a checklist. Then download from the room or view under",
                )}{" "}
                <a
                  href={getAccountLearnUrl("certificates")}
                  className="font-semibold text-[var(--learn-mint-soft)] underline-offset-2 hover:underline"
                >
                  {t("Certificates")}
                </a>{" "}
                {t("in your account.")}
              </p>
            </li>
            <li className="py-4">
              <h3 className="text-sm font-semibold tracking-tight text-[var(--learn-ink)]">
                {t("Can my manager assign training?")}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
                {t(
                  "Yes. Assigned programs appear in your account under Learn → Assignments while you complete them in the usual learning room.",
                )}
              </p>
            </li>
          </ul>
          <a
            href={getAccountLearnUrl()}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--learn-mint-soft)] underline-offset-4 hover:underline"
          >
            {t("Open Learn in account")}
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>
    </main>
  );
}
