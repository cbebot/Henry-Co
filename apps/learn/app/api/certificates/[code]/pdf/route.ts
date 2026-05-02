import { NextResponse, type NextRequest } from "next/server";

import { LearnCertificateDocument } from "@henryco/branded-documents";
import { buildVerificationQr } from "@henryco/branded-documents/qr";

import { getCertificateByCode } from "@/lib/learn/data";
import { lookupLearnProfiles, resolveLearnProfile } from "@/lib/learn/people";
import { streamPdfResponse } from "@/lib/branded-documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ code: string }> };

function resolveBaseUrl(request: NextRequest) {
  const fromEnv = process.env.NEXT_PUBLIC_LEARN_URL || process.env.NEXT_PUBLIC_HUB_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(request: NextRequest, ctx: RouteParams) {
  const { code } = await ctx.params;
  const data = await getCertificateByCode(code);
  if (!data) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

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

  const baseUrl = resolveBaseUrl(request);
  const verificationUrl = `${baseUrl}/certifications/verify/${data.certificate.verificationCode}`;
  const qrDataUrl = await buildVerificationQr(verificationUrl);

  const element = LearnCertificateDocument({
    certificate: {
      id: data.certificate.id,
      certificateNo: data.certificate.certificateNo,
      verificationCode: data.certificate.verificationCode,
      issuedAt: data.certificate.issuedAt,
      score: data.certificate.score ?? null,
      learnerName: learnerProfile?.fullName || "HenryCo learner",
      courseTitle: data.course?.title || "HenryCo Learn programme",
      courseSlug: data.course?.slug || null,
      completionRule: data.course?.completionRule || null,
    },
    verificationUrl,
    qrDataUrl,
  });

  const wantsDownload = new URL(request.url).searchParams.get("download") === "1";
  return streamPdfResponse({
    element,
    type: "Certificate",
    id: data.certificate.certificateNo,
    download: wantsDownload,
  });
}
