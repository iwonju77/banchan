import { execFileSync } from "node:child_process";

if (process.env.VERCEL_ENV !== "preview") {
  process.exit(0);
}

if (!process.env.DATABASE_URL_UNPOOLED) {
  console.warn(
    "Skipping Preview migrations: DATABASE_URL_UNPOOLED is unset. Authentication and consent remain unavailable until the migration is applied.",
  );
  process.exit(0);
}

execFileSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: process.env,
});
