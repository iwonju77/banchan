export function GET(request: Request) {
  const { pathname } = new URL(request.url);

  return Response.json(
    { status: "ok", path: pathname },
    { headers: { "Cache-Control": "no-store" } },
  );
}
