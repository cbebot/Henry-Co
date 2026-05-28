# V3 Infrastructure Decisions

## ID-1 — Cloudflare reverse-proxy in front of Vercel
- Status: APPROVED
- Scheduled: after Wave B.2 closes (Phase B complete). NOT before — introducing a network layer mid-foundation-lock would confound observability baselines.
- Architecture: Cloudflare handles DNS + CDN + DDoS + WAF + bot detection + edge caching in front; Vercel still builds, deploys, and serves the 10 apps as origin.
- Cutover mechanics: switch DNS to Cloudflare proxied (orange-cloud) records pointing at Vercel; configure each Vercel project to trust CF-Connecting-IP for real client IP; install Cloudflare Origin certificate on Vercel for end-to-end TLS.
- Effort: 2-3 days focused, zero-downtime if done right.
- Risks (all known-and-solved): real client IP detection, rate-limit hitting own infra, cache poisoning, WebSocket handling.
- Account: same Cloudflare account that will hold the henry.holdings registrar.
- Prompt: pending — to be authored when Wave B.2 is closing.
- Cross-ref: docs/v3/handoff/vercel-migration-playbook.md

## ID-2 — Domain: henry.holdings on Cloudflare Registrar
- Status: TO ACQUIRE (see docs/v3/domain-decision.md)
- Migration tracked as V3-DOMAIN-01 in PASS-REGISTER.md
- Current production domain: henrycogroup.com
