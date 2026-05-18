import { translateSurfaceLabel } from "@henryco/i18n/server";
import { requireLearnRoles } from "@/lib/learn/auth";
import { getLearnSnapshot } from "@/lib/learn/data";
import { ownerNav } from "@/lib/learn/navigation";
import { getLearnPublicLocale } from "@/lib/locale-server";
import { LearnPanel, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function OwnerCertificatesPage() {
  await requireLearnRoles(["academy_owner", "academy_admin", "support"], "/owner/certificates");
  const snapshot = await getLearnSnapshot();
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <LearnWorkspaceShell
      kicker={t("Certificates")}
      title={t("Monitor issued credentials and verification state.")}
      description={t("Certificates stay tied to enrollments and public verification codes so the academy can prove what was earned.")}
      nav={ownerNav("/owner/certificates", t)}
    >
      <div className="space-y-5">
        {snapshot.certificates.map((certificate) => {
          const course = snapshot.courses.find((item) => item.id === certificate.courseId);
          return (
            <LearnPanel key={certificate.id} className="rounded-[2rem]">
              <div className="font-semibold text-[var(--learn-ink)]">{course?.title}</div>
              <p className="mt-2 text-sm text-[var(--learn-ink-soft)]">{certificate.certificateNo} • {certificate.verificationCode}</p>
            </LearnPanel>
          );
        })}
      </div>
    </LearnWorkspaceShell>
  );
}
