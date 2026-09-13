---
name: Vercel build command length
description: Deployment constraint for the club reservation app’s Vercel configuration.
---

Vercel rejects a configured Build Command longer than 256 characters.

**Why:** The frontend build needs multiple shell steps to prepare the static output, but Vercel validates the command length before execution.

**How to apply:** Keep `vercel.json`’s Build Command as a short package-script invocation, and keep the actual build/copy logic in the repository root `package.json`. The Vercel project must use the repository root so the package script and API entrypoint are available.