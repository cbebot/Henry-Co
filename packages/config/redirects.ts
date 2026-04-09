function cleanRedirect(value?: string | null) {
  return String(value || "")
    .replace(/[\r\n]+/g, "")
    .trim();
}

export function normalizeTrustedRedirect(value?: string | null) {
  const candidate = cleanRedirect(value);
  if (!candidate) return "/";

  if (candidate.startsWith("//") || candidate.startsWith("\\") || /^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
    return "/";
  }

  try {
    const url = new URL(candidate.startsWith("/") ? candidate : `/${candidate}`, "https://account.local");
    if (url.origin !== "https://account.local") {
      return "/";
    }

    return `${url.pathname}${url.search}${url.hash}` || "/";
  } catch {
    return "/";
  }
}

export function resolveTrustedRedirect(origin: string, value?: string | null) {
  return new URL(normalizeTrustedRedirect(value), origin);
}
