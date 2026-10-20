import assert from "node:assert/strict";
import test from "node:test";
import { selectRequiredConsentPolicies } from "../src/lib/consent.ts";

const policies = [
  { id: "terms-v2", policyType: "terms_of_service" },
  { id: "privacy-v2", policyType: "privacy_notice" },
  { id: "terms-v1", policyType: "terms_of_service" },
];

test("consent requires the current terms and privacy policy versions", () => {
  assert.deepEqual(
    selectRequiredConsentPolicies(
      { policyIds: ["terms-v2", "privacy-v2"] },
      policies,
    ),
    ["terms-v2", "privacy-v2"],
  );
});

test("consent rejects outdated, duplicate, and incomplete selections", () => {
  assert.equal(
    selectRequiredConsentPolicies(
      { policyIds: ["terms-v1", "privacy-v2"] },
      policies,
    ),
    null,
  );
  assert.equal(
    selectRequiredConsentPolicies(
      { policyIds: ["terms-v2", "terms-v2"] },
      policies,
    ),
    null,
  );
  assert.equal(
    selectRequiredConsentPolicies({ policyIds: ["terms-v2"] }, policies),
    null,
  );
});

test("consent fails closed until both required policy types are published", () => {
  assert.equal(
    selectRequiredConsentPolicies({ policyIds: ["terms-v2"] }, [
      { id: "terms-v2", policyType: "terms_of_service" },
    ]),
    null,
  );
});
