import assert from "node:assert/strict";
import { evaluateGovernance, type GovernanceContext } from "../lib/governance/ai-governance.ts";

const baseContext: GovernanceContext = {
  domain: "INFORMATION_RESEARCH",
  hasPrimaryInformation: true,
  factsSeparatedFromInference: true,
  conflictsWithPastRecord: false,
  affectsCustomerData: false,
  changesBrandPolicy: false,
  causesExternalPublication: false,
  affectsProduction: false,
  isDestructive: false,
  causesCharge: false,
  isImportantBusinessDecision: false,
  requiresIkedaJudgment: false,
};

const evaluate = (overrides: Partial<GovernanceContext> = {}) =>
  evaluateGovernance({ ...baseContext, ...overrides });

assert.deepEqual(evaluate(), {
  decision: "AUTO",
  evidenceState: "KNOWN",
  reasons: ["SAFE_FOR_AUTO"],
  canExecuteWithoutHuman: true,
});

assert.deepEqual(evaluate({ hasPrimaryInformation: false }), {
  decision: "STOP",
  evidenceState: "UNKNOWN",
  reasons: ["PRIMARY_INFORMATION_MISSING"],
  canExecuteWithoutHuman: false,
});

assert.equal(evaluate({ factsSeparatedFromInference: false }).decision, "STOP");
assert.equal(evaluate({ conflictsWithPastRecord: true }).decision, "STOP");

for (const gate of [
  { affectsCustomerData: true },
  { changesBrandPolicy: true },
  { causesExternalPublication: true },
  { affectsProduction: true },
  { isDestructive: true },
  { causesCharge: true },
  { isImportantBusinessDecision: true },
] satisfies Partial<GovernanceContext>[]) {
  const result = evaluate(gate);
  assert.equal(result.decision, "APPROVAL");
  assert.equal(result.canExecuteWithoutHuman, false);
}

assert.deepEqual(evaluate({ requiresIkedaJudgment: true }), {
  decision: "REVIEW",
  evidenceState: "KNOWN",
  reasons: ["IKEDA_JUDGMENT_REQUIRED"],
  canExecuteWithoutHuman: false,
});

// Priority must remain STOP > APPROVAL > REVIEW > AUTO.
const priorityResult = evaluate({
  hasPrimaryInformation: false,
  affectsProduction: true,
  requiresIkedaJudgment: true,
});
assert.equal(priorityResult.decision, "STOP");
assert.equal(priorityResult.evidenceState, "UNKNOWN");

console.log("AI governance tests passed");
