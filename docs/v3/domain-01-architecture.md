# V3-DOMAIN-01 — henryonyx.com Domain Cutover

**Status:** Runbook ready. Code is already correct. Blocked only on DNS + Vercel custom-domain provisioning (infrastructure, ~5 min).
**Brand:** Henry Onyx · **Legal:** Henry Onyx Limited · **New domain:** `henryonyx.com`
**Old domain (redirect source):** `henrycogroup.com`

---

## 1. Audit findings (code-first)

### Base domain resolution

`packages/config/company.ts` line 59–61:
```ts
const BASE_DOMAIN =
  normalizeHostname(process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com") ||
  "henrycogroup.com";
```

**`NEXT_PUBLIC_BASE_DOMAIN=henryonyx.com` is the single flip.** The helper `resolveAppOrigin` at line 125–135 has an explicit gate:
```ts
const BASE_DOMAIN_IS_LEGACY_HENRYCOGROUP = BASE_DOMAIN === "henrycogroup.com";

function resolveAppOrigin(override, subdomain, liveFallback) {
  if (override) return override;
  if (BASE_DOMAIN_IS_LEGACY_HENRYCOGROUP) return liveFallback; // ← dead after flip
  return subdomain
    ? `https://${subdomain}.${BASE_DOMAIN}`          // ← active after flip
    : `https://${BASE_DOMAIN}`;
}
```

Once the env is set, `henryDomain("care")` → `https://care.henryonyx.com` — all helpers, all cross-division links, all SEO metadata, all email footers.

### Code changes required: **ONE DEFAULT CHANGE**

Change `packages/config/company.ts` line 60 default from `henrycogroup.com` to `henryonyx.com`:

```diff
-  normalizeHostname(process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com") ||
-  "henrycogroup.com";
+  normalizeHostname(process.env.NEXT_PUBLIC_BASE_DOMAIN || "henryonyx.com") ||
+  "henryonyx.com";
```

This ensures even CI builds without the env set (which currently default to `henrycogroup.com`) resolve correctly. **The Vercel production env is the primary lever; changing the default is belt-and-braces.**

### Hardcoded vercel.app to fix: 1 location

`apps/care/lib/care-links.ts:30`:
```ts
"https://care-bice.vercel.app"
```
Once `NEXT_PUBLIC_BASE_DOMAIN=henryonyx.com`, `getCarePublicOrigin()` resolves through `care.${baseDomain}` and never reaches this fallback. Remove the dead fallback:
```diff
-    "https://care-bice.vercel.app"
+    null
```

### Domain helpers usage
`henryDomain()` / `henryWebRoot()` / `henrySubdomain()` are the only source of URLs in 71+ callsites across all apps and packages. No hardcoded `henrycogroup.com` literals exist anywhere in committed code.

---

## 2. Division → subdomain map (what DNS records to create)

| Division | Subdomain | Custom domain | Vercel project |
|---|---|---|---|
| hub | — | `henryonyx.com` + `www.henryonyx.com` | `hub-mu-wheat` |
| account | `account` | `account.henryonyx.com` | `henryco-account-tau` |
| care | `care` | `care.henryonyx.com` | (care project) |
| marketplace | `marketplace` | `marketplace.henryonyx.com` | (marketplace project) |
| property | `property` | `property.henryonyx.com` | (property project) |
| logistics | `logistics` | `logistics.henryonyx.com` | (logistics project) |
| studio | `studio` | `studio.henryonyx.com` | (studio project) |
| jobs | `jobs` | `jobs.henryonyx.com` | (jobs project) |
| learn | `learn` | `learn.henryonyx.com` | (learn project) |
| building | `building` | `building.henryonyx.com` | (property project; sub-path or share) |
| hotel | `hotel` | `hotel.henryonyx.com` | (property project; sub-path or share) |
| staff | `staff` | `staff.henryonyx.com` | `staff-kappa-livid` |
| command (V3-COMMAND-02 staged) | `command` | `command.henryonyx.com` | (command project — after deploy) |
| work (V3-COMMAND-02 staged) | `work` | `work.henryonyx.com` | (work project — after deploy) |

---

## 3. Cloudflare DNS runbook

> Cloudflare DNS management MCP is unavailable in the current session.
> Execute these steps in the Cloudflare dashboard → DNS tab for `henryonyx.com`.
> Set all records to **DNS-only (grey cloud, proxy OFF)** — Vercel needs to issue its own TLS certificate and cannot do so through the Cloudflare proxy. Vercel explicitly recommends grey cloud for apex domains and CNAME entries.

### A. Apex (`henryonyx.com` → hub)

Vercel requires one of:
- **A record** pointing to Vercel's IP: `76.76.21.21` (the stable Vercel apex IP)
- The `ALIAS` / `ANAME` record type (Cloudflare supports `CNAME` flattening at the apex — use a CNAME to `cname.vercel-dns.com` at the apex root `@`)

**Recommended for Cloudflare:** Add a CNAME at `@` → `cname.vercel-dns.com.` (Cloudflare flattens this automatically).

### B. www redirect

Add CNAME `www` → `cname.vercel-dns.com.` — Vercel will redirect `www.henryonyx.com` → `henryonyx.com` once the domain is verified.

### C. Subdomain CNAMEs (one per division)

Add a CNAME record for each subdomain, **DNS-only (grey cloud)**, → `cname.vercel-dns.com.`:

| Name | Type | Value | Proxy |
|---|---|---|---|
| `@` | CNAME (flattened) | `cname.vercel-dns.com` | DNS-only |
| `www` | CNAME | `cname.vercel-dns.com` | DNS-only |
| `account` | CNAME | `cname.vercel-dns.com` | DNS-only |
| `care` | CNAME | `cname.vercel-dns.com` | DNS-only |
| `marketplace` | CNAME | `cname.vercel-dns.com` | DNS-only |
| `property` | CNAME | `cname.vercel-dns.com` | DNS-only |
| `logistics` | CNAME | `cname.vercel-dns.com` | DNS-only |
| `studio` | CNAME | `cname.vercel-dns.com` | DNS-only |
| `jobs` | CNAME | `cname.vercel-dns.com` | DNS-only |
| `learn` | CNAME | `cname.vercel-dns.com` | DNS-only |
| `building` | CNAME | `cname.vercel-dns.com` | DNS-only |
| `hotel` | CNAME | `cname.vercel-dns.com` | DNS-only |
| `staff` | CNAME | `cname.vercel-dns.com` | DNS-only |
| `command` | CNAME | `cname.vercel-dns.com` | DNS-only |
| `work` | CNAME | `cname.vercel-dns.com` | DNS-only |

---

## 4. Vercel custom domain runbook

For each Vercel project, run `vercel domains add <domain> --scope <team-slug>` or use the Vercel dashboard → Project Settings → Domains. The team for the HenryCo Studio projects is `team_0PUdVTapDfmw8tpwht4TvRUG`.

### CLI (fastest — one command per project)

```bash
# Install Vercel CLI once: npm i -g vercel
# Set token from C:\Users\HP VICTUS\.henryco-deploy-secrets.env

# Hub project (from hub-mu-wheat Vercel slug)
vercel domains add henryonyx.com --project hub-mu-wheat
vercel domains add www.henryonyx.com --project hub-mu-wheat

# Account project
vercel domains add account.henryonyx.com --project henryco-account-tau

# Staff project
vercel domains add staff.henryonyx.com --project staff-kappa-livid

# Division projects (use the Vercel project slug from each app's .vercel/project.json or dashboard)
vercel domains add care.henryonyx.com --project <care-project-slug>
vercel domains add marketplace.henryonyx.com --project <marketplace-project-slug>
vercel domains add property.henryonyx.com --project <property-project-slug>
vercel domains add logistics.henryonyx.com --project <logistics-project-slug>
vercel domains add studio.henryonyx.com --project <studio-project-slug>
vercel domains add jobs.henryonyx.com --project <jobs-project-slug>
vercel domains add learn.henryonyx.com --project <learn-project-slug>
```

### Set NEXT_PUBLIC_BASE_DOMAIN in each project

```bash
# Run for each project:
vercel env add NEXT_PUBLIC_BASE_DOMAIN production <project-slug>
# Value: henryonyx.com
```

Or in the Vercel dashboard: each project → Settings → Environment Variables → add `NEXT_PUBLIC_BASE_DOMAIN=henryonyx.com` for Production.

---

## 5. 301 redirects from henrycogroup.com

Create a thin redirect app (or use Cloudflare's bulk redirect) to forward `*.henrycogroup.com` → `*.henryonyx.com`. The simplest approach is a Vercel edge config or a single wildcard redirect rule in Cloudflare:
- Source: `*.henrycogroup.com/*` → Destination: `https://*.henryonyx.com/$1` (301 permanent)
- Add CNAME `*` → the same Vercel redirect project at `cname.vercel-dns.com`

---

## 6. Verification checklist

After DNS propagates (~5–60 min) and Vercel auto-issues TLS:

- [ ] `https://henryonyx.com` resolves → hub public page, TLS valid
- [ ] `https://www.henryonyx.com` → 301 to apex
- [ ] `https://care.henryonyx.com` → Care public page
- [ ] `https://marketplace.henryonyx.com` → Marketplace
- [ ] `https://studio.henryonyx.com` → Studio
- [ ] `https://jobs.henryonyx.com` → Jobs
- [ ] `https://learn.henryonyx.com` → Learn
- [ ] `https://property.henryonyx.com` → Property
- [ ] `https://logistics.henryonyx.com` → Logistics
- [ ] `https://account.henryonyx.com` → Account dashboard
- [ ] `https://staff.henryonyx.com` → Staff workspace
- [ ] Cross-division links (`henryDomain("care")`) point to `henryonyx.com` once `NEXT_PUBLIC_BASE_DOMAIN` is set
- [ ] `henrycogroup.com` links 301 to `henryonyx.com` equivalents

---

## 7. Code PR for V3-DOMAIN-01

Two code changes to land in a PR (separate from V3-COMMAND-02):

1. `packages/config/company.ts` — flip default from `henrycogroup.com` → `henryonyx.com` (lines 60–61)
2. `apps/care/lib/care-links.ts:30` — remove dead `care-bice.vercel.app` fallback (replace with `null`)

The comment at line 64–70 of `company.ts` should also be updated to reflect the cutover as done.
