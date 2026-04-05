# App Store Readiness Checklist (HenryCo Super App)

## Brand & product

- [ ] Final app name, subtitle, and keywords per store guidelines
- [ ] Screenshots for required device sizes (iOS + Android)
- [ ] Preview video (optional)
- [ ] Support URL and marketing URL (staging vs production decision)
- [ ] Privacy nutrition labels / data safety forms completed from actual telemetry

## Legal

- [ ] Privacy policy URL matches in-app legal copy
- [ ] Terms URL matches checkout / account flows when commerce goes live
- [ ] Division-specific addenda linked where required

## Technical

- [ ] Replace staging bundle identifiers (`com.henryco.superapp.staging`) with production IDs
- [ ] Configure EAS `production` profile with correct credentials
- [ ] Enable push notification certificates / FCM keys in EAS
- [ ] Verify deep links + associated domains in production
- [ ] Sentry DSN and environment tags for production
- [ ] Performance: cold start, bundle size, image caching (Cloudinary transforms)

## QA

- [ ] Auth flows (sign-in, sign-out, session restore)
- [ ] Offline / flaky network handling for Hub + Directory
- [ ] Contact form end-to-end against staging Supabase
- [ ] Accessibility audit (VoiceOver / TalkBack) on primary tabs
- [ ] Localization strategy (if multi-country rollout)

## Operations

- [ ] Incident response owner + escalation path
- [ ] Store listing contact information
- [ ] Rollback plan for bad builds (EAS prior binary)
