import assert from "node:assert/strict";
import test from "node:test";
import { revokeLineAccessToken } from "../src/lib/line-token.ts";

test("LINE logout posts channel credentials and user access token to revoke API", async () => {
  let request;
  await revokeLineAccessToken(
    "user-access-token",
    "channel-id",
    "channel-secret",
    async (url, options) => {
      request = { url, options };
      return new Response(null, { status: 200 });
    },
  );

  assert.equal(request.url, "https://api.line.me/oauth2/v2.1/revoke");
  assert.equal(request.options.method, "POST");
  assert.equal(
    request.options.headers["Content-Type"],
    "application/x-www-form-urlencoded",
  );
  assert.deepEqual(
    Object.fromEntries(request.options.body.entries()),
    {
      client_id: "channel-id",
      client_secret: "channel-secret",
      access_token: "user-access-token",
    },
  );
});

test("LINE revocation failure is surfaced without leaking token data", async () => {
  await assert.rejects(
    revokeLineAccessToken("secret-token", "channel", "secret", async () =>
      new Response(null, { status: 400 }),
    ),
    { message: "LINE access-token revocation request failed." },
  );
});
