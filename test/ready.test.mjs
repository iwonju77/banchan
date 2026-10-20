import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../src/app/api/ready/route.ts";

test("readiness fails closed when the database URL is absent", async () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;

  try {
    const response = await GET(new Request("http://localhost/api/ready"));

    assert.equal(response.status, 503);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), {
      status: "unavailable",
      path: "/api/ready",
      database: "unconfigured",
    });
  } finally {
    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
  }
});
