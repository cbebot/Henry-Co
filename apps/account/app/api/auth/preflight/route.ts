import { NextResponse } from "next/server";
import { getSignupContactPreflight } from "@/lib/contact-review";
import { normalizeEmail, normalizePhone } from "@henryco/config";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string | null;
      phone?: string | null;
    };

    const preflight = await getSignupContactPreflight({
      email: normalizeEmail(body.email),
      phone: normalizePhone(body.phone),
    });

    return NextResponse.json(preflight);
  } catch {
    return NextResponse.json(
      { error: "Signup preflight could not be completed." },
      { status: 500 }
    );
  }
}
