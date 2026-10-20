type Fetcher = typeof fetch;

export async function revokeLineAccessToken(
  accessToken: string,
  clientId: string,
  clientSecret: string,
  fetcher: Fetcher = fetch,
): Promise<void> {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    access_token: accessToken,
  });
  const response = await fetcher("https://api.line.me/oauth2/v2.1/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("LINE access-token revocation request failed.");
  }
}
