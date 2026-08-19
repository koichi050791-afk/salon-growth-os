# 池田航一｜美容師OS 総リニューアル方針

## 目的

旧Salon Growth OSの店舗管理型UIを、池田航一個人のExperience Learning Systemへ全面移行する。

最上位目標は、9:00〜18:00の勤務と家族時間を守りながら、月間技術売上130万円を持続的・安定的に達成し、その理由を説明・再現できる状態を作ること。

## 中心単位

Customer / Store / Weekly KPI ではなく Decision。

Observation → Hypothesis → Options → Decision → Action → Outcome → Next Observation → Learning

## 表側の主要機能

1. HOME
   - 現場検証フェーズを明示
   - Decision記録を最優先CTAにする
   - 130万円プロジェクトの目的を常時確認できる
   - 直近Decisionへアクセスできる

2. Decision記録
   - 相談
   - 確認した事実
   - 今回の判断
   - あえてしなかったこと
   - 次回確認
   - 3分以内で残す

3. Decision一覧
   - AirtableをSource of Truthとして直近Decisionを表示
   - 顧客PIIは表示しない
   - 次回確認を見返せる

4. 130万円プロジェクト
   - 目標と制約
   - 現在フェーズ
   - 観察対象
   - 機能追加より現場検証を優先

## 旧機能の扱い

旧店舗管理系route / repository / Supabase tableは即削除しない。
まず通常導線から外し、legacyとして保持する。

対象例:
- stores / store selection
- weekly-input
- dashboard
- overview / 全店
- monthly-report
- monthly-config
- staff
- improvement-actions

新OSのProduction動作が安定した後、依存関係を確認して段階的に削除する。

## UI原則

- 池田個人専用
- iPhone優先
- 3分以内入力
- 余計なKPIを見せない
- 判断・次回観察・学習を中心にする
- 旧店舗管理概念を表側に出さない
- Source of Truthを増やさない

## v1の完了条件

- ログイン後の入口が池田個人HOME
- 旧店舗名・全店・スタッフ・週次KPIが通常導線から消えている
- Decision記録が最短1タップで開く
- 直近DecisionをAirtableから読める
- 130万円プロジェクトの現在地を確認できる
- `/decision-input` → Airtable保存を壊していない
