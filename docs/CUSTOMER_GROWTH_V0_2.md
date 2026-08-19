# Customer Growth Layer v0.2

## Purpose

池田航一｜美容師OSで、今月の売上だけでなく「来月以降も売上を生む顧客基盤が強くなっているか」を観測する。

これは顧客ランク付け、失客確率予測、自動営業CRMではない。

## Source of Truth

- Customer / Visit / Decision / Future Plan: Airtable
- Decisionの5項目入力: 既存 `/decision-input` を維持
- 認証: Supabase Auth
- Customer Growthの表示: Airtableをread-onlyで観測

## Phase 0: time axis

最初に成立させる時間軸は以下。

Customer → Visit → Decision → Next Observation

全顧客の詳細カルテを作らない。Decision詳細は学習価値があるケースを中心に残す。

## Customer fields added in v0.2

- Customer State: NEW / DEVELOP / CORE / WATCH / DORMANT
- Expected Cycle Days
- Last Visit Date
- Expected Return Date = Last Visit Date + Expected Cycle Days
- Next Plan Status: BOOKED / PLANNED / NONE

Customer Stateは価値ランクではない。ホップ期間は候補として扱い、自動確定しない。

LOSTはv0.2では追加しない。失客確定の成立条件を30〜60日観測してから再検討する。

## Visit fields added in v0.2

- Visit Type: NEW / RETURN / RECOVER
- Acquisition Source
- Visit Reason

Acquisition Sourceが不明な場合は「不明」。AIで推測補完しない。

RECOVERはCustomer StateではなくVisit Typeとして保持する。

## WATCH

WATCHは営業LINE送信対象ではない。

Expected Returnの超過などにより「予定していた状態からズレ始めているため、何が起きているかを見る対象」。

v0.2のアプリではExpected Return超過かつBOOKEDではない顧客をWATCH候補として表示できるが、Customer Stateの自動変更、連絡判断、自動送信は行わない。

## Input burden

池田本人の入力項目は増やさない。

`/decision-input` の5項目は変更しない。Customer Growth metadataは「美容師OS｜現場入力」の自然文をChatGPT側で必要に応じてCustomer / Visit / Decisionへ構造化する運用を基本とする。

## Deferred

- LTV予測
- AI失客確率
- RFM / 顧客スコア
- 自動LINE
- Outcome専用テーブル
- 高度な売上予測
- State別売上KPI
- 自動Lifecycle遷移

State別売上を将来正確に分析する場合は、Customerの現在StateではなくVisit時点のState snapshotが必要になる。必要性が確認された時点で追加する。
