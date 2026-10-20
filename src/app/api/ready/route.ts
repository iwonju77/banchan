import { getPrismaClient } from "@/lib/prisma";

export async function GET(request: Request) {
  const pathname = new URL(request.url).pathname;
  const databaseUrl = process.env.DATABASE_URL;
  const headers = { "Cache-Control": "no-store" };

  if (!databaseUrl) {
    return Response.json(
      { status: "unavailable", path: pathname, database: "unconfigured" },
      { status: 503, headers },
    );
  }

  try {
    const prisma = getPrismaClient();
    const [result] = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;

    if (Number(result?.ok) !== 1) {
      throw new Error("Unexpected database readiness result");
    }

    return Response.json(
      { status: "ok", path: pathname, database: "connected" },
      { headers },
    );
  } catch {
    return Response.json(
      { status: "unavailable", path: pathname, database: "unavailable" },
      { status: 503, headers },
    );
  }
}
