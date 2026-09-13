---
name: Vercel build command length
description: Deployment constraint for the club reservation app’s Vercel configuration.
---

Vercel rejects a configured Build Command longer than 256 characters.

**Why:** The frontend build needs multiple shell steps to prepare the static output, but Vercel validates the command length before execution.

**How to apply:** Keep `vercel.json`’s Build Command as a short package-script invocation, and keep matching `vercel-build` scripts in both the repository root and frontend package manifests so either Vercel root setting can build. Use the repository root for the real deployment so the API entrypoint is included.