import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const envFiles = [
  path.join(repoRoot, ".env.local"),
  path.join(repoRoot, ".env.production.vercel"),
];

for (const file of envFiles) {
  if (!fs.existsSync(file)) continue;
  for (const rawLine of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    if (!key || process.env[key]) continue;
    let value = line.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const SUPABASE_PROJECT_REF = new URL(SUPABASE_URL).hostname.split(".")[0];
const SUPABASE_AUTH_COOKIE = `sb-${SUPABASE_PROJECT_REF}-auth-token`;

function normalizeRole(user) {
  return String(
    user?.app_metadata?.role || user?.user_metadata?.role || ""
  ).trim().toLowerCase();
}

async function supabaseAdminFetch(pathname, options = {}) {
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

  const bodyText = await response.text();
  const body = bodyText ? JSON.parse(bodyText) : null;

  if (!response.ok) {
    throw new Error(body?.msg || body?.message || `${pathname} returned ${response.status}`);
  }

  return body;
}

async function listAuthUsers() {
  const users = [];
  for (let page = 1; page <= 10; page += 1) {
    const payload = await supabaseAdminFetch(
      `/auth/v1/admin/users?page=${page}&per_page=100`,
      { method: "GET" }
    );
    const batch = payload?.users ?? [];
    users.push(...batch);
    if (batch.length < 100) break;
  }
  return users;
}

async function listActiveOwnerProfiles() {
  return supabaseAdminFetch(
    "/rest/v1/owner_profiles?select=user_id,email,role,is_active&is_active=eq.true&role=in.(owner,admin)",
    { method: "GET" }
  );
}

function getSetCookies(response) {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }
  const single = response.headers.get("set-cookie");
  return single ? [single] : [];
}

function updateCookieJar(jar, response) {
  for (const cookie of getSetCookies(response)) {
    const match = cookie.match(/^([^=;]+)=([^;]*)/);
    if (!match) continue;
    jar.set(match[1], match[2]);
  }
}

function serializeCookieJar(jar) {
  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

async function fetchWithJar(url, jar, options = {}) {
  const headers = new Headers(options.headers || {});
  if (jar.size > 0) {
    headers.set("cookie", serializeCookieJar(jar));
  }

  const response = await fetch(url, {
    redirect: "manual",
    ...options,
    headers,
  });
  updateCookieJar(jar, response);
  return response;
}

async function followRedirectChain(url, jar, options = {}, maxRedirects = 5) {
  let currentUrl = url;
  let response = null;

  for (let index = 0; index < maxRedirects; index += 1) {
    response = await fetchWithJar(currentUrl, jar, options);
    if (response.status < 300 || response.status >= 400) {
      return response;
    }

    const location = response.headers.get("location");
    if (!location) {
      return response;
    }

    currentUrl = new URL(location, currentUrl).toString();
  }

  throw new Error(`Redirect chain exceeded ${maxRedirects} hops for ${url}`);
}

async function authenticateThroughAccount(email, nextPath = "/") {
  const generated = await supabaseAdminFetch("/auth/v1/admin/generate_link", {
    method: "POST",
    body: JSON.stringify({
      type: "magiclink",
      email,
    }),
  });

  const emailOtp = generated?.email_otp;
  if (!emailOtp) {
    throw new Error(`Could not generate a magic link for ${email}.`);
  }

  const jar = new Map();
  const verified = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      type: "magiclink",
      email,
      token: emailOtp,
    }),
  });
  const sessionPayload = await verified.json();

  if (!verified.ok || !sessionPayload?.access_token || !sessionPayload?.refresh_token) {
    throw new Error(`Could not verify a magic-link session for ${email}.`);
  }

  const session = {
    access_token: sessionPayload.access_token,
    refresh_token: sessionPayload.refresh_token,
    expires_in: sessionPayload.expires_in,
    expires_at: sessionPayload.expires_at,
    token_type: sessionPayload.token_type,
    user: sessionPayload.user,
  };
  const encoded = Buffer.from(JSON.stringify(session), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  jar.set(SUPABASE_AUTH_COOKIE, `base64-${encoded}`);
  return jar;
}

async function timedHtml(url, jar) {
  const started = Date.now();
  const response = await fetchWithJar(url, jar);
  const body = await response.text();
  return {
    url,
    status: response.status,
    ms: Date.now() - started,
    location: response.headers.get("location"),
    body,
  };
}

async function timedJson(url, jar) {
  const started = Date.now();
  const response = await fetchWithJar(url, jar);
  const json = await response.json();
  return {
    url,
    status: response.status,
    ms: Date.now() - started,
    location: response.headers.get("location"),
    json,
  };
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

const failures = [];
const users = await listAuthUsers();
const ownerProfilesResponse = await listActiveOwnerProfiles();
const ownerProfiles = Array.isArray(ownerProfilesResponse) ? ownerProfilesResponse : [];
const ownerUser =
  ownerProfiles
    .map((profile) =>
      users.find(
        (user) =>
          user.id === profile.user_id ||
          String(user.email || "").trim().toLowerCase() ===
            String(profile.email || "").trim().toLowerCase()
      )
    )
    .find(Boolean) ??
  users.find((user) => ["owner", "manager"].includes(normalizeRole(user))) ??
  users[0] ??
  null;
const memberUser =
  users.find(
    (user) =>
      user.id !== ownerUser?.id &&
      Boolean(String(user.email || "").trim()) &&
      !ownerProfiles.some(
        (profile) =>
          profile.user_id === user.id ||
          String(profile.email || "").trim().toLowerCase() ===
            String(user.email || "").trim().toLowerCase()
      )
  ) ??
  users.find((user) => Boolean(String(user.email || "").trim())) ??
  null;

if (!ownerUser?.email || !memberUser?.email) {
  console.error("Could not find both an owner user and a shared member user.");
  process.exit(1);
}

const memberJar = await authenticateThroughAccount(memberUser.email, "/care");
const ownerJar = await authenticateThroughAccount(ownerUser.email, "/owner");

const accountCare = await timedHtml("https://account.henrycogroup.com/care", memberJar);
const accountNotifications = await timedHtml(
  "https://account.henrycogroup.com/notifications",
  memberJar
);
const marketplaceShell = await timedJson(
  "https://marketplace.henrycogroup.com/api/shell",
  memberJar
);
const marketplaceHome = await timedHtml("https://marketplace.henrycogroup.com", memberJar);
const jobsCandidate = await timedHtml("https://jobs.henrycogroup.com/candidate", memberJar);
const studioClient = await timedHtml("https://studio.henrycogroup.com/client", memberJar);
const learnOwner = await timedHtml("https://learn.henrycogroup.com/owner", ownerJar);
const hqOwner = await timedHtml("https://hq.henrycogroup.com/owner", ownerJar);
const hqThreads = await timedJson(
  "https://hq.henrycogroup.com/api/owner/internal-comms/threads",
  ownerJar
);

const guestCartToken = crypto.randomUUID();
const guestCookieJar = new Map([["marketplace_cart_token", guestCartToken]]);
const productsResponse = await timedJson(
  "https://marketplace.henrycogroup.com/api/products",
  guestCookieJar
);
const guestProduct = productsResponse.json?.items?.[0];

if (guestProduct?.slug) {
  await fetchWithJar("https://marketplace.henrycogroup.com/api/cart", guestCookieJar, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      productSlug: guestProduct.slug,
      quantity: 1,
      sessionToken: guestCartToken,
    }),
  });
}

const guestCheckout = await timedHtml("https://marketplace.henrycogroup.com/checkout", guestCookieJar);

assert(accountCare.status === 200, `Account Care returned ${accountCare.status}.`, failures);
assert(
  accountCare.body.includes("Care") &&
    (accountCare.body.includes("Real Care bookings linked to your account") ||
      accountCare.body.includes("No Care bookings are linked yet") ||
      accountCare.body.includes("Linked Care bookings")),
  "Account Care page did not render the expected dashboard content.",
  failures
);
assert(
  accountNotifications.status === 200 && accountNotifications.body.includes("Notifications"),
  "Account notifications page did not render for an authenticated user.",
  failures
);
assert(
  marketplaceShell.status === 200 && marketplaceShell.json?.viewer?.signedIn === true,
  "Marketplace shell did not recognize the authenticated shared account.",
  failures
);
assert(marketplaceHome.status === 200, `Marketplace homepage returned ${marketplaceHome.status}.`, failures);
assert(
  guestCheckout.status === 200 &&
    guestCheckout.body.includes("Sign in to continue") &&
    guestCheckout.body.includes("Sign in required"),
  "Marketplace guest checkout gate did not render correctly.",
  failures
);
assert(
  jobsCandidate.status === 200 && jobsCandidate.body.includes("Candidate hub"),
  "Jobs candidate workspace did not render from the shared session.",
  failures
);
assert(
  (studioClient.status === 200 &&
    (studioClient.body.includes("Client workspace") ||
      studioClient.body.includes("No Studio activity yet"))) ||
    (studioClient.status >= 300 &&
      studioClient.status < 400 &&
      studioClient.location === "https://account.henrycogroup.com/studio"),
  "Studio client workspace did not resolve through the shared account flow.",
  failures
);
assert(learnOwner.status === 200, `Learn owner route returned ${learnOwner.status}.`, failures);
assert(
  hqOwner.status === 200 &&
    (hqOwner.body.includes("Central Owner Command Center") ||
      hqOwner.body.includes("company brain")),
  "HQ owner dashboard did not render for the owner account.",
  failures
);
assert(
  hqThreads.status === 200 && Array.isArray(hqThreads.json?.threads),
  "HQ internal communications threads API did not return the expected payload.",
  failures
);

const summary = {
  memberEmail: memberUser.email,
  ownerEmail: ownerUser.email,
  checks: {
    accountCare: { status: accountCare.status, ms: accountCare.ms },
    accountNotifications: { status: accountNotifications.status, ms: accountNotifications.ms },
    marketplaceShell: {
      status: marketplaceShell.status,
      ms: marketplaceShell.ms,
      signedIn: marketplaceShell.json?.viewer?.signedIn ?? false,
    },
    marketplaceHome: { status: marketplaceHome.status, ms: marketplaceHome.ms },
    marketplaceGuestCheckout: { status: guestCheckout.status, ms: guestCheckout.ms },
    jobsCandidate: { status: jobsCandidate.status, ms: jobsCandidate.ms },
    studioClient: { status: studioClient.status, ms: studioClient.ms, location: studioClient.location },
    learnOwner: { status: learnOwner.status, ms: learnOwner.ms },
    hqOwner: { status: hqOwner.status, ms: hqOwner.ms },
    hqThreads: {
      status: hqThreads.status,
      ms: hqThreads.ms,
      threadCount: Array.isArray(hqThreads.json?.threads) ? hqThreads.json.threads.length : 0,
    },
  },
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  console.error("\nVerification failures:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}
