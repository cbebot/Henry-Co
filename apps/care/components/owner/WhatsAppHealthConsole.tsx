"use client";

import { useMemo, useState, useTransition } from "react";
import { MessageSquareShare, RefreshCw, ShieldCheck } from "lucide-react";
import { emitCareToast } from "@/components/feedback/CareToaster";
import { CareLoadingGlyph } from "@/components/ui/CareLoading";

type WhatsAppTemplateStatus = {
  id?: string;
  name?: string;
  status?: string;
  language?: string;
  category?: string;
  sub_category?: string;
};

type WhatsAppHealthStatus = {
  readiness: "ready" | "action_required" | "not_configured";
  configured: boolean;
  provider: "meta" | "twilio" | null;
  environment: {
    accessTokenConfigured: boolean;
    phoneNumberIdConfigured: boolean;
    businessAccountIdConfigured: boolean;
    registrationPinConfigured: boolean;
  };
  phone: {
    display_phone_number?: string | null;
    status?: string | null;
    quality_rating?: string | null;
    code_verification_status?: string | null;
    platform_type?: string | null;
  } | null;
  businessAccount: {
    name?: string | null;
    account_review_status?: string | null;
    business_verification_status?: string | null;
  } | null;
  templates: WhatsAppTemplateStatus[];
  blockers: string[];
  notes: string[];
};

type WhatsAppDiagnosticRow = {
  id: string;
  messageId: string | null;
  targetNumber: string | null;
  resolvedWaId: string | null;
  provider: string | null;
  messageType: string | null;
  conversationType: string | null;
  templateName: string | null;
  templateLanguage: string | null;
  sourceKind: string | null;
  sourceLabel: string | null;
  sourceId: string | null;
  conversationPolicy: string | null;
  sendTime: string | null;
  latestStatus: "accepted" | "sent" | "delivered" | "read" | "failed" | "skipped" | "unknown";
  initialStatus: "accepted" | "sent" | "delivered" | "read" | "failed" | "skipped" | "unknown";
  statusUpdatedAt: string | null;
  failureCode: number | null;
  failureReason: string | null;
  responseSummary: string | null;
  webhookSummary: string | null;
  webhookPayloadSummary: string | null;
  contactSummary: string | null;
  receiptsObserved: number;
};

type MutationResult = {
  ok?: boolean;
  action?: string;
  error?: string;
  result?: {
    ok?: boolean;
    status?: number;
    message?: string;
    response?: Record<string, unknown> | null;
    code?: number | null;
  };
  status?: WhatsAppHealthStatus;
  diagnostics?: WhatsAppDiagnosticRow[];
};

function stringifyResult(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function badgeClasses(ready: boolean) {
  return ready
    ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100"
    : "border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-100";
}

function statusTone(status: WhatsAppDiagnosticRow["latestStatus"]) {
  if (status === "delivered" || status === "read") {
    return "border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100";
  }
  if (status === "failed") {
    return "border-red-300/30 bg-red-500/10 text-red-700 dark:text-red-100";
  }
  if (status === "accepted" || status === "sent") {
    return "border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-100";
  }
  return "border-zinc-300/40 bg-black/[0.03] text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/68";
}

function formatDateTime(value?: string | null) {
  if (!value) return "No timestamp";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sourceLabel(row: WhatsAppDiagnosticRow) {
  return (
    row.sourceLabel ||
    row.sourceKind?.replaceAll("_", " ") ||
    row.templateName ||
    "WhatsApp message"
  );
}

export default function WhatsAppHealthConsole({
  initialStatus,
  initialDiagnostics,
}: {
  initialStatus: WhatsAppHealthStatus;
  initialDiagnostics: WhatsAppDiagnosticRow[];
}) {
  const [status, setStatus] = useState(initialStatus);
  const [diagnostics, setDiagnostics] = useState(initialDiagnostics);
  const [probeTo, setProbeTo] = useState("");
  const [probeBody, setProbeBody] = useState("HenryCo Care WhatsApp probe");
  const [lastMutation, setLastMutation] = useState<MutationResult | null>(null);
  const [pendingAction, setPendingAction] = useState<"refresh" | "register" | "probe" | null>(null);
  const [pending, startTransition] = useTransition();

  const deliverySnapshot = useMemo(() => {
    const delivered = diagnostics.filter((item) => item.latestStatus === "delivered").length;
    const read = diagnostics.filter((item) => item.latestStatus === "read").length;
    const accepted = diagnostics.filter((item) => item.latestStatus === "accepted").length;
    const failed = diagnostics.filter((item) => item.latestStatus === "failed").length;

    return { delivered, read, accepted, failed };
  }, [diagnostics]);

  const approvedTemplates = status.templates.filter(
    (item) => String(item.status || "").toUpperCase() === "APPROVED"
  );

  function handleRequest(action: "refresh" | "register" | "probe") {
    setPendingAction(action);

    startTransition(async () => {
      try {
        const response =
          action === "refresh"
            ? await fetch("/api/owner/whatsapp/health", { method: "GET" })
            : await fetch("/api/owner/whatsapp/health", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(
                  action === "probe" ? { action, to: probeTo, body: probeBody } : { action }
                ),
              });

        const payload = (await response.json().catch(() => null)) as MutationResult | null;
        if (!response.ok || !payload) {
          throw new Error(payload?.error || "WhatsApp request failed.");
        }

        if (payload.status) {
          setStatus(payload.status);
        }
        if (payload.diagnostics) {
          setDiagnostics(payload.diagnostics);
        }
        setLastMutation(payload);
        emitCareToast({
          tone: payload.ok || payload.result?.ok ? "success" : "warning",
          title:
            action === "refresh"
              ? "WhatsApp health refreshed"
              : action === "register"
                ? payload.result?.message || "Registration attempt completed"
                : payload.result?.message || "Probe attempt completed",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "WhatsApp request failed.";
        emitCareToast({
          tone: "error",
          title: message,
        });
      } finally {
        setPendingAction(null);
      }
    });
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={`rounded-2xl border p-4 ${badgeClasses(status.readiness === "ready")}`}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-75">
            Sender readiness
          </div>
          <div className="mt-2 text-sm font-semibold">{status.readiness.replaceAll("_", " ")}</div>
        </div>
        <div
          className={`rounded-2xl border p-4 ${badgeClasses(
            status.environment.registrationPinConfigured
          )}`}
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-75">
            Registration PIN
          </div>
          <div className="mt-2 text-sm font-semibold">
            {status.environment.registrationPinConfigured ? "Configured" : "Missing"}
          </div>
        </div>
        <div
          className={`rounded-2xl border p-4 ${badgeClasses(
            Boolean(status.phone?.display_phone_number)
          )}`}
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-75">
            Display number
          </div>
          <div className="mt-2 text-sm font-semibold">
            {status.phone?.display_phone_number || "Not resolved"}
          </div>
        </div>
        <div
          className={`rounded-2xl border p-4 ${badgeClasses(
            Boolean(status.phone?.status && status.phone.status !== "PENDING")
          )}`}
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-75">
            Phone state
          </div>
          <div className="mt-2 text-sm font-semibold">
            {status.phone?.status || "Unknown"}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
            Delivery receipts
          </div>
          <div className="mt-2 text-lg font-black tracking-[-0.03em] text-zinc-950 dark:text-white">
            {deliverySnapshot.delivered + deliverySnapshot.read}
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-white/48">
            {deliverySnapshot.delivered} delivered • {deliverySnapshot.read} read
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
            Awaiting receipts
          </div>
          <div className="mt-2 text-lg font-black tracking-[-0.03em] text-zinc-950 dark:text-white">
            {deliverySnapshot.accepted}
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-white/48">
            Accepted by API, not yet confirmed on handset
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
            Failed deliveries
          </div>
          <div className="mt-2 text-lg font-black tracking-[-0.03em] text-zinc-950 dark:text-white">
            {deliverySnapshot.failed}
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-white/48">
            Provider failures with captured reason/code
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
            Approved templates
          </div>
          <div className="mt-2 text-lg font-black tracking-[-0.03em] text-zinc-950 dark:text-white">
            {approvedTemplates.length}
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-white/48">
            {approvedTemplates.map((item) => item.name).join(", ") || "No approved templates"}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[1.8rem] border border-black/10 bg-white/75 p-5 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
            Owner actions
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleRequest("refresh")}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            >
              {pendingAction === "refresh" ? (
                <CareLoadingGlyph size="sm" className="text-[color:var(--accent)]" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh health
            </button>

            <button
              type="button"
              onClick={() => handleRequest("register")}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--accent)]/30 bg-[color:var(--accent)]/10 px-4 py-3 text-sm font-semibold text-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingAction === "register" ? (
                <CareLoadingGlyph size="sm" className="text-[color:var(--accent)]" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Attempt registration
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            <label className="grid gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                Probe destination
              </span>
              <input
                value={probeTo}
                onChange={(event) => setProbeTo(event.target.value)}
                placeholder="234..."
                className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 outline-none transition focus:border-[color:var(--accent)]/50 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                Probe message
              </span>
              <textarea
                value={probeBody}
                onChange={(event) => setProbeBody(event.target.value)}
                rows={4}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none transition focus:border-[color:var(--accent)]/50 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
              />
            </label>
            <button
              type="button"
              onClick={() => handleRequest("probe")}
              disabled={pending || !probeTo.trim()}
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-cyan-100"
            >
              {pendingAction === "probe" ? (
                <CareLoadingGlyph size="sm" className="text-cyan-600 dark:text-cyan-200" />
              ) : (
                <MessageSquareShare className="h-4 w-4" />
              )}
              Send real probe
            </button>
          </div>

          {(status.blockers.length > 0 || status.notes.length > 0) && (
            <div className="mt-5 grid gap-3">
              {status.blockers.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-100"
                >
                  {item}
                </div>
              ))}
              {status.notes.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-100"
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[1.8rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
            Latest Graph response
          </div>
          <pre className="mt-4 max-h-[28rem] overflow-auto rounded-[1.2rem] border border-black/10 bg-[#081223] p-4 text-xs leading-6 text-white/78 dark:border-white/10">
            {stringifyResult(lastMutation || { status, diagnostics })}
          </pre>
        </div>
      </div>

      <div className="rounded-[1.9rem] border border-black/10 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
              Delivery diagnostics
            </div>
            <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white">
              Real message lifecycle
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-zinc-600 dark:text-white/65">
              Every outbound WhatsApp attempt now records target formatting, message mode, send
              time, latest delivery status, failure code, and the webhook summary when Meta sends
              it back.
            </p>
          </div>
          <div className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
            {diagnostics.length} recent traces
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {diagnostics.length > 0 ? (
            diagnostics.map((item) => (
              <div
                key={item.id}
                className="rounded-[1.5rem] border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusTone(item.latestStatus)}`}
                      >
                        {item.latestStatus}
                      </span>
                      <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                        {item.messageType || "message"} • {item.conversationType || "unknown"}
                      </span>
                      {item.templateName ? (
                        <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                          {item.templateName} {item.templateLanguage ? `• ${item.templateLanguage}` : ""}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 text-sm font-semibold text-zinc-950 dark:text-white">
                      {sourceLabel(item)}
                    </div>
                    <div className="mt-1 break-all font-mono text-xs text-zinc-500 dark:text-white/45">
                      {item.messageId || item.id}
                    </div>
                  </div>

                  <div className="text-right text-xs text-zinc-500 dark:text-white/45">
                    <div>{formatDateTime(item.statusUpdatedAt || item.sendTime)}</div>
                    <div className="mt-1">
                      {item.receiptsObserved > 0
                        ? `${item.receiptsObserved} receipt${item.receiptsObserved === 1 ? "" : "s"}`
                        : "No delivery receipt yet"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <InfoRow label="Target">
                    {`${item.targetNumber || "Unavailable"}${
                      item.resolvedWaId ? ` • wa_id ${item.resolvedWaId}` : ""
                    }`}
                  </InfoRow>
                  <InfoRow label="Source">
                    {`${item.sourceKind?.replaceAll("_", " ") || "Unknown"}${
                      item.conversationPolicy
                        ? ` • ${item.conversationPolicy.replaceAll("_", " ")}`
                        : ""
                    }`}
                  </InfoRow>
                  <InfoRow label="Send time">{formatDateTime(item.sendTime)}</InfoRow>
                  <InfoRow label="Failure">
                    {item.failureCode || item.failureReason
                      ? [item.failureCode ? `#${item.failureCode}` : "", item.failureReason || ""]
                          .filter(Boolean)
                          .join(" • ")
                      : "No failure captured"}
                  </InfoRow>
                </div>

                {item.contactSummary || item.responseSummary || item.webhookSummary ? (
                  <div className="mt-4 grid gap-2 text-sm leading-7 text-zinc-600 dark:text-white/65">
                    {item.contactSummary ? (
                      <div>
                        <span className="font-semibold text-zinc-950 dark:text-white">
                          Contact trace:
                        </span>{" "}
                        {item.contactSummary}
                      </div>
                    ) : null}
                    {item.responseSummary ? (
                      <div>
                        <span className="font-semibold text-zinc-950 dark:text-white">
                          Send result:
                        </span>{" "}
                        {item.responseSummary}
                      </div>
                    ) : null}
                    {item.webhookSummary ? (
                      <div>
                        <span className="font-semibold text-zinc-950 dark:text-white">
                          Webhook:
                        </span>{" "}
                        {item.webhookSummary}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-black/[0.02] px-5 py-8 text-sm text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/52">
              No WhatsApp traces have been captured yet. Run a probe or trigger a real app send
              path to populate this rail.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/[0.05]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/42">
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-zinc-900 dark:text-white">{children}</div>
    </div>
  );
}
