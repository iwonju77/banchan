import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../src/app/api/health/route.ts";

test("health endpoint returns an uncached liveness response", async () => {
  const response = GET(new Request("http://localhost/api/health"));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    status: "ok",
    path: "/api/health",
  });
});
