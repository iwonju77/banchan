import LINE, { type LineProfile } from "next-auth/providers/line";
import type { OAuthConfig } from "next-auth/providers";

export function createLineProvider(
  clientId: string,
  clientSecret: string,
): OAuthConfig<LineProfile> {
  const provider = LINE({ clientId, clientSecret });
  provider.checks = ["state", "pkce", "nonce"];
  provider.authorization = {
    params: { scope: "openid profile" },
  };
  provider.client = {
    ...provider.client,
    id_token_signed_response_alg: "ES256",
  };
  provider.profile = (profile) => ({
    id: profile.sub,
    name: profile.name ?? null,
    email: null,
    image: profile.picture ?? null,
  });
  return provider;
}
