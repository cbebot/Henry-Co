/**
 * Shared identity resolution for public AccountChip / AccountDropdown.
 * Ensures the chip never shows raw email as the primary label when a human-friendly
 * alternative exists, and the dropdown never duplicates the same string on both lines.
 */

export type PublicAccountIdentityInput = {
  displayName: string;
  email?: string | null;
};

function normalize(s: string) {
  return s.trim().toLowerCase();
}

/** Turn "john.doe" / "john_doe" into "John Doe" for a calmer chip label. */
export function humanizeEmailLocalPart(local: string): string {
  const raw = local.trim();
  if (!raw) return "";

  const pieces = raw.split(/[._-]+/).filter(Boolean);
  if (pieces.length >= 2) {
    return pieces
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  const single = pieces[0] || raw;
  return single.charAt(0).toUpperCase() + single.slice(1).toLowerCase();
}

/**
 * Primary line: best human-facing name (not a duplicated email).
 * Secondary line: full email when it adds information (never identical to primary).
 */
export function resolvePublicAccountIdentity(
  user: PublicAccountIdentityInput
): {
  primaryLabel: string;
  /** Shown under the name in the dropdown; omitted when it would duplicate line 1. */
  emailLine: string | null;
  /** For initials / avatar alt — prefer real name, else email local part. */
  initialsSource: string;
} {
  const email = typeof user.email === "string" ? user.email.trim() : "";
  const rawName = (user.displayName || "").trim();
  const emailNorm = email ? normalize(email) : "";
  const nameNorm = rawName ? normalize(rawName) : "";

  const localFromEmail = email.includes("@") ? email.split("@")[0] || "" : email;
  const humanLocal = humanizeEmailLocalPart(localFromEmail);

  let primaryLabel = rawName;

  if (!primaryLabel || (emailNorm && nameNorm === emailNorm)) {
    primaryLabel = humanLocal || (localFromEmail ? humanizeEmailLocalPart(localFromEmail) : "") || "Account";
  }

  if (emailNorm && normalize(primaryLabel) === emailNorm) {
    primaryLabel = humanLocal || "Account";
  }

  const emailLine =
    email && normalize(primaryLabel) !== emailNorm ? email : null;

  const initialsSource =
    rawName && nameNorm !== emailNorm
      ? rawName
      : humanLocal || localFromEmail || email || "Account";

  return { primaryLabel, emailLine, initialsSource };
}
