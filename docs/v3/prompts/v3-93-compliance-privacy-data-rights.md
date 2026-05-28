# V3-93 — Compliance: Privacy + Data Rights

**Pass ID:** V3-93 | **Phase:** I | **Pillar:** P12, P7
**Deps:** V3-24, V3-90 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** Compliance

## Role
V3 Privacy + Data Rights engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P12: "Privacy & data rights (GDPR / CCPA / NDPR)."

## Mandatory scope

1. **DSAR (Data Subject Access Request) endpoint**:
   - User-initiated at `apps/account/app/(account)/privacy/data-export/`.
   - Generates a comprehensive export (JSON + CSV).
   - Delivered via secure signed-URL (24h expiry).
   - Includes all user data: profile, orders, bookings, messages, KYC docs (encrypted), payments, AI usage.

2. **Deletion workflow**:
   - User requests account deletion.
   - 30-day grace period (cancel anytime within).
   - On execution: cascade-delete or anonymize per data class:
     - Personal identifiers: deleted.
     - Transaction history: anonymized (retained for accounting per L2 + L15).
     - Reviews + listings: anonymized author.
     - Logs + events: PII redacted, identifiers removed.
   - Audit-log entry created (immutable per V3-17 pattern).

3. **Consent ledger**:
   - Every consent action (terms acceptance, cookie choice, marketing opt-in, data-export request) logged in `consent_log` table.
   - Versioned (which consent version did the user accept).

4. **Cookie + tracker consent banner** (per L17): integrated globally.

5. **Per-region data residency** (per L16): documented; for EU users, data stored in EU-region Supabase if D10 commits.

6. **Telemetry** — `henry.privacy.dsar.requested`, `henry.privacy.dsar.delivered`, `henry.privacy.deletion.requested`, `henry.privacy.deletion.executed`, `henry.privacy.consent.recorded`.

## Integration keys (per INTEGRATION-KEYS.md)

Consumed:
- Supabase keys.
- `RESEND_API_KEY` (DSAR delivery).
- Cloudinary keys (for KYC document export, signed URL).

ZERO hardcoded retention periods or jurisdiction codes (use config table).

## Out of scope
- Cookie banner (L17 separate; integrated here).
- Consent management platform if international (D10 decision).

## Dependencies
V3-24, V3-90.

## Inheritance
@henryco/auth; @henryco/observability/audit-log; V3-90 data lake.

## Trust / safety / compliance
- L6 + L14 + L17 verified.
- 30-day deletion grace per GDPR + NDPR.
- Re-identification protection on anonymized data.
- ANTI-CLONE Principles 6, 12.

## Mobile + desktop parity
Privacy actions available on both.

## i18n
Per locale; legal copy reviewed by counsel per market.

## Validation gates
1. Standard CI.
2. **DSAR e2e** — synthetic user requests export, receives within 7 days (target).
3. **Deletion e2e** — request → 30-day timer → execute → verify cascade.
4. **Consent ledger** — every consent action recorded.

## Deployment gate
- L6 + L17 published.
- 30-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] DSAR endpoint.
- [ ] Deletion workflow.
- [ ] Consent ledger.
- [ ] Per-region residency.
- [ ] 5 new telemetry events.
- [ ] L6, L14, L17 verified.
- [ ] Report written.
