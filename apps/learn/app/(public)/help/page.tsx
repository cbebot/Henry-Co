import { createSupportRequestAction } from "@/lib/learn/actions";
import { PendingSubmitButton } from "@/components/learn/pending-submit-button";
import { LearnPanel, LearnSectionIntro } from "@/components/learn/ui";
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
      <LearnSectionIntro
        kicker={t("Help")}
        title={t("We’re here when something blocks your learning.")}
        body={t("Send a note about certificates, enrollment, assignments, or billing. The same HenryCo team that runs the academy receives it—include your course name and account email so we can help faster.")}
      />

      {params.sent ? (
        <LearnPanel className="mt-8 rounded-[2rem]">
          <p className="text-sm text-[var(--learn-mint-soft)]">
            {t("Message received. We’ll reply using the contact details on your HenryCo account.")}
          </p>
        </LearnPanel>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr,0.9fr]">
        <LearnPanel className="rounded-[2rem]">
          <form action={createSupportRequestAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--learn-ink)]">{t("Subject")}</label>
              <input name="subject" required className="learn-input mt-2 rounded-2xl px-4 py-3" placeholder={t("e.g. Certificate not showing, can’t open lesson…")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--learn-ink)]">{t("Message")}</label>
              <textarea name="body" required rows={6} className="learn-textarea mt-2 rounded-2xl px-4 py-3" placeholder={t("What were you trying to do, what happened instead, and any error text you saw?")} />
            </div>
            <PendingSubmitButton pendingLabel={t("Sending…")}>{t("Send message")}</PendingSubmitButton>
          </form>
        </LearnPanel>

        <LearnPanel className="rounded-[2rem]">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">{t("Quick answers")}</h3>
          <div className="mt-5 space-y-5 text-sm leading-7 text-[var(--learn-ink-soft)]">
            <div>
              <p className="font-semibold text-[var(--learn-ink)]">{t("How do I continue a course?")}</p>
              <p className="mt-1">
                Open{" "}
                <a href={getAccountLearnUrl("active")} className="text-[var(--learn-mint-soft)] underline-offset-2 hover:underline">
                  {t("Learn → Active")}
                </a>{" "}
                {t("in your HenryCo account, or go back to the course page and open your learning room.")}
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--learn-ink)]">{t("When do I get a certificate?")}</p>
              <p className="mt-1">
                {t("Only some courses award one. Finish every required lesson and meet any quiz rules; your learning room shows a checklist. Then download from the room or view under")}{" "}
                <a href={getAccountLearnUrl("certificates")} className="text-[var(--learn-mint-soft)] underline-offset-2 hover:underline">
                  {t("Certificates")}
                </a>{" "}
                {t("in your account.")}
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--learn-ink)]">{t("Can my manager assign training?")}</p>
              <p className="mt-1">{t("Yes. Assigned programs appear in your account under Learn → Assignments while you complete them in the usual learning room.")}</p>
            </div>
          </div>
        </LearnPanel>
      </div>
    </main>
  );
}
