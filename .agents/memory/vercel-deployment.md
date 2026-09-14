---
name: Vercel build command length
description: Deployment constraint for the club reservation app’s Vercel configuration.
---

Vercel rejects a configured Build Command longer than 256 characters.

**Why:** The frontend build needs multiple shell steps to prepare the static output, but Vercel validates the command length before execution.

**How to apply:** Keep `vercel.json`’s Build Command as the short `sh scripts/vercel-build.sh` invocation. That script builds the frontend, copies the result to `dist-vercel`, and checks for `dist-vercel/index.html`. Use the repository root for deployment so the API entrypoint is included.