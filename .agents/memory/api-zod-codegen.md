---
name: API Zod export collisions
description: Durable guidance for keeping Orval-generated Zod schemas and TypeScript types exportable together.
---

When Orval generates a schema constant and a TypeScript type with the same exported name, the package barrel must export the generated API schemas plus an explicit, non-conflicting list of generated types rather than re-exporting the entire types directory.

**Why:** OpenAPI path/query parameter generation can introduce names such as `UpdateTableParams` that collide with operation-level Zod schemas during the workspace composite typecheck.

**How to apply:** After changing the OpenAPI contract and running codegen, run the root typecheck and resolve any barrel collisions at the package entrypoint instead of editing generated files.