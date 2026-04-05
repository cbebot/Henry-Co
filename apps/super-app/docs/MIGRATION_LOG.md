# External Integration Migration Log

Record every change that touches third-party systems. Copy this table row when you integrate.

| Date (UTC) | System     | Change                                   | Owner | Notes                                  |
| ---------- | ---------- | ---------------------------------------- | ----- | -------------------------------------- |
| 2026-04-05 | Supabase   | Initial `super_app_core` migration added | —     | Staging project only; includes RLS     |
| 2026-04-05 | Cloudinary | URL builder defaults to `henryco` folder | —     | Uses public delivery URLs              |
| 2026-04-05 | Sentry     | Client init behind `EXPO_PUBLIC_SENTRY_DSN` | —  | No-op when unset                       |
| 2026-04-05 | Expo / EAS | Placeholder `projectId` in `app.json`    | —     | Replace with staging project before CI |

## Pending approvals

- Production Supabase project linkage
- Production Apple / Google signing assets
- Push notification operational owner
- Payments provider (Marketplace / Studio) — **not started** in this app revision
