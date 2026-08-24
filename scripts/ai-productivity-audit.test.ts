import assert from "node:assert/strict";
import { projectAiProductivityAudit } from "../lib/governance/ai-productivity-audit";

const projection = projectAiProductivityAudit({
  delegatedWork: ["ケース比較", " ケース比較 ", "情報整理"],
  humanRepetitiveWork: ["同じ転記作業"],
  addedReviewWork: ["AI文章の事実確認"],
  freedTimeMinutes: 37.6,
  freedTimeReturnedTo: ["お客様との会話", "現場観察"],
  unusedSystems: ["使っていないダッシュボード"],
  removalCandidates: ["旧自動化"],
});

assert.deepEqual(projection.delegatedWork, ["ケース比較", "情報整理"]);
assert.equal(projection.freedTimeMinutes, 38);
assert.deepEqual(projection.freedTimeReturnedTo, ["お客様との会話", "現場観察"]);
assert.deepEqual(projection.attention, [
  "反復作業がまだ池田側に残っている",
  "AIによって確認作業が増えている",
  "未使用または削除候補の仕組みがある",
]);

const missingReturn = projectAiProductivityAudit({
  delegatedWork: [],
  humanRepetitiveWork: [],
  addedReviewWork: [],
  freedTimeMinutes: 20,
  freedTimeReturnedTo: [],
  unusedSystems: [],
  removalCandidates: [],
});
assert.deepEqual(missingReturn.attention, ["AIで生まれた余白の戻し先が記録されていない"]);

const unknownTime = projectAiProductivityAudit({
  delegatedWork: [],
  humanRepetitiveWork: [],
  addedReviewWork: [],
  freedTimeMinutes: -1,
  freedTimeReturnedTo: [],
  unusedSystems: [],
  removalCandidates: [],
});
assert.equal(unknownTime.freedTimeMinutes, null);

console.log("ai-productivity-audit tests passed");
