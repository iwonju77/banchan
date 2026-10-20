import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../scripts/migrate-preview.mjs", import.meta.url));

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
