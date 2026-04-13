const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type BrowserContextLike = {
  addCookies: (
    cookies: Array<{
      name: string;
      value: string;
      url: string;
      httpOnly: boolean;
      secure: boolean;
      sameSite: "Lax";
    }>
  ) => Promise<void>;
};

type AuthAdminUser = {
  id: string;
  email?: string | null;
  confirmed_at?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
};

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function uniqueNonEmpty(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

async function supabaseAdminFetch(pathname: string, options: RequestInit = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase admin environment variables for authenticated E2E tests.");
  }

  const headers = new Headers(options.headers || {});
  headers.set("apikey", SUPABASE_SERVICE_ROLE_KEY);
  headers.set("authorization", `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`);
  if (options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`${SUPABASE_URL}${pathname}`, {
    ...options,
    headers,
  });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      (body && typeof body === "object" && ("msg" in body || "message" in body))
        ? String((body as { msg?: string; message?: string }).msg || (body as { message?: string }).message)
        : `${pathname} returned ${response.status}`
    );
  }

  return body;
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createCookieChunks(name: string, value: string, chunkSize = 3180) {
  if (value.length <= chunkSize) {
    return [{ name, value }];
  }

  const chunks: Array<{ name: string; value: string }> = [];
  for (let index = 0; index < value.length; index += chunkSize) {
    chunks.push({
      name: `${name}.${chunks.length}`,
      value: value.slice(index, index + chunkSize),
    });
  }

  return chunks;
}

async function listAuthUsers() {
  const users = await supabaseAdminFetch("/auth/v1/admin/users?page=1&per_page=200", {
    method: "GET",
  });

  return ((users?.users || []) as AuthAdminUser[]).filter(
    (user) => user?.id && normalizeEmail(user.email)
  );
}

async function mintSharedSessionCookies(baseURL: string, email: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables for authenticated E2E tests.");
  }

  const generated = await supabaseAdminFetch("/auth/v1/admin/generate_link", {
    method: "POST",
    body: JSON.stringify({
      type: "magiclink",
      email,
    }),
  });

  const properties =
    generated && typeof generated === "object" && typeof (generated as Record<string, unknown>).hashed_token === "string"
      ? (generated as Record<string, unknown>)
      : generated && typeof generated === "object" && generated.properties
      ? (generated.properties as Record<string, unknown>)
      : generated && typeof generated === "object" && generated.data && typeof generated.data === "object" && "properties" in generated.data
        ? (((generated.data as Record<string, unknown>).properties as Record<string, unknown>) || {})
        : {};
  const tokenHash =
    typeof properties.hashed_token === "string" ? properties.hashed_token : "";
  const verificationType =
    typeof properties.verification_type === "string"
      ? properties.verification_type
      : "magiclink";

  if (!tokenHash) {
    throw new Error(`Could not generate a hashed magic-link token for ${email}.`);
  }

  const verifyResponse = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      token_hash: tokenHash,
      type: verificationType,
    }),
  });

  const verified = await verifyResponse.json();
  if (!verifyResponse.ok || !verified?.access_token || !verified?.refresh_token) {
    throw new Error(`Could not mint an authenticated session for ${email}.`);
  }

  const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];
  const session = {
    access_token: verified.access_token,
    refresh_token: verified.refresh_token,
    expires_in: verified.expires_in,
    expires_at: verified.expires_at,
    token_type: verified.token_type,
    user: verified.user,
  };
  const cookieName = `sb-${projectRef}-auth-token`;
  const cookieValue = `base64-${toBase64Url(JSON.stringify(session))}`;
  const cookieTarget = new URL(baseURL);

  return createCookieChunks(cookieName, cookieValue).map((chunk) => ({
    ...chunk,
    url: cookieTarget.origin,
    httpOnly: false,
    secure: cookieTarget.protocol === "https:",
    sameSite: "Lax" as const,
  }));
}

async function resolveCustomerEmail() {
  const users = await listAuthUsers();
  return uniqueNonEmpty([
    normalizeEmail(process.env.CUSTOMER_E2E_EMAIL),
    normalizeEmail(process.env.ACCOUNT_E2E_EMAIL),
    normalizeEmail(process.env.MARKETPLACE_E2E_EMAIL),
    ...users
      .filter((entry) => normalizeEmail(entry.email))
      .sort((left, right) => {
        const leftConfirmed = left.confirmed_at ? 1 : 0;
        const rightConfirmed = right.confirmed_at ? 1 : 0;
        return rightConfirmed - leftConfirmed;
      })
      .map((entry) => normalizeEmail(entry.email)),
  ]);
}

async function resolveStaffFinanceEmail() {
  const [users, profiles] = await Promise.all([
    listAuthUsers(),
    supabaseAdminFetch("/rest/v1/profiles?select=id,role&role=in.(owner,finance)&limit=50", {
      method: "GET",
    }) as Promise<Array<{ id?: string | null; role?: string | null }>>,
  ]);

  const usersById = new Map(
    users.map((user) => [String(user.id || ""), normalizeEmail(user.email)])
  );

  const rankedProfiles = profiles
    .slice()
    .sort((left, right) => {
      const leftRole = normalizeEmail(left?.role);
      const rightRole = normalizeEmail(right?.role);
      const rank = (role: string) => {
        if (role === "finance") return 0;
        if (role === "owner") return 1;
        return 2;
      };
      return rank(leftRole) - rank(rightRole);
    })
    .map((profile) => usersById.get(String(profile?.id || "")) || "");

  const privilegedMetadataUsers = users
    .filter((user) => {
      const appRole = normalizeEmail(String(user.app_metadata?.role || ""));
      const userRole = normalizeEmail(String(user.user_metadata?.role || ""));
      return ["owner", "finance"].includes(appRole) || ["owner", "finance"].includes(userRole);
    })
    .map((user) => normalizeEmail(user.email));

  const managerFallbacks = users
    .filter((user) => {
      const appRole = normalizeEmail(String(user.app_metadata?.role || ""));
      const userRole = normalizeEmail(String(user.user_metadata?.role || ""));
      return appRole === "manager" || userRole === "manager";
    })
    .map((user) => normalizeEmail(user.email));

  return uniqueNonEmpty([
    normalizeEmail(process.env.STAFF_FINANCE_E2E_EMAIL),
    normalizeEmail(process.env.STAFF_E2E_EMAIL),
    ...rankedProfiles,
    ...privilegedMetadataUsers,
    ...managerFallbacks,
  ]);
}

async function addSessionFromCandidates(
  context: BrowserContextLike,
  baseURL: string,
  resolver: () => Promise<string[]>,
  emptyMessage: string,
  failurePrefix: string
) {
  const emails = await resolver();
  if (emails.length === 0) {
    throw new Error(emptyMessage);
  }

  const failures: string[] = [];
  for (const email of emails) {
    try {
      const cookies = await mintSharedSessionCookies(baseURL, email);
      await context.addCookies(cookies);
      return { email };
    } catch (error) {
      failures.push(
        `${email}: ${error instanceof Error ? error.message : "unknown session error"}`
      );
    }
  }

  throw new Error(`${failurePrefix} ${failures.join(" | ")}`);
}

export async function addCustomerSession(
  context: BrowserContextLike,
  baseURL: string
) {
  return addSessionFromCandidates(
    context,
    baseURL,
    resolveCustomerEmail,
    "Could not find an auth user with an email address for authenticated E2E tests.",
    "Could not mint an authenticated customer session."
  );
}

export async function addStaffFinanceSession(
  context: BrowserContextLike,
  baseURL: string
) {
  return addSessionFromCandidates(
    context,
    baseURL,
    resolveStaffFinanceEmail,
    "Could not find a staff-capable auth user for staff finance E2E coverage.",
    "Could not mint an authenticated staff finance session."
  );
}
