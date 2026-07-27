import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import { formatCurrencyAmount } from "@/lib/format";
import type { OwnerControlActionKey } from "./registry";

/**
 * V3-OWNER-CONTROL-01 — the pending-work readers behind the approvals console.
 *
 * The previous approval centre showed COUNTS and links. A count tells the owner
 * that a decision is owed; it does not let him make one. Every reader here
 * returns the actual rows plus the evidence needed to decide without leaving
 * HQ — which is the difference between a dashboard and a console.
 *
 * EVIDENCE IS DELIBERATELY BOUNDED. The FIRE audits found repeatedly that
 * operator surfaces leak more than the decision needs: home GPS, payment
 * snapshots, document URLs. So the KYC queue carries the document TYPE and the
 * applicant, never the document image URL; the seller queue carries business
 * details the applicant chose to submit, not their KYC file. If a decision
 * genuinely needs the artefact, that belongs behind a separate, separately
 * audited read — not spilled into a list view that renders on every page load.
 *
 * FAIL-SOFT PER QUEUE: each read is isolated. A division whose table is absent
 * in a given environment yields an empty queue and a note, never a 500 that
 * takes the whole console down with it. An operator console that cannot render
 * because one division is misconfigured is worse than one that renders the
 * other five.
 */

export type OwnerControlQueueRow = {
  id: string;
  /** Primary line — who or what the decision is about. */
  title: string;
  /** Secondary line — the decisive context. */
  subtitle: string;
  /** Short evidence pairs rendered as a definition list. */
  evidence: Array<{ label: string; value: string }>;
  /** Current lifecycle status, shown so a stale queue is visibly stale. */
  status: string;
  createdAt: string | null;
};

export type OwnerControlQueue = {
  id: string;
  division: string;
  /** Action keys offered on each row, in render order. */
  actions: OwnerControlActionKey[];
  rows: OwnerControlQueueRow[];
  /** Set when the queue could not be read — surfaced honestly, never hidden. */
  unavailable: boolean;
};

export type OwnerControlQueues = {
  queues: OwnerControlQueue[];
  totalPending: number;
  /** Open disputes — shown as evidence only; see the note on the surface. */
  openDisputes: number;
};

function text(value: unknown, fallback = ""): string {
  const out = value === null || value === undefined ? "" : String(value).trim();
  return out || fallback;
}

function isoOrNull(value: unknown): string | null {
  const out = text(value);
  return out || null;
}

/**
 * Run one queue read in isolation. A thrown error or a PostgREST error becomes
 * `unavailable: true` rather than propagating — see the fail-soft note above.
 */
async function safeQueue(
  id: string,
  division: string,
  actions: OwnerControlActionKey[],
  read: () => Promise<OwnerControlQueueRow[]>,
): Promise<OwnerControlQueue> {
  try {
    return { id, division, actions, rows: await read(), unavailable: false };
  } catch (error) {
    console.error(`[owner-control/queues] ${id} unavailable`, error);
    return { id, division, actions, rows: [], unavailable: true };
  }
}

export async function getOwnerControlQueues(): Promise<OwnerControlQueues> {
  const admin = createAdminSupabase();

  const [sellers, kyc, teachers, products, moderation, vendors, disputes] = await Promise.all([
    safeQueue(
      "seller-applications",
      "marketplace",
      ["marketplace.seller.approve", "marketplace.seller.request_changes", "marketplace.seller.reject"],
      async () => {
        const { data, error } = await admin
          .from("marketplace_vendor_applications")
          .select(
            "id, user_id, store_name, proposed_store_slug, legal_name, normalized_email, contact_phone, category_focus, story, status, submitted_at",
          )
          .in("status", ["submitted", "pending", "changes_requested"])
          .order("submitted_at", { ascending: true })
          .limit(50);
        if (error) throw new Error(error.message);

        const rows = (data ?? []) as Array<Record<string, unknown>>;
        // The store URL is typed by the applicant and never checked for
        // uniqueness at submission time, while `marketplace_vendors.slug` is
        // UNIQUE. The write path refuses an approval whose slug already belongs
        // to somebody else (see the collision gate in seller-decision-write), but
        // finding that out only after tapping Approve is a bad console: the owner
        // should see the conflict in the evidence and ask for a different name.
        const slugs = Array.from(new Set(rows.map((r) => text(r.proposed_store_slug)).filter(Boolean)));
        const slugOwners = new Map<string, string>();
        if (slugs.length) {
          const { data: taken } = await admin
            .from("marketplace_vendors")
            .select("slug, owner_user_id")
            .in("slug", slugs);
          for (const raw of taken ?? []) {
            const vendor = raw as Record<string, unknown>;
            slugOwners.set(text(vendor.slug), text(vendor.owner_user_id));
          }
        }

        return rows.map((row) => {
          const slug = text(row.proposed_store_slug);
          const holder = slug ? slugOwners.get(slug) : undefined;
          // A slug held by THIS applicant is their own existing store, not a
          // conflict — approving simply updates it.
          const collides = Boolean(holder) && holder !== text(row.user_id);
          return {
            id: text(row.id),
            title: text(row.store_name, "Unnamed store"),
            subtitle: text(row.category_focus, "No category given"),
            evidence: [
              { label: "Legal name", value: text(row.legal_name, "—") },
              // The warning rides on the LABEL, not the value: the console
              // translates `fact.label` and renders `fact.value` verbatim as
              // data, so prose in the value would ship an untranslatable
              // sentence to a Yoruba or Hausa operator.
              {
                label: collides
                  ? "Store URL — already taken, ask for a different one"
                  : "Store URL",
                value: text(slug, "—"),
              },
              { label: "Email", value: text(row.normalized_email, "—") },
              { label: "Phone", value: text(row.contact_phone, "—") },
              { label: "Pitch", value: text(row.story, "—") },
            ],
            status: text(row.status, "submitted"),
            createdAt: isoOrNull(row.submitted_at),
          };
        });
      },
    ),

    safeQueue("kyc-submissions", "account", ["account.kyc.approve", "account.kyc.reject"], async () => {
      const { data, error } = await admin
        .from("customer_verification_submissions")
        .select("id, user_id, document_type, status, created_at")
        .in("status", ["pending", "in_review"])
        .order("created_at", { ascending: true })
        .limit(50);
      if (error) throw new Error(error.message);

      const rows = (data ?? []) as Array<Record<string, unknown>>;
      // Resolve applicant names in one round trip rather than per row.
      const userIds = Array.from(new Set(rows.map((r) => text(r.user_id)).filter(Boolean)));
      const names = new Map<string, string>();
      if (userIds.length) {
        const { data: profiles } = await admin
          .from("customer_profiles")
          .select("id, full_name")
          .in("id", userIds);
        for (const raw of profiles ?? []) {
          const profile = raw as Record<string, unknown>;
          names.set(text(profile.id), text(profile.full_name));
        }
      }

      return rows.map((row) => ({
        id: text(row.id),
        title: names.get(text(row.user_id)) || "Identity check",
        // The document TYPE is the decision-relevant fact. The document itself
        // is not rendered here — see the evidence note at the top of this file.
        subtitle: text(row.document_type, "Document submitted"),
        evidence: [
          { label: "Document type", value: text(row.document_type, "—") },
          { label: "Status", value: text(row.status, "pending") },
        ],
        status: text(row.status, "pending"),
        createdAt: isoOrNull(row.created_at),
      }));
    }),

    safeQueue(
      "teacher-applications",
      "learn",
      ["learn.teacher.approve", "learn.teacher.reject"],
      async () => {
        const { data, error } = await admin
          .from("learn_teacher_applications")
          .select(
            "id, full_name, normalized_email, expertise_area, credentials, course_proposal, status, created_at",
          )
          .in("status", ["submitted", "pending", "in_review", "changes_requested"])
          .order("created_at", { ascending: true })
          .limit(50);
        if (error) throw new Error(error.message);
        return (data ?? []).map((raw) => {
          const row = raw as Record<string, unknown>;
          return {
            id: text(row.id),
            title: text(row.full_name, "Teaching applicant"),
            subtitle: text(row.expertise_area, "No subject given"),
            evidence: [
              { label: "Email", value: text(row.normalized_email, "—") },
              { label: "Credentials", value: text(row.credentials, "—") },
              { label: "Course proposal", value: text(row.course_proposal, "—") },
            ],
            status: text(row.status, "submitted"),
            createdAt: isoOrNull(row.created_at),
          };
        });
      },
    ),

    safeQueue(
      "product-reviews",
      "marketplace",
      ["marketplace.product.approve", "marketplace.product.request_changes", "marketplace.product.reject"],
      async () => {
        // `base_price`, not `price_kobo` — and the difference was not cosmetic.
        // `marketplace_products` has no `price_kobo` column, so PostgREST answered
        // 42703, `safeQueue` caught it, and this queue rendered "unavailable" on
        // every load. A fail-soft wrapper turns a wrong column name into a queue
        // that is quietly always empty, which is exactly the failure this pass
        // exists to remove. The stored value is whole naira (marketplace's own
        // moderation page formats it the same way), so no kobo conversion here.
        const { data, error } = await admin
          .from("marketplace_products")
          .select("id, title, summary, approval_status, base_price, currency, total_stock, vendor_id, moderation_note, created_at")
          .in("approval_status", ["pending", "flagged"])
          .order("created_at", { ascending: true })
          .limit(50);
        if (error) throw new Error(error.message);

        const rows = (data ?? []) as Array<Record<string, unknown>>;
        // Which seller is asking is the first thing that decides a listing, so
        // resolve the names in one round trip rather than showing a raw uuid.
        const vendorIds = Array.from(new Set(rows.map((r) => text(r.vendor_id)).filter(Boolean)));
        const vendorNames = new Map<string, string>();
        if (vendorIds.length) {
          const { data: vendors } = await admin
            .from("marketplace_vendors")
            .select("id, name")
            .in("id", vendorIds);
          for (const raw of vendors ?? []) {
            const vendor = raw as Record<string, unknown>;
            vendorNames.set(text(vendor.id), text(vendor.name));
          }
        }

        return rows.map((row) => {
          const status = text(row.approval_status, "pending");
          const evidence = [
            { label: "Seller", value: vendorNames.get(text(row.vendor_id)) || "Unknown seller" },
            {
              label: "Price",
              value: formatCurrencyAmount(Number(row.base_price || 0), text(row.currency, "NGN")),
            },
            { label: "Stock", value: String(Number(row.total_stock || 0)) },
            { label: "Summary", value: text(row.summary, "—") },
          ];
          // Only shown when a previous review left one — an empty "Review note"
          // row would read as if someone had looked and said nothing.
          const note = text(row.moderation_note);
          if (note) evidence.push({ label: "Review note", value: note });

          return {
            id: text(row.id),
            title: text(row.title, "Untitled listing"),
            subtitle: vendorNames.get(text(row.vendor_id)) || status,
            evidence,
            status,
            createdAt: isoOrNull(row.created_at),
          };
        });
      },
    ),

    safeQueue(
      "moderation-reports",
      "hub",
      ["moderation.item.dismiss", "moderation.item.remove"],
      async () => {
        const { data, error } = await admin
          .from("platform_moderation_queue")
          .select("id, division, entity_type, reason, severity, status, content_snapshot, created_at")
          .in("status", ["pending", "open", "in_review", "escalated"])
          .order("created_at", { ascending: true })
          .limit(50);
        if (error) throw new Error(error.message);
        return (data ?? []).map((raw) => {
          const row = raw as Record<string, unknown>;
          return {
            id: text(row.id),
            title: `${text(row.division, "platform")} · ${text(row.entity_type, "content")}`,
            subtitle: text(row.reason, "Reported content"),
            evidence: [
              { label: "Severity", value: text(row.severity, "—") },
              { label: "Reported content", value: text(row.content_snapshot, "—") },
            ],
            status: text(row.status, "pending"),
            createdAt: isoOrNull(row.created_at),
          };
        });
      },
    ),

    safeQueue(
      "live-sellers",
      "marketplace",
      ["marketplace.vendor.suspend", "marketplace.vendor.reinstate"],
      async () => {
        const { data, error } = await admin
          .from("marketplace_vendors")
          .select("id, name, slug, status, trust_score, updated_at")
          .in("status", ["approved", "suspended"])
          .order("status", { ascending: false })
          .limit(60);
        if (error) throw new Error(error.message);
        return (data ?? []).map((raw) => {
          const row = raw as Record<string, unknown>;
          return {
            id: text(row.id),
            title: text(row.name, "Unnamed store"),
            subtitle: text(row.slug, "—"),
            evidence: [
              { label: "Status", value: text(row.status, "approved") },
              { label: "Trust score", value: text(row.trust_score, "—") },
            ],
            status: text(row.status, "approved"),
            createdAt: isoOrNull(row.updated_at),
          };
        });
      },
    ),

    (async () => {
      try {
        const { count, error } = await admin
          .from("marketplace_disputes")
          .select("id", { count: "exact", head: true })
          .in("status", ["open", "in_progress", "pending"]);
        if (error) throw new Error(error.message);
        return count ?? 0;
      } catch (error) {
        console.error("[owner-control/queues] dispute count unavailable", error);
        return 0;
      }
    })(),
  ]);

  const queues = [sellers, kyc, teachers, products, moderation, vendors];

  // The live-sellers queue is a lifecycle control, not pending work: counting it
  // as "awaiting a decision" would show a permanent non-zero backlog that never
  // clears, which trains the owner to ignore the number.
  const totalPending = queues
    .filter((queue) => queue.id !== "live-sellers")
    .reduce((sum, queue) => sum + queue.rows.length, 0);

  return { queues, totalPending, openDisputes: disputes };
}
