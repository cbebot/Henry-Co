import { redirect } from "next/navigation";

export default async function CertificateVerifyRedirect({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  if (!params.code) {
    redirect("/certifications");
  }
  redirect(`/certifications/verify/${params.code}`);
}
