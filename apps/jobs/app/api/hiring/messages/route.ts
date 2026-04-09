import { NextResponse } from "next/server";
import { sendMessage } from "@/lib/jobs/hiring";

export async function POST(request: Request) {
  try {
    const { conversationId, senderId, senderType, body } = await request.json();

    if (!conversationId || !senderId || !senderType || !body?.trim()) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const message = await sendMessage(conversationId, senderId, senderType, body.trim());
    if (!message) {
      return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
    }

    return NextResponse.json({ message });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
