# V3-24 — Identity: KYC Vendor Integration

**Pass ID:** V3-24 | **Phase:** C | **Pillar:** P7
**Deps:** V3-12 | **Effort:** XL | **Parallel:** YES | **Owner gate:** D6 | **Risk:** Identity, Compliance

## Role
V3 KYC engineer. Execute, then stop.

## Project
Standard.

## Audit summary
Per AUDIT-BASELINE.md §1.4: KYC infra exists (`kyc_verification_infra` migration 2026-04-10) but no external vendor wired — manual review only. V3 vision P7: per-market KYC maturity.

## Mandatory scope

1. **KYC vendor adapter pattern**:
   ```typescript
   interface KycVendorAdapter {
     readonly vendorKey: 'smile_identity' | 'onfido' | 'sumsub' | 'internal';
     readonly supportedCountries: ReadonlyArray<string>;
     readonly supportedDocumentTypes: ReadonlyArray<string>;
     initiateVerification(input): Promise<VerificationSession>;
     fetchResult(sessionId): Promise<VerificationResult>;
     verifyWebhook(payload, headers): Promise<WebhookResult>;
   }
   ```

2. **Smile Identity adapter** (D6 recommended primary for African markets):
   - BVN + NIN + passport + driver's license per Nigeria.
   - Voter card per Kenya/South Africa.
   - Biometric selfie.
   - Document liveness check.

3. **Onfido adapter** (D6 recommended fallback for international):
   - Passport + national ID + driver's license per market.
   - Facial similarity.
   - Document authenticity.

4. **Router for vendor selection**:
   - Country → preferred vendor (Smile for African, Onfido for international).
   - Failover if primary vendor unavailable.

5. **Verification levels**:
   - L0 unverified (default).
   - L1 email-verified.
   - L2 phone-verified.
   - L3 document-verified (passport/NIN/BVN).
   - L4 biometric-verified (selfie + document match).
   - Sensitive actions gate on level (e.g., wallet withdraw requires L3+; gaming requires L4).

6. **`kyc_submissions` extended schema**:
   - vendor used, vendor_session_id, vendor_result_json (raw response, redacted PII).
   - status: pending → in_review → approved/rejected.

7. **User-facing flow**:
   - `apps/account/app/(account)/verification/` updated to use vendor SDK.
   - Mobile flow integrates vendor's mobile capture SDK.

8. **Staff review queue**:
   - For vendor-flagged or rejected cases, staff reviewer in `apps/staff/`.

9. **Telemetry** — `henry.kyc.session.initiated`, `henry.kyc.documents.uploaded`, `henry.kyc.vendor_decision`, `henry.kyc.staff_override`, `henry.kyc.verification.completed`.

## Out of scope
- Per-action gating logic (each action implements its own gate using verification level).
- Privacy data rights (V3-93).

## Dependencies
V3-12. Blocks V3-50, V3-65, V3-67, V3-93.

## Inheritance
Existing kyc_verification_infra migration; @henryco/trust; sensitive-action-guard from V3-02; audit-log.

## Trust / safety / compliance
- L5 KYC vendor contract signed.
- L14 DPA signed.
- L16 data residency per market.
- Documents stored encrypted at rest; vendor-side handling per their DPA.
- Sensitive-action guard on every step.
- ANTI-CLONE Principles 6, 10 (data moat), 12.

## Mobile + desktop parity
Web: vendor's web SDK. Expo: vendor's mobile SDK (e.g., Smile Identity React Native SDK).

## i18n
Verification copy per locale; vendor's UI may have own localization.

## Validation gates
1. Standard CI.
2. **Sandbox e2e** for both vendors.
3. **Webhook signature verification**.
4. **Verification level gating** — sensitive action tests pass only with appropriate level.
5. **Staff override path** verified.

## Deployment gate
- L5 + L14 + L16 verified.
- 14-day staging soak with synthetic users.
- Live ramp monitored.

## Final report contract
Standard.

## Self-verification
- [ ] Adapter pattern + 2 vendor adapters + router.
- [ ] 4 verification levels.
- [ ] Schema extended with vendor metadata.
- [ ] Web + Expo flows.
- [ ] Staff review queue.
- [ ] 5 new telemetry events.
- [ ] L5 + L14 + L16 verified.
- [ ] Report written.
