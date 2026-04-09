import { NextResponse } from "next/server";
import { scheduleInterview } from "@/lib/jobs/hiring";

export async function POST(request: Request) {
  try {
    const input = await request.json();

    if (!input.applicationId || !input.title?.trim() || !input.scheduledAt) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
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
      return NextResponse.json({ error: "Failed to schedule interview." }, { status: 500 });
    }

    return NextResponse.json({ interview });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
