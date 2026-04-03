import { NextResponse } from "next/server";
import { getAuthenticatedProfile } from "@/lib/auth/server";
import { getWhatsAppDiagnostics } from "@/lib/support/whatsapp-observability";
import {
  getWhatsAppHealthStatus,
  registerPendingWhatsAppNumber,
  sendWhatsAppProbe,
} from "@/lib/support/whatsapp-health";

export const runtime = "nodejs";

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function canRead(role?: string | null) {
  const normalized = cleanText(role).toLowerCase();
  return normalized === "owner" || normalized === "manager" || normalized === "support";
}

function isOwner(role?: string | null) {
  return cleanText(role).toLowerCase() === "owner";
}

export async function GET() {
  const auth = await getAuthenticatedProfile();

  if (!auth?.user || !auth.profile) {
    return NextResponse.json({ ok: false, error: "Authentication is required." }, { status: 401 });
  }

  if (!canRead(auth.profile.role)) {
    return NextResponse.json({ ok: false, error: "Not allowed." }, { status: 403 });
  }

  const [status, diagnostics] = await Promise.all([
    getWhatsAppHealthStatus(),
    getWhatsAppDiagnostics(24),
  ]);

  return NextResponse.json({
    ok: true,
    status,
    diagnostics,
  });
}

export async function POST(req: Request) {
  const auth = await getAuthenticatedProfile();

  if (!auth?.user || !auth.profile) {
    return NextResponse.json({ ok: false, error: "Authentication is required." }, { status: 401 });
  }

  if (!isOwner(auth.profile.role)) {
    return NextResponse.json({ ok: false, error: "Only the owner can run WhatsApp mutations." }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = cleanText(body.action).toLowerCase();

  if (action === "register") {
    const result = await registerPendingWhatsAppNumber(cleanText(body.pin) || null);
    const [status, diagnostics] = await Promise.all([
      getWhatsAppHealthStatus(),
      getWhatsAppDiagnostics(24),
    ]);

    return NextResponse.json({
      ok: result.ok,
      action,
      result,
      status,
      diagnostics,
    });
  }

  if (action === "probe") {
    const to = cleanText(body.to);
    const message = cleanText(body.body) || null;
    const result = await sendWhatsAppProbe({ to, body: message });
    const [status, diagnostics] = await Promise.all([
      getWhatsAppHealthStatus(),
      getWhatsAppDiagnostics(24),
    ]);

    return NextResponse.json({
      ok: result.ok,
      action,
      result,
      status,
      diagnostics,
    });
  }

  return NextResponse.json(
    { ok: false, error: "Unknown action. Use `register` or `probe`." },
    { status: 400 }
  );
}
