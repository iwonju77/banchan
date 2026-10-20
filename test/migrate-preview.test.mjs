import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { assertSamePreviewDatabase } from "../scripts/migrate-preview.mjs";

const script = fileURLToPath(new URL("../scripts/migrate-preview.mjs", import.meta.url));

test("accepts pooled and direct URLs for the same Neon database", () => {
  assert.doesNotThrow(() =>
    assertSamePreviewDatabase(
      "postgresql://app@ep-preview-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require",
      "postgresql://owner@ep-preview.us-east-2.aws.neon.tech/neondb?sslmode=require",
    ),
  );
});

test("rejects pooled and direct URLs for different Neon databases", () => {
  assert.throws(
    () =>
      assertSamePreviewDatabase(
        "postgresql://app@ep-preview-pooler.us-east-2.aws.neon.tech/neondb",
        "postgresql://owner@ep-production.us-east-2.aws.neon.tech/neondb",
      ),
    /must target the same database/,
  );
});

test("rejects invalid database URLs", () => {
  assert.throws(
    () => assertSamePreviewDatabase("not-a-url", "postgresql://owner@ep-preview/neondb"),
    /DATABASE_URL must be a valid PostgreSQL URL/,
  );
});

test("Preview deployment rejects mismatched database URLs before migration", () => {
  const result = spawnSync(process.execPath, [script], {
    encoding: "utf8",
    env: {
      ...process.env,
      VERCEL_ENV: "preview",
      DATABASE_URL: "postgresql://app@ep-preview-pooler.us-east-2.aws.neon.tech/neondb",
      DATABASE_URL_UNPOOLED: "postgresql://owner@ep-production.us-east-2.aws.neon.tech/neondb",
    },
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must target the same database/);
});

test("Preview deployment warns and continues without a direct migration URL", () => {
  const result = spawnSync(process.execPath, [script], {
    encoding: "utf8",
    env: {
      ...process.env,
      VERCEL_ENV: "preview",
      DATABASE_URL_UNPOOLED: "",
    },
  });

  assert.equal(result.status, 0);
  assert.match(result.stderr, /Skipping Preview migrations/);
});

test("non-Preview builds never attempt Preview migrations", () => {
  const result = spawnSync(process.execPath, [script], {
    encoding: "utf8",
    env: {
      ...process.env,
      VERCEL_ENV: "production",
      DATABASE_URL_UNPOOLED: "",
    },
  });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
});
