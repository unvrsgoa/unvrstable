---
name: Vercel deployment paths
description: Reliable Vercel workspace-root, build-command, and output-directory rules for the club reservation app.
---

Do not diagnose every “No entrypoint found” message as a missing HTML file. If the searched names are app/index/server with JS or TS extensions, Vercel is using a server-framework builder on static output. Disable framework auto-detection for the combined static frontend and separate API-functions deployment.

**Why:** Successful Vite builds were repeatedly followed by server-entrypoint searches. Changing output paths did not address framework selection.

**How to apply:** Inspect the complete searched-file list and framework preset before changing build paths. Keep one repository-root deployment for the complete app; a frontend-only build passing does not prove the API is included.

Vercel compiles TypeScript API functions with NodeNext-compatible module resolution even though the workspace’s normal typecheck uses bundler resolution.

**Why:** Extensionless relative imports passed the workspace typecheck but failed only after Vercel compiled the API function. Explicit `Express`/`IRouter` annotations also resolved inconsistently in that compiler context.

**How to apply:** Use `.js` specifiers for relative imports and exports in ESM API/shared-library source (TypeScript maps them to `.ts`), prefer inference for Express application/router values, and run a NodeNext-specific compile of the Vercel API entrypoint before deployment.

Vercel deployment paths are relative to the configured Root Directory, not necessarily the repository root. A command can be present in GitHub but still appear missing when it is outside that selected root.

**Why:** Earlier advice incorrectly assumed the frontend was the selected workspace. Install logs listing Express, cookie-parser, api-zod and db instead point to the API workspace. Missing-script errors require checking the actual selected package, not adding copies to guessed folders. Vercel also limits Build Command to 256 characters.

**How to apply:** Keep the Build Command short (`sh scripts/vercel-build.sh`), keep compatible build scripts in both the repository and frontend workspace when a frontend-root deployment must be tolerated, and have each script explicitly create and verify `dist-vercel/index.html`. For the complete app, set Vercel Root Directory to `.` so the API is included, use `pnpm install --frozen-lockfile`, Build Command `sh scripts/vercel-build.sh`, and Output Directory `dist-vercel`. If a log reports an old commit or a missing script, verify the deployment commit and root directory before changing code.