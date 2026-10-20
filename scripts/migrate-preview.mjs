import { execFileSync } from "node:child_process";

if (process.env.VERCEL_ENV !== "preview") {
  process.exit(0);
}

if (!process.env.DATABASE_URL_UNPOOLED) {
  throw new Error(
    "DATABASE_URL_UNPOOLED must be configured for the isolated Preview database before migrations can run.",
  );
}

execFileSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: process.env,
});
