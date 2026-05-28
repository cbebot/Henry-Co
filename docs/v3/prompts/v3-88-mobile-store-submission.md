# V3-88 — Mobile: Store Submission

**Pass ID:** V3-88 | **Phase:** I | **Pillar:** P12
**Deps:** V3-87, V3-23 | **Effort:** XL | **Parallel:** NO | **Owner gate:** none | **Risk:** Compliance

## Role
V3 Mobile Submission engineer. Execute, then stop.

## Project
Standard.

## Audit summary
After V3-87 ships wave-1 parity + V3-23 native-app payment compliance is verified, submit to App Store + Play Store.

## Mandatory scope

1. **App Store metadata**:
   - App icon (1024x1024).
   - Screenshots per device size.
   - App description + keywords (per market).
   - Privacy policy link.
   - Support URL.
   - In-app purchase metadata (if shipping IAP per V3-23).

2. **Play Store metadata**: similar but Google-specific.

3. **App review prep**:
   - Test account for reviewers.
   - Demo video.
   - Reviewer notes explaining KYC + payment flows.

4. **Pre-submission checklist**:
   - All required env vars in production scope.
   - OneSignal push tested on real devices.
   - Mapbox tokens production-tier.
   - Sentry receiving events from store builds.
   - Privacy manifests (iOS 17+ data collection disclosure) accurate.

5. **Submission CI**:
   - EAS Build (Expo) or equivalent Flutter CI per V3-86.
   - Auto-submit to TestFlight + Internal Track.

6. **Owner-approved submission**: final go-live on owner sign-off.

7. **Telemetry** — `henry.mobile.app.review_submitted`, `henry.mobile.app.review_approved`, `henry.mobile.app.released`.

## Integration keys (per INTEGRATION-KEYS.md)

Consumed (production scope):
- All Expo public env vars (from V3-87).
- `EXPO_TOKEN` (CI).
- `ASC_API_KEY_ID`, `ASC_ISSUER_ID`, `ASC_PRIVATE_KEY` — App Store Connect submission.
- `GPLAY_SERVICE_ACCOUNT_JSON` — Play Store submission.

L9 owner action: developer accounts under HenryCo legal entity.

## Out of scope
- Web app (already deployed).
- Wave-2 mobile features (separate pass).

## Dependencies
V3-87, V3-23.

## Inheritance
V3-87 build; existing app.json configs.

## Trust / safety / compliance
- L9 store developer accounts.
- Privacy manifests current.
- App Store / Play Store review compliance.
- Per-region content rules (especially gaming markets if V3-65/66 ships).

## Mobile + desktop parity
N/A (mobile submission).

## i18n
Store listings localized per D10 markets.

## Validation gates
1. **EAS build** succeeds for iOS + Android.
2. **TestFlight + Internal Track** review.
3. **Pre-submission checklist** complete.
4. **Reviewer test account** functional.

## Deployment gate
- Owner approves submission.
- Owner approves store release after review.

## Final report contract
Standard.

## Self-verification
- [ ] Metadata complete.
- [ ] Submission CI live.
- [ ] L9 verified.
- [ ] Privacy manifests accurate.
- [ ] Approved by App Store + Play Store.
- [ ] 3 new telemetry events.
- [ ] Report written.
