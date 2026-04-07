# GitHub as source of truth

HenryCo uses **GitHub** as the **single canonical remote** and **only** place where CI/CD for this repository is defined.

## Repository rules

| Rule | Detail |
| ---- | ------ |
| Primary remote | `origin` should point at the GitHub repository (HTTPS or SSH). |
| GitLab | Do **not** use GitLab as the primary remote or as a second CI authority. If you keep a GitLab **mirror** for visibility, turn off GitLab CI there so pipelines are not duplicated. |
| Branches | Do day-to-day work on **feature branches**. Open **pull requests** into `main` (or `master`). |
| `main` | **Protect** `main`: require PRs, required status checks (`CI` workflow), no force-push. |
| Production | **No production deploy** (Vercel production, EAS production store submit, etc.) without **explicit human approval** per your release process. |

## CI on GitHub Actions

Workflow: [.github/workflows/ci.yml](../.github/workflows/ci.yml)

On every push and pull request targeting `main` / `master` it runs:

1. **Lint** — `pnpm run lint:all` (all workspace apps under `apps/*`).
2. **Typecheck** — `pnpm run typecheck:all`.
3. **Tests** — `pnpm run test:workspace` (HenryCo super-app Jest suite today).
4. **Build validation** — `pnpm run build:all` (Next.js apps; packages without a `build` script are skipped by pnpm).

CI injects **non-secret placeholder** Supabase-related env vars so `next build` can run without real keys. Real values still come from **Vercel** (web) or **EAS** (mobile) at deploy time.

## Vercel (web / admin Next.js apps)

Each app under `apps/*` that ships to the web can keep its own `vercel.json` (already present on several apps).

**Recommended setup**

1. In [Vercel](https://vercel.com), **Import** the **GitHub** repository (not GitLab).
2. Create one Vercel project per deployable app, each with **Root Directory** set (e.g. `apps/hub`, `apps/studio`).
3. Enable **Preview Deployments** for pull requests.
4. Attach the **Production** branch to `main` and restrict who can promote to production (Vercel **Deployment Protection** / **Git** production branch rules).
5. Store env vars in Vercel per environment (Preview vs Production). Do not commit secrets.

Vercel remains responsible for **hosting**; GitHub Actions remains responsible for **validation** before merge.

### Required references

- Project mapping: [vercel-project-map.md](./vercel-project-map.md)
- Shared-change redeploy rules: [redeploy-impact-matrix.md](./redeploy-impact-matrix.md)

## Expo EAS (mobile super-app)

- Config: [`apps/super-app/eas.json`](../apps/super-app/eas.json).
- Workflow: [.github/workflows/eas-build.yml](../.github/workflows/eas-build.yml) (manual `workflow_dispatch`).

**Setup**

1. Create an Expo account and an EAS project; set `extra.eas.projectId` in `apps/super-app/app.json` when ready (staging first).
2. Add **`EXPO_TOKEN`** to GitHub → *Settings → Secrets and variables → Actions*.
3. In GitHub → *Settings → Environments*, create:
   - **`production`** — add **Required reviewers** so EAS production builds do not run until someone approves the workflow job.
   - **`eas-nonprod`** — used for preview/staging profiles; optional protection.

The EAS workflow **skips** entirely if `EXPO_TOKEN` is missing (e.g. forks).

## Local convenience

From the repo root:

```bash
pnpm run ci:validate   # same steps as CI (lint + typecheck + test + build)
```

## Migration notes

- **Do not** add `.gitlab-ci.yml` for this repo unless it only contains a stub that points maintainers to GitHub Actions (avoid duplicate pipelines).
- Historical **super-app-only** workflow was merged into `ci.yml` to avoid overlapping workflows.
