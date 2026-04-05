import { NextResponse } from "next/server";
import { requireOwner } from "@/app/lib/owner-auth";
import { createAdminSupabase } from "@/app/lib/supabase-admin";

export const runtime = "nodejs";

const ALLOWED_KINDS = new Set(["dm", "group", "broadcast", "announcement"]);

function cleanText(value: unknown, max = 160) {
  const text = String(value ?? "").trim();
  return text.length > max ? text.slice(0, max) : text;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

const SEED_THREADS: Array<{
  slug: string;
  kind: string;
  title: string;
  division: string | null;
  welcome: string;
}> = [
  {
    slug: "owner-leadership",
    kind: "broadcast",
    title: "Owner & leadership",
    division: null,
    welcome:
      "Owner and authorized leadership channel. Customer-facing pages never expose this thread.",
  },
  {
    slug: "division-council",
    kind: "group",
    title: "Division council",
    division: null,
    welcome: "Cross-division coordination for managers and owners.",
  },
  {
    slug: "marketplace-risk",
    kind: "group",
    title: "Marketplace risk & payouts",
    division: "marketplace",
    welcome: "Escalations for payouts, fraud signals, and seller risk.",
  },
  {
    slug: "company-announcements",
    kind: "announcement",
    title: "Company announcements",
    division: null,
    welcome: "Broadcast-style updates. Reply in threads when clarification is needed.",
  },
];

export async function GET(request: Request) {
  const auth = await requireOwner();
  if (!auth.ok) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase() || "";

  const admin = createAdminSupabase();

  const { data: existingRows, error: listError } = await admin
    .from("hq_internal_comm_threads")
    .select("id, slug, kind, title, division, created_at, updated_at")
    .order("created_at", { ascending: true });

  if (listError) {
    return NextResponse.json({ error: listError.message, threads: [] }, { status: 200 });
  }

  let threads = Array.isArray(existingRows) ? existingRows : [];
  const slugs = new Set(threads.map((t) => t.slug));

  for (const seed of SEED_THREADS) {
    if (slugs.has(seed.slug)) continue;
    const { data: inserted, error: insertError } = await admin
      .from("hq_internal_comm_threads")
      .insert({
        slug: seed.slug,
        kind: seed.kind,
        title: seed.title,
        division: seed.division,
      })
      .select("id, slug, kind, title, division, created_at, updated_at")
      .maybeSingle();

    if (insertError) {
      continue;
    }
    if (inserted) {
      threads.push(inserted);
      slugs.add(seed.slug);
      await admin.from("hq_internal_comm_messages").insert({
        thread_id: inserted.id,
        author_id: auth.user.id,
        author_label: "System",
        body: seed.welcome,
      });
    }
  }

  if (q) {
    threads = threads.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.division && t.division.toLowerCase().includes(q)) ||
        t.slug.toLowerCase().includes(q)
    );
  }

  const { data: memberRows, error: memberError } = await admin
    .from("hq_internal_comm_thread_members")
    .select("thread_id, last_read_at, pinned")
    .eq("user_id", auth.user.id);

  const membersAvailable = !memberError;

  const memberByThread = new Map<string, { last_read_at: string | null; pinned: boolean }>();
  if (membersAvailable) {
    for (const row of memberRows || []) {
      memberByThread.set(row.thread_id, {
        last_read_at: row.last_read_at,
        pinned: Boolean(row.pinned),
      });
    }
  }

  const enriched: Array<
    (typeof threads)[number] & { unread_count: number; pinned: boolean }
  > = [];
  for (const t of threads) {
    const member = memberByThread.get(t.id);
    const lastRead = member?.last_read_at || "1970-01-01T00:00:00.000Z";

    let unread = 0;
    if (membersAvailable) {
      const { count, error: countError } = await admin
        .from("hq_internal_comm_messages")
        .select("id", { count: "exact", head: true })
        .eq("thread_id", t.id)
        .gt("created_at", lastRead);

      unread = countError ? 0 : count ?? 0;
    }

    enriched.push({
      ...t,
      unread_count: unread,
      pinned: member?.pinned ?? false,
    });
  }

  enriched.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return NextResponse.json({ threads: enriched });
}

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (!auth.ok) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  let body: {
    title?: string;
    slug?: string;
    kind?: string;
    division?: string | null;
    welcome?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const title = cleanText(body.title);
  const slug = slugify(cleanText(body.slug || body.title, 72));
  const kind = cleanText(body.kind || "group", 24).toLowerCase();
  const division = cleanText(body.division || "", 48).toLowerCase() || null;
  const welcome = cleanText(body.welcome || "", 8000);

  if (!title || !slug || !ALLOWED_KINDS.has(kind)) {
    return NextResponse.json(
      { error: "title, slug, and a valid kind are required." },
      { status: 400 }
    );
  }

  const admin = createAdminSupabase();
  const { data: existing } = await admin
    .from("hq_internal_comm_threads")
    .select("id, slug, kind, title, division, created_at, updated_at")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ thread: existing, existing: true });
  }

  const { data: inserted, error } = await admin
    .from("hq_internal_comm_threads")
    .insert({
      slug,
      kind,
      title,
      division,
    })
    .select("id, slug, kind, title, division, created_at, updated_at")
    .maybeSingle();

  if (error || !inserted) {
    return NextResponse.json({ error: error?.message || "Could not create thread." }, { status: 400 });
  }

  await admin.from("hq_internal_comm_thread_members").upsert(
    {
      thread_id: inserted.id,
      user_id: auth.user.id,
      role: "owner",
      pinned: true,
      last_read_at: new Date().toISOString(),
    },
    { onConflict: "thread_id,user_id" }
  );

  if (welcome) {
    await admin.from("hq_internal_comm_messages").insert({
      thread_id: inserted.id,
      author_id: auth.user.id,
      author_label: auth.user.email?.trim() || "Owner",
      body: welcome,
    });
  }

  return NextResponse.json({ thread: inserted, existing: false }, { status: 201 });
}
