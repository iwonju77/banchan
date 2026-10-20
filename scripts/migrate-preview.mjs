import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

function parsePostgresUrl(value, variableName) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${variableName} must be a valid PostgreSQL URL.`);
  }

  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error(`${variableName} must be a valid PostgreSQL URL.`);
  }
  return url;
}

export function assertSamePreviewDatabase(pooledUrl, directUrl) {
  const pooled = parsePostgresUrl(pooledUrl, "DATABASE_URL");
  const direct = parsePostgresUrl(directUrl, "DATABASE_URL_UNPOOLED");
  const normalizeHost = (hostname) => hostname.replace(/-pooler(?=\.)/, "");
  const normalizeDatabase = (pathname) => pathname.replace(/\/+$/, "");

  if (
    normalizeHost(pooled.hostname) !== normalizeHost(direct.hostname) ||
    normalizeDatabase(pooled.pathname) !== normalizeDatabase(direct.pathname)
  ) {
    throw new Error(
      "Preview DATABASE_URL and DATABASE_URL_UNPOOLED must target the same database.",
    );
  }
}

async function main() {
  if (process.env.VERCEL_ENV !== "preview") return;

  const directUrl = process.env.DATABASE_URL_UNPOOLED;
  if (!directUrl) {
    console.warn(
      "Skipping Preview migrations: DATABASE_URL_UNPOOLED is unset. Authentication and consent remain unavailable until the migration is applied.",
    );
    return;
  }

  const pooledUrl = process.env.DATABASE_URL;
  if (!pooledUrl) {
    throw new Error("DATABASE_URL is required when Preview migrations are enabled.");
  }
  assertSamePreviewDatabase(pooledUrl, directUrl);

  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: process.env,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Preview migration failed.");
    process.exitCode = 1;
  });
}
