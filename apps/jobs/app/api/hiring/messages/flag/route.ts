import { NextResponse } from "next/server";
import { flagMessage } from "@/lib/jobs/hiring";

export async function POST(request: Request) {
  try {
    const { messageId, reason } = await request.json();

    if (!messageId || !reason?.trim()) {
      return NextResponse.json({ error: "Missing messageId or reason." }, { status: 400 });
    }

    const success = await flagMessage(messageId, reason.trim());
    if (!success) {
      return NextResponse.json({ error: "Failed to flag message." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
