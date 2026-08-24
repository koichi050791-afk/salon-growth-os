export type AiProductivityAuditInput = {
  delegatedWork: string[];
  humanRepetitiveWork: string[];
  addedReviewWork: string[];
  freedTimeMinutes: number | null;
  freedTimeReturnedTo: string[];
  unusedSystems: string[];
  removalCandidates: string[];
};

export type AiProductivityAuditProjection = {
  delegatedWork: string[];
  humanRepetitiveWork: string[];
  addedReviewWork: string[];
  freedTimeMinutes: number | null;
  freedTimeReturnedTo: string[];
  unusedSystems: string[];
  removalCandidates: string[];
  attention: string[];
};

const cleanList = (values: string[]) => {
  const seen = new Set<string>();

  return values
    .map((value) => value.trim().replace(/\s+/g, " "))
    .filter((value) => {
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
};

/**
 * Read-only weekly audit projection.
 *
 * It intentionally does not count agents, automations, prompts, or tools as success.
 * The audit focuses on work shifted away from Ikeda, review burden created by AI,
 * and whether freed time returns to human-only value creation.
 */
export function projectAiProductivityAudit(
  input: AiProductivityAuditInput,
): AiProductivityAuditProjection {
  const delegatedWork = cleanList(input.delegatedWork);
  const humanRepetitiveWork = cleanList(input.humanRepetitiveWork);
  const addedReviewWork = cleanList(input.addedReviewWork);
  const freedTimeReturnedTo = cleanList(input.freedTimeReturnedTo);
  const unusedSystems = cleanList(input.unusedSystems);
  const removalCandidates = cleanList(input.removalCandidates);

  const freedTimeMinutes =
    input.freedTimeMinutes === null || input.freedTimeMinutes < 0
      ? null
      : Math.round(input.freedTimeMinutes);

  const attention: string[] = [];

  if (humanRepetitiveWork.length > 0) {
    attention.push("反復作業がまだ池田側に残っている");
  }

  if (addedReviewWork.length > 0) {
    attention.push("AIによって確認作業が増えている");
  }

  if (freedTimeMinutes !== null && freedTimeMinutes > 0 && freedTimeReturnedTo.length === 0) {
    attention.push("AIで生まれた余白の戻し先が記録されていない");
  }

  if (unusedSystems.length > 0 || removalCandidates.length > 0) {
    attention.push("未使用または削除候補の仕組みがある");
  }

  return {
    delegatedWork,
    humanRepetitiveWork,
    addedReviewWork,
    freedTimeMinutes,
    freedTimeReturnedTo,
    unusedSystems,
    removalCandidates,
    attention,
  };
}
