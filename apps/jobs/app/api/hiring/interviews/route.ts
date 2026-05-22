import { NextResponse } from "next/server";
import { scheduleInterview } from "@/lib/jobs/hiring";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { autoTranslate } from "@/lib/i18n/auto-translate";

export async function POST(request: Request) {
  const locale = await getJobsPublicLocale();
  const tx = (s: string) => autoTranslate(s, locale);

  try {
    const input = await request.json();

    if (!input.applicationId || !input.title?.trim() || !input.scheduledAt) {
      return NextResponse.json({ error: await tx("Missing required fields.") }, { status: 400 });
    }

    const interview = await scheduleInterview({
      applicationId: input.applicationId,
      title: input.title.trim(),
      scheduledAt: input.scheduledAt,
      durationMinutes: input.durationMinutes || 30,
      timezone: input.timezone || "Africa/Lagos",
      interviewType: input.interviewType || "video",
      location: input.location,
      meetingUrl: input.meetingUrl,
      notes: input.notes,
    });

    if (!interview) {
      return NextResponse.json({ error: await tx("Failed to schedule interview.") }, { status: 500 });
    }

    return NextResponse.json({ interview });
  } catch {
    return NextResponse.json({ error: await tx("Internal server error.") }, { status: 500 });
  }
}
