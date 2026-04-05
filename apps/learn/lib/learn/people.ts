import "server-only";

import { normalizeEmail } from "@/lib/env";
import { createAdminSupabase } from "@/lib/supabase";

export type LearnIdentityInput = {
  userId: string | null;
  normalizedEmail: string | null;
};

export type LearnIdentityProfile = {
  userId: string | null;
  normalizedEmail: string | null;
  fullName: string | null;
  avatarUrl: string | null;
};

type ProfileRow = {
  id: string | null;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
};

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

function keyForIdentity(input: LearnIdentityInput) {
  const userId = cleanText(input.userId);
  if (userId) return `id:${userId}`;

  const email = normalizeEmail(input.normalizedEmail);
  if (email) return `email:${email}`;

  return null;
}

function writeProfile(
  directory: Map<string, LearnIdentityProfile>,
  row: ProfileRow,
  source: "customer" | "profile"
) {
  const userId = cleanText(row.id) || null;
  const normalizedEmail = normalizeEmail(row.email);
  const fullName = cleanText(row.full_name) || null;
  const avatarUrl = cleanText(row.avatar_url) || null;

  const profile: LearnIdentityProfile = {
    userId,
    normalizedEmail,
    fullName,
    avatarUrl,
  };

  const keys = [userId ? `id:${userId}` : null, normalizedEmail ? `email:${normalizedEmail}` : null].filter(
    Boolean
  ) as string[];

  for (const key of keys) {
    const existing = directory.get(key);
    if (!existing) {
      directory.set(key, profile);
      continue;
    }

    directory.set(key, {
      userId: existing.userId || profile.userId,
      normalizedEmail: existing.normalizedEmail || profile.normalizedEmail,
      fullName:
        existing.fullName ||
        (source === "customer" ? profile.fullName : null) ||
        profile.fullName,
      avatarUrl:
        existing.avatarUrl ||
        (source === "customer" ? profile.avatarUrl : null) ||
        profile.avatarUrl,
    });
  }
}

export async function lookupLearnProfiles(identities: LearnIdentityInput[]) {
  const userIds = [...new Set(identities.map((item) => cleanText(item.userId)).filter(Boolean))];
  const emails = [...new Set(identities.map((item) => normalizeEmail(item.normalizedEmail)).filter(Boolean))];
  const directory = new Map<string, LearnIdentityProfile>();

  if (userIds.length === 0 && emails.length === 0) {
    return directory;
  }

  const admin = createAdminSupabase();
  const queries: Array<PromiseLike<{ data: ProfileRow[] | null; error: { message?: string } | null }>> = [];

  if (userIds.length > 0) {
    queries.push(
      admin.from("customer_profiles").select("id, email, full_name, avatar_url").in("id", userIds)
    );
    queries.push(admin.from("profiles").select("id, email, full_name, avatar_url").in("id", userIds));
  }

  if (emails.length > 0) {
    queries.push(
      admin.from("customer_profiles").select("id, email, full_name, avatar_url").in("email", emails)
    );
    queries.push(admin.from("profiles").select("id, email, full_name, avatar_url").in("email", emails));
  }

  const results = await Promise.all(queries);
  for (const result of results) {
    if (result.error) continue;
    for (const row of result.data || []) {
      writeProfile(directory, row, "customer");
    }
  }

  if (directory.size > 0) {
    return directory;
  }

  return directory;
}

export function resolveLearnProfile(
  directory: Map<string, LearnIdentityProfile>,
  identity: LearnIdentityInput
) {
  const key = keyForIdentity(identity);
  return key ? directory.get(key) || null : null;
}
