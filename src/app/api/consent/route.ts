import { auth } from "@/auth";
import { selectRequiredConsentPolicies } from "@/lib/consent";
import { getPrismaClient } from "@/lib/prisma";

const headers = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const configuredOrigin = process.env.AUTH_URL;
  if (!configuredOrigin) {
    return Response.json(
      { error: "consent_service_unavailable" },
      { status: 503, headers },
    );
  }

  let expectedOrigin: string;
  try {
    expectedOrigin = new URL(configuredOrigin).origin;
  } catch {
    return Response.json(
      { error: "consent_service_unavailable" },
      { status: 503, headers },
    );
  }

  if (request.headers.get("origin") !== expectedOrigin) {
    return Response.json({ error: "origin_not_allowed" }, { status: 403, headers });
  }
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  ) {
    return Response.json(
      { error: "application_json_required" },
      { status: 415, headers },
    );
  }

  let session;
  try {
    session = await auth();
  } catch {
    return Response.json(
      { error: "customer_auth_unavailable" },
      { status: 503, headers },
    );
  }
  const customerId = session?.user?.id;
  if (!customerId) {
    return Response.json({ error: "authentication_required" }, { status: 401, headers });
  }

  let input: unknown;
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 2048) {
      return Response.json({ error: "request_too_large" }, { status: 413, headers });
    }
    input = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400, headers });
  }

  try {
    const prisma = getPrismaClient();
    const currentPolicies = await prisma.consentPolicy.findMany({
      where: { effectiveAt: { lte: new Date() }, retiredAt: null },
      orderBy: { effectiveAt: "desc" },
      select: { id: true, policyType: true },
    });
    const selectedPolicyIds = selectRequiredConsentPolicies(
      input,
      currentPolicies,
    );
    if (!selectedPolicyIds) {
      const activeTypes = new Set(currentPolicies.map((policy) => policy.policyType));
      const policiesAvailable =
        activeTypes.has("terms_of_service") && activeTypes.has("privacy_notice");
      return Response.json(
        { error: policiesAvailable ? "current_policy_selection_required" : "policies_unpublished" },
        { status: policiesAvailable ? 409 : 503, headers },
      );
    }

    await prisma.$transaction([
      prisma.customerConsent.createMany({
        data: selectedPolicyIds.map((policyId) => ({
          customerId,
          policyId,
        })),
      }),
      prisma.auditLog.create({
        data: {
          actorType: "customer",
          actorId: customerId,
          action: "customer.consent.accepted",
          targetType: "consent_policy_set",
          targetId: selectedPolicyIds.join(","),
        },
      }),
    ]);

    return Response.json({ status: "accepted" }, { status: 201, headers });
  } catch {
    return Response.json(
      { error: "consent_service_unavailable" },
      { status: 503, headers },
    );
  }
}

export async function DELETE(request: Request) {
  let expectedOrigin: string;
  try {
    if (!process.env.AUTH_URL) throw new Error("AUTH_URL is required");
    expectedOrigin = new URL(process.env.AUTH_URL).origin;
  } catch {
    return Response.json(
      { error: "consent_service_unavailable" },
      { status: 503, headers },
    );
  }

  if (request.headers.get("origin") !== expectedOrigin) {
    return Response.json({ error: "origin_not_allowed" }, { status: 403, headers });
  }

  let session;
  try {
    session = await auth();
  } catch {
    return Response.json(
      { error: "customer_auth_unavailable" },
      { status: 503, headers },
    );
  }
  const customerId = session?.user?.id;
  if (!customerId) {
    return Response.json({ error: "authentication_required" }, { status: 401, headers });
  }

  const policyId = new URL(request.url).searchParams.get("policyId");
  if (!policyId || policyId.length > 128) {
    return Response.json({ error: "policy_id_required" }, { status: 400, headers });
  }

  try {
    const prisma = getPrismaClient();
    const revokedAt = new Date();
    const count = await prisma.$transaction(async (transaction) => {
      const result = await transaction.customerConsent.updateMany({
        where: { customerId, policyId, revokedAt: null },
        data: { revokedAt },
      });
      if (result.count > 0) {
        await transaction.auditLog.create({
          data: {
            actorType: "customer",
            actorId: customerId,
            action: "customer.consent.withdrawn",
            targetType: "consent_policy",
            targetId: policyId,
          },
        });
      }
      return result.count;
    });

    if (count === 0) {
      return Response.json({ error: "active_consent_not_found" }, { status: 404, headers });
    }
    return Response.json({ status: "withdrawn" }, { headers });
  } catch {
    return Response.json(
      { error: "consent_service_unavailable" },
      { status: 503, headers },
    );
  }
}
