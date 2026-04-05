import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, CircleCheckBig, Download, FileCheck2, ShieldCheck, Sparkles } from "lucide-react";
import { CertificateDownloadButton } from "@/components/learn/certificate-download-button";
import { LearnPanel, LearnSectionIntro, LearnStatusBadge } from "@/components/learn/ui";
import { getCertificateByCode } from "@/lib/learn/data";
import { lookupLearnProfiles, resolveLearnProfile } from "@/lib/learn/people";

function formatDateLabel(value?: string | null) {
  if (!value) return "Not yet";
  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function displayName(value?: string | null) {
  const text = String(value || "").trim();
  return text || "HenryCo learner";
}

export default async function CertificateVerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const data = await getCertificateByCode(code);
  if (!data) notFound();

  const profileDirectory = await lookupLearnProfiles([
    {
      userId: data.enrollment?.userId || data.certificate.userId,
      normalizedEmail: data.enrollment?.normalizedEmail || data.certificate.normalizedEmail,
    },
  ]);
  const learnerProfile = resolveLearnProfile(profileDirectory, {
    userId: data.enrollment?.userId || data.certificate.userId,
    normalizedEmail: data.enrollment?.normalizedEmail || data.certificate.normalizedEmail,
  });
  const learnerName = displayName(learnerProfile?.fullName);

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <LearnSectionIntro
        kicker="Certificate verification"
        title="Confirm this HenryCo Learn certificate is genuine."
        body="Enter or follow a verification code to see the official record: learner name, course, issue date, and status. This is the same check employers and partners use—no login required."
      />

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
        <LearnPanel className="learn-print-sheet rounded-[2.4rem] p-0">
          <div className="rounded-[2.4rem] border border-[var(--learn-line)] bg-[linear-gradient(160deg,rgba(227,188,126,0.16),rgba(95,197,171,0.1))] p-8 sm:p-10">
            <div className="learn-print-hidden flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <LearnStatusBadge label={data.certificate.status} tone="success" />
                <LearnStatusBadge label="Verification live" tone="signal" />
              </div>
              <div className="flex flex-wrap gap-3">
                <CertificateDownloadButton label="Download certificate" />
                <Link
                  href="/certifications"
                  className="learn-button-secondary rounded-full px-4 py-2.5 text-sm font-semibold"
                >
                  Browse certifications
                </Link>
              </div>
            </div>

            <div className="mt-8 rounded-[2rem] border border-[var(--learn-line)] bg-white/5 p-8 sm:p-10">
              <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-[var(--learn-ink-soft)]">
                HenryCo Learn Certificate
              </p>
              <h1 className="mt-6 text-center text-[2.7rem] font-semibold tracking-[-0.06em] text-[var(--learn-ink)] sm:text-[3.8rem]">
                {learnerName}
              </h1>
              <p className="mt-4 text-center text-sm leading-8 text-[var(--learn-ink-soft)]">
                has satisfied the learning and assessment requirements for
              </p>
              <p className="mt-4 text-center text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">
                {data.course?.title || "HenryCo Learn program"}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[1.5rem] border border-[var(--learn-line)] bg-black/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                    Certificate no
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--learn-ink)]">
                    {data.certificate.certificateNo}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-[var(--learn-line)] bg-black/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                    Verification code
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--learn-ink)]">
                    {data.certificate.verificationCode}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-[var(--learn-line)] bg-black/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                    Issued
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--learn-ink)]">
                    {formatDateLabel(data.certificate.issuedAt)}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-[var(--learn-line)] bg-black/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                    Score
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--learn-ink)]">
                    {data.certificate.score ?? "Completed"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </LearnPanel>

        <div className="space-y-6">
          <LearnPanel className="rounded-[2rem]">
            <div className="flex items-center gap-3 text-[var(--learn-copper)]">
              <ShieldCheck className="h-5 w-5" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">Trust checks</p>
            </div>
            <div className="mt-5 space-y-3">
              {[
                "The certificate number is unique inside HenryCo Learn.",
                "The verification code resolves to the academy record, not a placeholder file.",
                "Completion and assessment status are tied to the course enrollment path.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4"
                >
                  <div className="flex items-start gap-3">
                    <CircleCheckBig className="mt-0.5 h-5 w-5 text-emerald-200" />
                    <p className="text-sm leading-7 text-[var(--learn-ink-soft)]">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </LearnPanel>

          <LearnPanel className="rounded-[2rem]">
            <div className="flex items-center gap-3 text-[var(--learn-mint-soft)]">
              <Award className="h-5 w-5" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">Program rules</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--learn-ink-soft)]">
              {data.course?.completionRule ||
                "This certificate was issued after the course completion rules and assessment requirements were satisfied."}
            </p>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <FileCheck2 className="h-5 w-5 text-[var(--learn-copper)]" />
                  <p className="text-sm font-semibold text-[var(--learn-ink)]">Completion state</p>
                </div>
                <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
                  {data.enrollment?.status === "completed"
                    ? "Enrollment is marked completed in the academy record."
                    : "The certificate remains linked to the underlying enrollment record."}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-[var(--learn-mint-soft)]" />
                  <p className="text-sm font-semibold text-[var(--learn-ink)]">Public readiness</p>
                </div>
                <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
                  This verification page is ready to be shared as the credibility surface for the credential.
                </p>
              </div>
            </div>
          </LearnPanel>

          {data.course ? (
            <LearnPanel className="rounded-[2rem]">
              <Link
                href={`/courses/${data.course.slug}`}
                className="learn-button-secondary rounded-full px-4 py-2.5 text-sm font-semibold"
              >
                Open course
              </Link>
              <div className="mt-4 flex items-center gap-3 text-[var(--learn-copper)]">
                <Download className="h-5 w-5" />
                <p className="text-sm font-semibold text-[var(--learn-ink)]">
                  Need a saved copy?
                </p>
              </div>
              <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
                Use the download button to print or save this certificate directly from the live verification surface.
              </p>
            </LearnPanel>
          ) : null}
        </div>
      </section>
    </main>
  );
}
