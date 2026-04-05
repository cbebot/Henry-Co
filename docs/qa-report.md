# QA report template — MVP stabilization

**Build:** (EAS build id or git SHA)  
**Tester:**  
**Date:**  
**Environment:** local | staging | production  

## 1. Smoke test checklist (Super App)

| # | Step | Pass |
| --- | --- | --- |
| 1 | Cold start → Hub loads | ☐ |
| 2 | Tab switch Hub / Directory / Services / Account | ☐ |
| 3 | Open division module from Directory | ☐ |
| 4 | Open external link from module (if applicable) | ☐ |
| 5 | Account mock sign-in (local) or real sign-in (staging) | ☐ |
| 6 | Activity card navigates to `/module/[slug]` | ☐ |
| 7 | Legal → Contact submit | ☐ |
| 8 | Legal → Privacy / Terms render | ☐ |

## 2. Regression checklist (Super App)

| # | Area | Pass |
| --- | --- | --- |
| 1 | Directory filter / search still works | ☐ |
| 2 | `buildings-interiors` shows coming soon | ☐ |
| 3 | Sign out clears session | ☐ |
| 4 | 404 route (`+not-found`) | ☐ |

## 3. Auth test cases

| Case | Steps | Expected |
| --- | --- | --- |
| A1 | Valid mock credentials (local) | Session created |
| A2 | Invalid password (<8 chars) | Validation error |
| A3 | Staging wrong password | Adapter error message |
| A4 | Sign out | Session null |

## 4. Payment test cases

| Case | Steps | Expected |
| --- | --- | --- |
| P1 | Local + payments demo on | Mock success message |
| P2 | Staging default (demo off) | No demo button |
| P3 | Deferred adapter when enabled | Clear “not implemented” / no crash |

## 5. Upload / media test cases

| Case | Steps | Expected |
| --- | --- | --- |
| M1 | Hub / module images | Load from Cloudinary URLs |
| M2 | Upload (flag off) | No upload UI / no crash |

## 6. Admin / role test cases

Super App has **no in-app admin RBAC** yet. Test **Supabase dashboard** roles separately.

| Case | Steps | Expected |
| --- | --- | --- |
| R1 | Staging RLS as anon | Reads/writes per policy |

## 7. Error state test cases

| Case | Steps | Expected |
| --- | --- | --- |
| E1 | Airplane mode on Directory | Graceful empty/error (platform dependent) |
| E2 | Bad contact payload | Zod / UI error |

## 8. Empty state test cases

| Case | Expected |
| --- | --- |
| No activity | Empty list copy |
| No remote divisions | Fallback catalog |

## 9. Offline / poor network

| Case | Expected |
| --- | --- |
| Slow 3G | Loading indicators; no white screen |
| Offline after load | Cached screens where applicable; errors on fetch |

## 10. Crash / exception

| Case | Expected |
| --- | --- |
| JS error boundary | Expo error overlay (dev) / Sentry (staging) |

## Sign-off

- [ ] Smoke pass
- [ ] No critical open issues (see [critical-bugs.md](./critical-bugs.md))
- [ ] Staging validation steps updated
