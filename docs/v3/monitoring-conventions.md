# Monitoring Conventions

## Vercel Deployment Protection

External uptime monitors must target verified production aliases, not raw
per-deployment URLs.

Vercel Deployment Protection path bypasses can allow `/api/health` preflight
traffic on protected deployment URLs. In the current HenryCo V3 setup,
`OPTIONS /api/health` returns 204 on the protected deployment URL, while
`GET /api/health` on protected `*.vercel.app` deployment URLs can still return
401 before app code runs.

Prefer the custom production domains for uptime checks after they are bound and
returning application health, for example:

- `https://account.henrycogroup.com/api/health`
- `https://marketplace.henrycogroup.com/api/health`
- `https://jobs.henrycogroup.com/api/health`

Do not point Better Stack, UptimeRobot, Cloudflare monitoring, or similar checks
at per-deployment URLs such as
`https://<project>-<hash>-henry-co-studio.vercel.app/api/health`.

If a monitor sees a healthy app as 401 on a `*.vercel.app` URL, first verify the
same path on the production alias before debugging application health.

If a custom domain returns a Vercel platform error before app code runs, such as
`DEPLOYMENT_DISABLED`, treat that as a domain/billing/binding issue. Use the
project production alias only as a temporary monitor target while the custom
domain is repaired.
