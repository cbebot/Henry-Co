# V3-32 — AI: Studio Domain + Brief Assist

**Pass ID:** V3-32 | **Phase:** D | **Pillar:** P4
**Deps:** V3-28 | **Effort:** M | **Parallel:** YES | **Owner gate:** none | **Risk:** Money

## Role
V3 Studio-AI engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P4: "Assist domain lookup in studio, assist studio project briefs." Existing `apps/studio/lib/studio/domain-intelligence.ts` + `brief-copilot-action.ts` are deterministic.

## Mandatory scope

1. **Task class**: `studio_domain_lookup` (free_company — sales-aiding for paid service) + `studio_brief_assist` (metered_business for client-end).

2. **Domain lookup**:
   - User types desired domain → AI suggests variants if taken.
   - Integrates with WHOIS / domain registry API (Namecheap / GoDaddy / Cloudflare).
   - Output: availability + variants + pricing + IP risk flag.

3. **Brief assist**:
   - User describes project loosely → AI structures into scope + deliverables + timeline + budget range.
   - Suggests Studio templates from existing catalog.
   - Generated brief inserted into proposal flow.

4. **Per-call rate limit**: domain lookup 50/day, brief assist 20/day.

5. **Telemetry** — `henry.intelligence.studio_domain.queried`, `henry.intelligence.studio_brief.drafted`.

## Out of scope
- Auto-registering domains (V4).
- Auto-generating proposals end-to-end (brief assist drafts only).

## Dependencies
V3-28; existing studio deterministic helpers.

## Inheritance
apps/studio/lib/studio/*; @henryco/intelligence-chat.

## Trust / safety / compliance
- Domain lookup is sales-aiding → free.
- Brief assist for client-end is metered (client pays).
- ANTI-CLONE Principle 1.

## Mobile + desktop parity
Same overlay.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **Domain lookup smoke** — query "henryco.com" → available status + variants.
3. **Brief assist smoke** — vague description → structured brief.
4. **Rate limits**.
5. **Free vs metered billing path**.

## Deployment gate
- 7-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Two task classes registered.
- [ ] Domain lookup wired with registry API.
- [ ] Brief assist wired with proposal flow.
- [ ] Rate limits.
- [ ] 2 new telemetry events.
- [ ] Report written.
