import assert from "node:assert/strict";
import { evaluateGovernance } from "../lib/governance/ai-governance";
import { projectStandardReturn } from "../lib/governance/standard-return";

const baseContext = {
  domain: "PERSONAL_OS" as const,
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

const auto = evaluateGovernance(baseContext);
const review = evaluateGovernance({ ...baseContext, requiresIkedaJudgment: true });
const approval = evaluateGovernance({ ...baseContext, affectsProduction: true });
const stop = evaluateGovernance({ ...baseContext, hasPrimaryInformation: false });

const projection = projectStandardReturn([
  { id: "f2", text: "  重要な変化 B  ", kind: "CHANGE", priority: 8, governance: auto },
  { id: "f1", text: "重要な事実 A", kind: "FACT", priority: 10, governance: auto },
  { id: "f3", text: "判断材料 C", kind: "DECISION_MATERIAL", priority: 7, governance: review },
  { id: "f4", text: "4番目は表示しない", kind: "FACT", priority: 1, governance: auto },
  { id: "a1", text: "安全な次の一手", kind: "ACTION", priority: 9, governance: auto },
  { id: "a2", text: "本番反映", kind: "ACTION", priority: 10, governance: approval },
  { id: "a3", text: "一次情報なしで進める", kind: "ACTION", priority: 11, governance: stop },
  { id: "d1", text: "今は機能追加しない", kind: "DEFER", priority: 6, governance: auto },
]);

assert.deepEqual(projection.nowSee, ["重要な事実 A", "重要な変化 B", "判断材料 C"]);
assert.equal(projection.doNow, "安全な次の一手");
assert.deepEqual(projection.doNot, ["一次情報なしで進める", "本番反映", "今は機能追加しない"]);
assert.deepEqual(projection.ikedaJudgment, ["一次情報なしで進める", "本番反映", "判断材料 C"]);

const noSafeAction = projectStandardReturn([
  { id: "a1", text: "公開する", kind: "ACTION", priority: 10, governance: approval },
  { id: "a2", text: "推測で進める", kind: "ACTION", priority: 9, governance: stop },
]);
assert.equal(noSafeAction.doNow, null);

const deduped = projectStandardReturn([
  { id: "f1", text: "同じ事実", kind: "FACT", priority: 5, governance: auto },
  { id: "f2", text: "  同じ   事実  ", kind: "FACT", priority: 4, governance: auto },
]);
assert.deepEqual(deduped.nowSee, ["同じ事実"]);

console.log("standard-return tests passed");
