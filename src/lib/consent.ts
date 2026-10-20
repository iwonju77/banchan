export const REQUIRED_CONSENT_POLICY_TYPES = [
  "terms_of_service",
  "privacy_notice",
] as const;

export type ConsentPolicyReference = {
  id: string;
  policyType: string;
};

export function selectRequiredConsentPolicies(
  input: unknown,
  currentPolicies: ConsentPolicyReference[],
): string[] | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const policyIds = (input as { policyIds?: unknown }).policyIds;
  if (
    !Array.isArray(policyIds) ||
    policyIds.length !== REQUIRED_CONSENT_POLICY_TYPES.length ||
    !policyIds.every((id): id is string => typeof id === "string") ||
    new Set(policyIds).size !== policyIds.length
  ) {
    return null;
  }

  const policyByType = new Map<string, string>();
  for (const policy of currentPolicies) {
    if (!policyByType.has(policy.policyType)) {
      policyByType.set(policy.policyType, policy.id);
    }
  }

  const requiredIds = REQUIRED_CONSENT_POLICY_TYPES.map((type) =>
    policyByType.get(type),
  );
  if (requiredIds.some((id) => !id)) return null;

  const selected = new Set(policyIds);
  return requiredIds.every((id) => selected.has(id!)) ? policyIds : null;
}
