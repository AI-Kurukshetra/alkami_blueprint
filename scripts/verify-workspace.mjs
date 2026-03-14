import { existsSync } from "node:fs";

const requiredPaths = [
  "app/page.tsx",
  "app/admin/users/page.tsx",
  "packages/database/src/queries.ts",
  "supabase/migrations/0001_init.sql",
  "supabase/seed/seed.sql",
  "docs/tasks.md",
  "docs/decisions.md"
];

const missing = requiredPaths.filter((filePath) => !existsSync(new URL(`../${filePath}`, import.meta.url)));

if (missing.length > 0) {
  console.error("Missing required paths:");
  for (const filePath of missing) {
    console.error(`- ${filePath}`);
  }
  process.exit(1);
}

console.log("Workspace verification passed.");
