import { toNextJsHandler } from "better-auth/next-js";
import { createAdminAuth } from "@/lib/admin-auth";

function handle(method: "GET" | "POST") {
  return async (request: Request) => {
    let route: ReturnType<typeof toNextJsHandler>;
    try {
      route = toNextJsHandler(createAdminAuth());
    } catch {
      return Response.json(
        { error: "administrator_auth_unavailable" },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    return route[method](request);
  };
}

export const GET = handle("GET");
export const POST = handle("POST");
