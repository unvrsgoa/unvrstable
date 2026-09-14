---
name: Vercel deployment paths
description: Reliable Vercel workspace-root, build-command, and output-directory rules for the club reservation app.
---

Vercel deployment paths are relative to the configured Root Directory, not necessarily the repository root. A command can be present in GitHub but still appear missing when it is outside that selected root. Likewise, an output directory can exist in the repository but be empty from Vercel’s build context.

**Why:** This workspace is a pnpm monorepo with the frontend under `artifacts/club-reservation` and the API under `api`. Previous failures came from mixing repository-root paths with frontend-root paths, using a dashboard override that referenced a missing package script, exceeding Vercel’s 256-character Build Command limit, and pointing Output Directory at a folder that did not contain `index.html`.

**How to apply:** Keep the Build Command short (`sh scripts/vercel-build.sh`), keep compatible build scripts in both the repository and frontend workspace when a frontend-root deployment must be tolerated, and have each script explicitly create and verify `dist-vercel/index.html`. For the complete app, set Vercel Root Directory to `.` so the API is included, use `pnpm install --frozen-lockfile`, Build Command `sh scripts/vercel-build.sh`, and Output Directory `dist-vercel`. If a log reports an old commit or a missing script, verify the deployment commit and root directory before changing code.