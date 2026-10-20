import assert from "node:assert/strict";
import test from "node:test";
import { createLineProvider } from "../src/lib/line-provider.ts";

test("LINE OIDC enforces state, PKCE, nonce, and ES256 without email scope", () => {
  const provider = createLineProvider("test-channel", "test-secret");

  assert.deepEqual(provider.checks, ["state", "pkce", "nonce"]);
  assert.equal(provider.client.id_token_signed_response_alg, "ES256");
  assert.equal(provider.authorization.params.scope, "openid profile");
  assert.equal(provider.authorization.params.scope.includes("email"), false);
});

test("LINE profile mapping never persists an email address", () => {
  const provider = createLineProvider("test-channel", "test-secret");
  const user = provider.profile({
    iss: "https://access.line.me",
    sub: "line-subject",
    aud: "test-channel",
    exp: 1,
    iat: 1,
    amr: [],
    name: "Test User",
    picture: "https://example.test/profile.png",
    email: "unrequested@example.test",
    user: {},
  });

  assert.equal(user.id, "line-subject");
  assert.equal(user.email, null);
  assert.equal(user.name, "Test User");
  assert.equal(user.image, "https://example.test/profile.png");
});
