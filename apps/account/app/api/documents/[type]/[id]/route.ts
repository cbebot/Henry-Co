import { NextResponse, type NextRequest } from "next/server";

import {
  InvoiceDocument,
  KycSummaryDocument,
  ReceiptDocument,
  SupportThreadExportDocument,
  TransactionHistoryDocument,
  type InvoiceLineItem,
  type SupportMessage,
  type TransactionHistoryFilters,
  type TransactionRow,
} from "@henryco/branded-documents";

import { requireAccountUser } from "@/lib/auth";
import {
  getInvoiceById,
  getRecentActivity,
  getSupportMessages,
  getSupportThreadById,
  getWalletTransactions,
} from "@/lib/account-data";
import { getVerificationState, getDocumentTypeLabel } from "@/lib/verification";
import { streamPdfResponse } from "@/lib/branded-documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ type: string; id: string }> };

const SUPPORTED = new Set([
  "invoice",
  "receipt",
  "kyc-summary",
  "transaction-history",
  "wallet-statement",
  "support-thread",
]);

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseFilters(url: URL): TransactionHistoryFilters {
  const list = (key: string) =>
    url.searchParams
      .getAll(key)
      .flatMap((v) => v.split(","))
      .map((v) => v.trim())
      .filter(Boolean);
  const pickNum = (key: string) => {
    const raw = url.searchParams.get(key);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };
  return {
    fromDate: url.searchParams.get("from") || null,
    toDate: url.searchParams.get("to") || null,
    divisions: list("division"),
    types: list("type"),
    statuses: list("status"),
    amountFromKobo: pickNum("amountFrom"),
    amountToKobo: pickNum("amountTo"),
  };
}

function applyTransactionFilters(rows: TransactionRow[], filters: TransactionHistoryFilters) {
  return rows.filter((row) => {
    if (filters.fromDate && row.occurredAt < filters.fromDate) return false;
    if (filters.toDate && row.occurredAt > filters.toDate) return false;
    if (filters.divisions?.length && !filters.divisions.includes(String(row.division ?? "").toLowerCase())) return false;
    if (filters.types?.length && !filters.types.includes(String(row.type ?? "").toLowerCase())) return false;
    if (filters.statuses?.length && !filters.statuses.includes(String(row.status ?? "").toLowerCase())) return false;
    const amount = Math.abs(row.amountKobo);
    if (filters.amountFromKobo != null && amount < filters.amountFromKobo) return false;
    if (filters.amountToKobo != null && amount > filters.amountToKobo) return false;
    return true;
  });
}

export async function GET(request: NextRequest, ctx: RouteParams) {
  const { type, id } = await ctx.params;
  if (!SUPPORTED.has(type)) {
    return NextResponse.json({ error: "Unsupported document type" }, { status: 404 });
  }

  const user = await requireAccountUser();
  const url = new URL(request.url);
  const wantsDownload = url.searchParams.get("download") === "1";

  switch (type) {
    case "invoice": {
      const invoice = (await getInvoiceById(user.id, id)) as Record<string, unknown> | null;
      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
      const lineItems: InvoiceLineItem[] = Array.isArray(invoice.line_items)
        ? (invoice.line_items as Array<Record<string, unknown>>).map((row, idx) => ({
            id: asString(row.id) || `line-${idx}`,
            title: asString(row.name) || asString(row.title) || asString(row.description) || `Line ${idx + 1}`,
            note: asString(row.note) || asString(row.description) || null,
            quantity: row.quantity != null ? asNumber(row.quantity) : null,
            unitAmountKobo: row.unit_amount_kobo != null ? asNumber(row.unit_amount_kobo) : null,
            amountKobo: asNumber(row.amount_kobo ?? row.total_kobo ?? 0),
          }))
        : [];

      const element = InvoiceDocument({
        invoice: {
          id: asString(invoice.id),
          invoiceNo: asString(invoice.invoice_no) || asString(invoice.id).slice(0, 8),
          description: asString(invoice.description) || "HenryCo invoice",
          division: asString(invoice.division) || null,
          status: asString(invoice.status) || "pending",
          issuedAt: asString(invoice.created_at) || new Date().toISOString(),
          dueAt: asString(invoice.due_date) || null,
          paidAt: asString(invoice.paid_at) || null,
          paymentMethod: asString(invoice.payment_method) || null,
          paymentReference: asString(invoice.payment_reference) || null,
          subtotalKobo: asNumber(invoice.subtotal_kobo),
          taxKobo: asNumber(invoice.tax_kobo),
          discountKobo: invoice.discount_kobo != null ? asNumber(invoice.discount_kobo) : null,
          totalKobo: asNumber(invoice.total_kobo),
          currency: asString(invoice.currency) || "NGN",
          lineItems,
        },
        customer: {
          name: user.fullName || user.email || "Customer",
          email: user.email,
          address: null,
        },
        issuer: {
          name: `Henry & Co. — ${asString(invoice.division) || "Group"}`,
          addressLines: ["Plot 14B, Admiralty Way", "Lekki Phase 1, Lagos"],
          rcNumber: null,
          vatNumber: null,
          contactEmail: "billing@henrycogroup.com",
          contactPhone: null,
        },
      });

      return streamPdfResponse({ element, type: "Invoice", id: asString(invoice.invoice_no) || id, download: wantsDownload });
    }

    case "receipt": {
      // For phase 1 we synthesise a receipt from a paid invoice. Future
      // work can split this onto a dedicated receipts table.
      const invoice = (await getInvoiceById(user.id, id)) as Record<string, unknown> | null;
      if (!invoice) {
        return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
      }
      const lineItems = Array.isArray(invoice.line_items)
        ? (invoice.line_items as Array<Record<string, unknown>>).map((row, idx) => ({
            id: asString(row.id) || `line-${idx}`,
            title: asString(row.name) || asString(row.description) || `Line ${idx + 1}`,
            detail: asString(row.note) || null,
            quantity: row.quantity != null ? asNumber(row.quantity) : null,
            amountKobo: asNumber(row.amount_kobo ?? row.total_kobo ?? 0),
          }))
        : [];
      const element = ReceiptDocument({
        receipt: {
          id: asString(invoice.id),
          receiptNo: `R-${asString(invoice.invoice_no) || asString(invoice.id).slice(0, 8)}`,
          division: asString(invoice.division) || "hub",
          paidAt: asString(invoice.paid_at) || asString(invoice.created_at) || new Date().toISOString(),
          paymentMethod: asString(invoice.payment_method) || "card",
          paymentReference: asString(invoice.payment_reference) || null,
          subtotalKobo: asNumber(invoice.subtotal_kobo),
          feesKobo: null,
          taxKobo: asNumber(invoice.tax_kobo),
          totalKobo: asNumber(invoice.total_kobo),
          currency: asString(invoice.currency) || "NGN",
          notes: null,
        },
        customer: {
          name: user.fullName || user.email || "Customer",
          email: user.email,
        },
        items: lineItems,
      });
      return streamPdfResponse({ element, type: "Receipt", id, download: wantsDownload });
    }

    case "kyc-summary": {
      // The id segment is a placeholder — the request is always for the
      // calling user. We accept "me" or the user's own id.
      if (id !== "me" && id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const state = await getVerificationState(user.id);
      const submissions = state.submissions.map((s) => ({
        id: s.id,
        documentType: getDocumentTypeLabel(s.documentType),
        status: s.status,
        submittedAt: s.submittedAt,
        reviewedAt: s.reviewedAt,
        reviewerNote: s.reviewerNote,
      }));
      const element = KycSummaryDocument({
        user: { id: user.id, name: user.fullName || user.email || "Account holder", email: user.email },
        status: state.status,
        submittedAt: state.submittedAt,
        reviewedAt: state.reviewedAt,
        reviewerNote: state.reviewerNote,
        submissions,
      });
      return streamPdfResponse({ element, type: "KycSummary", id: user.id, download: wantsDownload });
    }

    case "transaction-history":
    case "wallet-statement": {
      const filters = parseFilters(url);
      const division = type === "wallet-statement" ? "wallet" : url.searchParams.get("division") || undefined;

      const [activity, walletTx] = await Promise.all([
        getRecentActivity(user.id, 500),
        getWalletTransactions(user.id, 500),
      ]);

      const merged: TransactionRow[] = [
        ...(activity as Array<Record<string, unknown>>).map((row) => ({
          id: asString(row.id),
          occurredAt: asString(row.created_at),
          division: asString(row.division) || null,
          type: asString(row.type) || asString(row.event_type) || null,
          status: asString(row.status) || null,
          description: asString(row.title) || asString(row.description) || null,
          reference: asString(row.reference_id) || null,
          amountKobo: Math.abs(asNumber(row.amount_kobo)),
          direction: asNumber(row.amount_kobo) >= 0 ? ("credit" as const) : ("debit" as const),
          currency: "NGN",
        })),
        ...(walletTx as Array<Record<string, unknown>>).map((row) => ({
          id: asString(row.id),
          occurredAt: asString(row.created_at),
          division: "wallet",
          type: asString(row.type) || "wallet",
          status: asString(row.status) || null,
          description: asString(row.description) || null,
          reference: asString(row.reference_id) || asString(row.reference) || null,
          amountKobo: Math.abs(asNumber(row.amount_kobo)),
          direction:
            asString(row.direction) === "credit"
              ? ("credit" as const)
              : asString(row.direction) === "debit"
                ? ("debit" as const)
                : asNumber(row.amount_kobo) >= 0
                  ? ("credit" as const)
                  : ("debit" as const),
          currency: asString(row.currency) || "NGN",
        })),
      ].sort((a, b) => (b.occurredAt > a.occurredAt ? 1 : -1));

      const filtered = applyTransactionFilters(merged, filters);
      const totals = filtered.reduce(
        (acc, row) => {
          if (row.direction === "credit") acc.creditKobo += row.amountKobo;
          if (row.direction === "debit") acc.debitKobo += row.amountKobo;
          acc.rowCount += 1;
          return acc;
        },
        { creditKobo: 0, debitKobo: 0, netKobo: 0, rowCount: 0 }
      );
      totals.netKobo = totals.creditKobo - totals.debitKobo;

      const element = TransactionHistoryDocument({
        user: { id: user.id, name: user.fullName, email: user.email },
        filters,
        rows: filtered,
        totals,
        generatedAt: new Date().toISOString(),
        division,
      });
      return streamPdfResponse({
        element,
        type: type === "wallet-statement" ? "WalletStatement" : "TransactionHistory",
        id: user.id,
        download: wantsDownload,
      });
    }

    case "support-thread": {
      const thread = (await getSupportThreadById(user.id, id)) as Record<string, unknown> | null;
      if (!thread) {
        return NextResponse.json({ error: "Thread not found" }, { status: 404 });
      }
      const messages = await getSupportMessages(id);
      const mapped: SupportMessage[] = (messages as Array<Record<string, unknown>>).map((m) => ({
        id: asString(m.id),
        senderType:
          asString(m.sender_type) === "agent"
            ? "agent"
            : asString(m.sender_type) === "system"
              ? "system"
              : "customer",
        senderName: asString(m.sender_name) || asString(m.sender_type) || "—",
        body: asString(m.body) || "",
        createdAt: asString(m.created_at),
        attachments: Array.isArray(m.attachments)
          ? (m.attachments as Array<Record<string, unknown>>).map((a) => ({
              name: asString(a.name) || "attachment",
              mimeType: asString(a.mime_type) || asString(a.mimeType) || null,
            }))
          : [],
      }));

      const element = SupportThreadExportDocument({
        thread: {
          id: asString(thread.id),
          referenceNo: asString(thread.reference_id) || asString(thread.id).slice(0, 8),
          subject: asString(thread.subject) || "Support thread",
          division: asString(thread.division) || null,
          status: asString(thread.status) || "open",
          openedAt: asString(thread.created_at),
          lastUpdatedAt: asString(thread.updated_at) || asString(thread.created_at),
        },
        customer: { name: user.fullName || user.email || "Customer", email: user.email },
        messages: mapped,
      });
      return streamPdfResponse({ element, type: "SupportThread", id, download: wantsDownload });
    }
  }

  return NextResponse.json({ error: "Unhandled type" }, { status: 500 });
}
