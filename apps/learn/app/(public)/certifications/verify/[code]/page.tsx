import { notFound } from "next/navigation";
import { LearnPanel, LearnSectionIntro, LearnStatusBadge } from "@/components/learn/ui";
import { getCertificateByCode } from "@/lib/learn/data";

export default async function CertificateVerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const data = await getCertificateByCode(code);
  if (!data) notFound();

  return (
    <main className="mx-auto max-w-4xl px-5 py-14 sm:px-8">
      <LearnSectionIntro
        kicker="Certificate Verification"
        title="This HenryCo Learn certificate is live and traceable."
        body="Verification is pulled from the academy certificate record so external viewers can trust the credential source."
      />

      <LearnPanel className="mt-8 rounded-[2.4rem] p-8 sm:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <LearnStatusBadge label={data.certificate.status} tone="success" />
          <LearnStatusBadge label={data.course?.title || "Course"} />
        </div>
        <h2 className="mt-6 text-3xl font-semibold tracking-[-0.05em] text-[var(--learn-ink)]">{data.course?.title}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.6rem] border border-[var(--learn-line)] bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">Certificate no</p>
            <p className="mt-2 text-xl font-semibold text-[var(--learn-ink)]">{data.certificate.certificateNo}</p>
          </div>
          <div className="rounded-[1.6rem] border border-[var(--learn-line)] bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">Verification code</p>
            <p className="mt-2 text-xl font-semibold text-[var(--learn-ink)]">{data.certificate.verificationCode}</p>
          </div>
          <div className="rounded-[1.6rem] border border-[var(--learn-line)] bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">Issued at</p>
            <p className="mt-2 text-xl font-semibold text-[var(--learn-ink)]">{new Date(data.certificate.issuedAt).toLocaleDateString("en-NG")}</p>
          </div>
          <div className="rounded-[1.6rem] border border-[var(--learn-line)] bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">Score</p>
            <p className="mt-2 text-xl font-semibold text-[var(--learn-ink)]">{data.certificate.score ?? "Completed"}</p>
          </div>
        </div>
      </LearnPanel>
    </main>
  );
}
