import type { GovernanceResult } from "./ai-governance";

export type StandardReturnKind =
  | "FACT"
  | "CHANGE"
  | "DECISION_MATERIAL"
  | "ACTION"
  | "DEFER";

export type StandardReturnItem = {
  id: string;
  text: string;
  kind: StandardReturnKind;
  priority: number;
  governance: GovernanceResult;
};

export type StandardReturnProjection = {
  nowSee: string[];
  doNow: string | null;
  doNot: string[];
  ikedaJudgment: string[];
};

const normalizeText = (text: string) => text.trim().replace(/\s+/g, " ");

const byPriorityThenId = (a: StandardReturnItem, b: StandardReturnItem) => {
  if (a.priority !== b.priority) return b.priority - a.priority;
  return a.id.localeCompare(b.id);
};

const uniqueByText = (items: StandardReturnItem[]) => {
  const seen = new Set<string>();

  return items.filter((item) => {
    const normalized = normalizeText(item.text);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};

const normalizedSorted = (items: StandardReturnItem[]) =>
  uniqueByText(items)
    .map((item) => ({ ...item, text: normalizeText(item.text) }))
    .sort(byPriorityThenId);

/**
 * Read-only projection for the IKEDA Personal OS standard return format.
 *
 * The projection does not execute work or invent missing information.
 * UNKNOWN / STOP / APPROVAL / REVIEW items can be surfaced for attention,
 * but only KNOWN + AUTO actions can become the single `doNow` item.
 */
export function projectStandardReturn(
  rawItems: StandardReturnItem[],
): StandardReturnProjection {
  const items = normalizedSorted(rawItems);

  const nowSee = items
    .filter((item) => item.kind !== "ACTION" && item.kind !== "DEFER")
    .slice(0, 3)
    .map((item) => item.text);

  const safeAction = items.find(
    (item) =>
      item.kind === "ACTION" &&
      item.governance.decision === "AUTO" &&
      item.governance.evidenceState === "KNOWN" &&
      item.governance.canExecuteWithoutHuman,
  );

  const doNot = items
    .filter(
      (item) =>
        item.kind === "DEFER" ||
        (item.kind === "ACTION" && item.governance.decision !== "AUTO"),
    )
    .map((item) => item.text);

  const ikedaJudgment = items
    .filter(
      (item) =>
        item.governance.decision === "REVIEW" ||
        item.governance.decision === "APPROVAL" ||
        item.governance.decision === "STOP",
    )
    .map((item) => item.text);

  return {
    nowSee,
    doNow: safeAction?.text ?? null,
    doNot,
    ikedaJudgment,
  };
}
