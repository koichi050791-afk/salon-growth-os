export type GovernanceDecision = "AUTO" | "REVIEW" | "APPROVAL" | "STOP";
export type GovernanceEvidenceState = "KNOWN" | "UNKNOWN";

export type GovernanceDomain =
  | "SALON_WORK"
  | "INFORMATION_RESEARCH"
  | "PUBLISHING"
  | "SECONDARY_REVENUE"
  | "PERSONAL_OS";

export type GovernanceContext = {
  domain: GovernanceDomain;
  hasPrimaryInformation: boolean;
  factsSeparatedFromInference: boolean;
  conflictsWithPastRecord: boolean;
  affectsCustomerData: boolean;
  changesBrandPolicy: boolean;
  causesExternalPublication: boolean;
  affectsProduction: boolean;
  isDestructive: boolean;
  causesCharge: boolean;
  isImportantBusinessDecision: boolean;
  requiresIkedaJudgment: boolean;
};

export type GovernanceReason =
  | "PRIMARY_INFORMATION_MISSING"
  | "FACT_INFERENCE_NOT_SEPARATED"
  | "PAST_RECORD_CONFLICT"
  | "CUSTOMER_DATA_IMPACT"
  | "BRAND_POLICY_CHANGE"
  | "EXTERNAL_PUBLICATION"
  | "PRODUCTION_IMPACT"
  | "DESTRUCTIVE_ACTION"
  | "CHARGE"
  | "IMPORTANT_BUSINESS_DECISION"
  | "IKEDA_JUDGMENT_REQUIRED"
  | "SAFE_FOR_AUTO";

export type GovernanceResult = {
  decision: GovernanceDecision;
  evidenceState: GovernanceEvidenceState;
  reasons: GovernanceReason[];
  canExecuteWithoutHuman: boolean;
};

const stopReasons = (context: GovernanceContext): GovernanceReason[] => {
  const reasons: GovernanceReason[] = [];

  if (!context.hasPrimaryInformation) reasons.push("PRIMARY_INFORMATION_MISSING");
  if (!context.factsSeparatedFromInference) reasons.push("FACT_INFERENCE_NOT_SEPARATED");
  if (context.conflictsWithPastRecord) reasons.push("PAST_RECORD_CONFLICT");

  return reasons;
};

const approvalReasons = (context: GovernanceContext): GovernanceReason[] => {
  const reasons: GovernanceReason[] = [];

  if (context.affectsCustomerData) reasons.push("CUSTOMER_DATA_IMPACT");
  if (context.changesBrandPolicy) reasons.push("BRAND_POLICY_CHANGE");
  if (context.causesExternalPublication) reasons.push("EXTERNAL_PUBLICATION");
  if (context.affectsProduction) reasons.push("PRODUCTION_IMPACT");
  if (context.isDestructive) reasons.push("DESTRUCTIVE_ACTION");
  if (context.causesCharge) reasons.push("CHARGE");
  if (context.isImportantBusinessDecision) reasons.push("IMPORTANT_BUSINESS_DECISION");

  return reasons;
};

/**
 * Fail-closed governance evaluator for IKEDA Personal OS.
 *
 * Priority is intentionally strict:
 * STOP > APPROVAL > REVIEW > AUTO.
 *
 * STOP means the proposal itself must pause because evidence is missing,
 * facts and inference cannot be separated, or the current record conflicts.
 * APPROVAL means AI may prepare the proposal but cannot execute it without Ikeda.
 * REVIEW means execution still depends on Ikeda's professional/product judgment.
 * AUTO is reserved for bounded, reversible work with sufficient evidence.
 */
export function evaluateGovernance(context: GovernanceContext): GovernanceResult {
  const stops = stopReasons(context);
  if (stops.length > 0) {
    return {
      decision: "STOP",
      evidenceState: context.hasPrimaryInformation ? "KNOWN" : "UNKNOWN",
      reasons: stops,
      canExecuteWithoutHuman: false,
    };
  }

  const approvals = approvalReasons(context);
  if (approvals.length > 0) {
    return {
      decision: "APPROVAL",
      evidenceState: "KNOWN",
      reasons: approvals,
      canExecuteWithoutHuman: false,
    };
  }

  if (context.requiresIkedaJudgment) {
    return {
      decision: "REVIEW",
      evidenceState: "KNOWN",
      reasons: ["IKEDA_JUDGMENT_REQUIRED"],
      canExecuteWithoutHuman: false,
    };
  }

  return {
    decision: "AUTO",
    evidenceState: "KNOWN",
    reasons: ["SAFE_FOR_AUTO"],
    canExecuteWithoutHuman: true,
  };
}
