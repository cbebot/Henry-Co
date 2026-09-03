import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import { formatCurrencyAmount } from "@/lib/format";
import {
  getOwnerControlQueueBinding,
  type OwnerControlActionKey,
  type OwnerControlQueueId,
} from "./registry";
import { DISPUTE_OPEN } from "./statuses";

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
  /**
   * Set when the read came back exactly at its row cap, so there is very likely
   * more behind it. `totalPending` is then a floor, not a total, and the surface
   * says so rather than quoting a number it cannot stand behind.
   */
  truncated: boolean;
};

export type OwnerControlQueues = {
  queues: OwnerControlQueue[];
  totalPending: number;
  /**
   * True when ANY queue failed to read. `totalPending` counts rows, and a queue
   * that could not be read contributes zero of them — so without this flag a
   * console with six broken panels renders a calm green "Nothing is waiting on
   * you". Silence and zero are not the same answer, and an operator surface that
   * conflates them is worse than one that admits it does not know.
   */
  anyUnavailable: boolean;
  /** True when any queue hit its row cap — `totalPending` is then a floor. */
  anyTruncated: boolean;
  /**
   * Open disputes — shown as evidence only; see the note on the surface.
   * `null` when the count could not be read, which the surface must not render
   * as zero.
   */
  openDisputes: number | null;
};

/**
 * Row cap per queue. Deliberately generous: the console is a work surface, and
 * an owner scrolling 50 rows is a better failure than an owner silently shown
 * 50 of 200 with no indication the rest exist.
 */
const QUEUE_LIMIT = 50;
const VENDOR_LIMIT = 60;

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
  id: OwnerControlQueueId,
  read: (listStates: readonly string[]) => Promise<OwnerControlQueueRow[]>,
  limit: number = QUEUE_LIMIT,
): Promise<OwnerControlQueue> {
  // Division, offered actions, and the status filter all come from the ONE
  // binding in registry.ts. The reader is handed `listStates` rather than
  // importing a status set of its own, so the rows a queue lists and the
  // verdicts it offers on them cannot be edited apart.
  const { division, actions, listStates } = getOwnerControlQueueBinding(id);
  try {
    const rows = await read(listStates);
    return { id, division, actions, rows, unavailable: false, truncated: rows.length >= limit };
  } catch (error) {
    console.error(`[owner-control/queues] ${id} unavailable`, error);
    return { id, division, actions, rows: [], unavailable: true, truncated: false };
  }
}

export async function getOwnerControlQueues(): Promise<OwnerControlQueues> {
  const admin = createAdminSupabase();

  const [sellers, kyc, teachers, products, moderation, vendors, disputes] = await Promise.all([
    safeQueue("seller-applications", async (listStates) => {
        const { data, error } = await admin
          .from("marketplace_vendor_applications")
          .select(
            "id, user_id, store_name, proposed_store_slug, legal_name, normalized_email, contact_phone, category_focus, story, status, submitted_at",
          )
          .in("status", [...listStates])
          .order("submitted_at", { ascending: true })
          .limit(QUEUE_LIMIT);
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
          // The error is READ, not swallowed. This lookup is what produces the
          // slug-collision warning on the card; if it fails quietly the warning
          // simply is not there, and the queue looks normal while the owner
          // decides with less than it appears to show. The server-side
          // collision gate still refuses a real takeover, so this degrades the
          // evidence rather than the safety — but degraded evidence that nobody
          // is told about is exactly the "console that lies quietly" failure
          // this pass keeps finding.
          const { data: taken, error: takenError } = await admin
            .from("marketplace_vendors")
            .select("slug, owner_user_id")
            .in("slug", slugs);
          if (takenError) {
            console.error(
              "[owner-control] slug-collision lookup failed; cards will render without the takeover warning",
              takenError.message,
            );
          }
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
    }),

    safeQueue("kyc-submissions", async (listStates) => {
      const { data, error } = await admin
        .from("customer_verification_submissions")
        .select("id, user_id, document_type, status, created_at")
        .in("status", [...listStates])
        .order("created_at", { ascending: true })
        .limit(QUEUE_LIMIT);
      if (error) throw new Error(error.message);

      const rows = (data ?? []) as Array<Record<string, unknown>>;
      // Resolve applicant names in one round trip rather than per row.
      const userIds = Array.from(new Set(rows.map((r) => text(r.user_id)).filter(Boolean)));
      const names = new Map<string, string>();
      if (userIds.length) {
        const { data: profiles, error: profilesError } = await admin
          .from("customer_profiles")
          .select("id, full_name")
          .in("id", userIds);
        if (profilesError) {
          console.error(
            "[owner-control] applicant name lookup failed; identity checks will render without a name",
            profilesError.message,
          );
        }
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

    safeQueue("teacher-applications", async (listStates) => {
        const { data, error } = await admin
          .from("learn_teacher_applications")
          .select(
            "id, full_name, normalized_email, expertise_area, credentials, course_proposal, status, created_at",
          )
          .in("status", [...listStates])
          .order("created_at", { ascending: true })
          .limit(QUEUE_LIMIT);
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
    }),

    safeQueue("product-reviews", async (listStates) => {
        // `base_price`, not `price_kobo` — and the difference was not cosmetic.
        // `marketplace_products` has no `price_kobo` column, so PostgREST answered
        // 42703, `safeQueue` caught it, and this queue rendered "unavailable" on
        // every load. A fail-soft wrapper turns a wrong column name into a queue
        // that is quietly always empty, which is exactly the failure this pass
        // exists to remove. The stored value is whole naira (marketplace's own
        // moderation page formats it the same way), so no kobo conversion here.
        //
        // The status filter had the SAME defect a layer up and worse: it read
        // `["pending", "flagged"]`, and neither value is written by anything —
        // `flagged` existed nowhere in this repository outside the lines that
        // invented it. A wrong column name at least errors; wrong status values
        // return zero rows, so this queue reported "nothing waiting" rather than
        // "unavailable". See `statuses.ts`.
        const { data, error } = await admin
          .from("marketplace_products")
          .select("id, title, summary, approval_status, base_price, currency, total_stock, vendor_id, moderation_note, created_at")
          .in("approval_status", [...listStates])
          .order("created_at", { ascending: true })
          .limit(QUEUE_LIMIT);
        if (error) throw new Error(error.message);

        const rows = (data ?? []) as Array<Record<string, unknown>>;
        // Which seller is asking is the first thing that decides a listing, so
        // resolve the names in one round trip rather than showing a raw uuid.
        const vendorIds = Array.from(new Set(rows.map((r) => text(r.vendor_id)).filter(Boolean)));
        const vendorNames = new Map<string, string>();
        if (vendorIds.length) {
          const { data: vendors, error: vendorsError } = await admin
            .from("marketplace_vendors")
            .select("id, name")
            .in("id", vendorIds);
          if (vendorsError) {
            console.error(
              "[owner-control] vendor-name lookup failed; listings will render without their seller",
              vendorsError.message,
            );
          }
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
    }),

    safeQueue("moderation-reports", async (listStates) => {
        const { data, error } = await admin
          .from("platform_moderation_queue")
          .select("id, division, entity_type, reason, severity, status, content_snapshot, created_at")
          .in("status", [...listStates])
          .order("created_at", { ascending: true })
          .limit(QUEUE_LIMIT);
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
    }),

    safeQueue("live-sellers", async (listStates) => {
        const { data, error } = await admin
          .from("marketplace_vendors")
          .select("id, name, slug, status, trust_score, updated_at")
          .in("status", [...listStates])
          .order("status", { ascending: false })
          .limit(VENDOR_LIMIT);
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
    }, VENDOR_LIMIT),

    // Disputes are COUNTED, never acted on — resolution moves money and stays in
    // the guarded marketplace path. `null` means the count could not be read,
    // which is a different answer from zero and is reported as such: a swallowed
    // error here previously rendered as "no open disputes", telling the owner
    // there was nothing to chase at the exact moment the system had lost track.
    (async (): Promise<number | null> => {
      try {
        const { count, error } = await admin
          .from("marketplace_disputes")
          .select("id", { count: "exact", head: true })
          .in("status", [...DISPUTE_OPEN]);
        if (error) throw new Error(error.message);
        return count ?? 0;
      } catch (error) {
        console.error("[owner-control/queues] dispute count unavailable", error);
        return null;
      }
    })(),
  ]);

  const queues = [sellers, kyc, teachers, products, moderation, vendors];

  // The live-sellers queue is a lifecycle control, not pending work: counting it
  // as "awaiting a decision" would show a permanent non-zero backlog that never
  // clears, which trains the owner to ignore the number.
  const pendingQueues = queues.filter((queue) => queue.id !== "live-sellers");
  const totalPending = pendingQueues.reduce((sum, queue) => sum + queue.rows.length, 0);

  return {
    queues,
    totalPending,
    // Computed over EVERY queue, live-sellers included: a lifecycle panel that
    // cannot be read is still a control the owner has silently lost. The dispute
    // count joins it — an unreadable count is exactly as misleading as an
    // unreadable queue, and the surface's all-clear must clear both.
    anyUnavailable: queues.some((queue) => queue.unavailable) || disputes === null,
    anyTruncated: pendingQueues.some((queue) => queue.truncated),
    openDisputes: disputes,
  };
}
