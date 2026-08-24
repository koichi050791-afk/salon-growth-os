# AI Company Phase 5｜Outcome Measurement / Learning Loop Validation v1

更新: 2026-08-25

## 目的

Phase 5の目的は、AI会社・IKEDA Personal OSが「記録した」「分析した」で終わらず、REALな現場データで次の循環を閉じられる状態を作ること。

`Decision → Next Observation → Return Visit → Outcome → Validation → Learning → Next Decision`

新Agent、新Dashboard、新Automationを増やすことは目的にしない。

## 最上位原則

- Outcomeは後日の観察事実であり、自動的な成功証明ではない。
- Validationは過去Decisionに対する暫定評価であり、Knowledge昇格と同義ではない。
- 単一Caseから一般化しない。
- REAL以外のTEST / SAMPLE / UNKNOWNをLearning Evidenceへ昇格しない。
- 次回来店がない、観察できない、顧客反応が不明な場合はINCONCLUSIVEを正常な結果として扱う。
- AIはOutcomeを捏造・推測しない。

## Validation状態

- `UNVALIDATED`: 次回確認待ち
- `CONFIRMED`: 今回のDecisionを支持するOutcomeが観察された
- `PARTIAL`: 一部支持、一部修正が必要
- `CONTRADICTED`: Decisionを反証するOutcomeが観察された
- `INCONCLUSIVE`: 判定に必要なEvidenceが不足

## Field Gate

Validation対象になるのは以下をすべて満たすDecisionのみ。

1. `dataKind = REAL`
2. Next Observationが保存されている
3. Validation状態が`UNVALIDATED`
4. 実際の次回来店または信頼できる後日観察がある

満たさない場合は無理に閉じない。

## Outcome入力原則

Outcomeには観察事実・顧客の言葉を優先して残す。

良い例:
- 「前回より結んだ時に顔まわりが落ちにくかった」
- 「褪色は想定より早く、4週間で黄みを感じた」
- 「広がりは減ったが、右側だけ扱いにくさが残った」

避ける例:
- 「前回の判断は正解だった」
- 「この方法は40代女性に有効」

後者はValidation / Learning側の解釈として扱う。

## Human Intervention Point

AIへ任せる:
- 開いているValidation候補の抽出
- 前回Decision / Not Chosen / Next Observationの提示
- Outcomeと過去Decisionの比較整理
- 類似Case候補の検索
- 反証候補の提示

池田が判断する:
- Validation状態
- Professional interpretation
- 次回の施術方針
- 一般化可能性

AI停止:
- Outcomeが推測しかできない
- 顧客の言葉とAI解釈が分離できない
- REALか不明
- Next Observationがない
- 1件だけでKnowledge化しようとしている

## Learning Gate

Validation完了後も、直ちにKnowledgeへ昇格しない。

Learning候補に必要なもの:
- 元Decision
- Not Chosen
- Next Observation
- Outcome
- Validation
- 反証可能性
- 成立条件 / 非成立条件の候補

Knowledge候補化は複数のREAL Caseまたは十分な反証・再現Evidenceが集まってから行う。

## Phase 5 Scorecard

量ではなく循環の質を見る。

- Open REAL Validations
- Completed REAL Validations
- CONFIRMED / PARTIAL / CONTRADICTED / INCONCLUSIVEの分布
- 前回Decisionが次回来店で実際に参照された割合
- Outcomeから次のDecisionが更新された件数
- AI推測をOutcomeとして保存した件数 = 0を維持
- TEST / SAMPLE / UNKNOWNがREAL Evidenceへ昇格した件数 = 0を維持

## 完了条件

Phase 5の設計完了条件:
- REAL-only Validation Gateが定義される
- Outcome / Validationの保存契約が定義される
- Learning Gateが定義される
- AI停止条件が定義される
- Active RoadmapがOutcome / Learning中心へ絞られる

Phase 5の現場検証完了条件:
- 実際のREAL Decisionで最低1件、次回来店Outcome / Validationが完了する
- そのOutcomeが次のDecisionまたはLearning候補へ実際に利用される

現場検証がない限り、AIは「Phase 5が事業Outcomeまで完了した」と宣言しない。
