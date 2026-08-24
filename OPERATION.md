# 池田航一｜美容師OS 運用ルール

## 更新：2026年8月24日

## 目的

このOSは店舗管理ツールではなく、池田航一個人のサロンワークからDecisionを残し、顧客理解・次回来店・Knowledge・発信・経営判断へ学習をつなげるための仕組みとする。

## 現在フェーズ

ホップ｜現場検証。

一日の売上や客数だけで因果関係を決めず、観察 → 仮説 → 小さく試す → 結果 → 修正を繰り返す。

## 現場入力

Decision記録は原則3分以内。

- 相談
- 確認した事実
- 今回の判断
- あえてしなかったこと
- 次回確認

全顧客・全施術を詳細記録しない。判断価値・学習価値が高いCaseを優先する。

## 事実と仮説

Customer TruthとProfessional Hypothesisを分離する。AIの推測を事実へ昇格させない。

分からない情報は無理に埋めず `UNKNOWN` として残す。

## Knowledge

単一Caseから確定しない。Decision、Outcome、類似Case、反証、成立条件・非成立条件を重ねてKnowledge Candidateを育てる。

## Value Architecture

現場で生まれた判断と結果を、顧客価値と知的資産の両方へ変換する。

基本フロー：

Customer Problem → Professional Decision → Outcome → Value Evidence → Knowledge → Content / Product / Price / Revenue

AIで価値や価格を捏造しない。現場で生まれた価値をEvidenceとして蓄積し、AIで発見・比較・構造化・再利用する。

## AI運用の最上位原則

AIの目的は池田を業務から完全に外すことではない。

池田にしかできない、現場観察、違和感の把握、顧客との関係、選択、最終判断へ時間を集中させるために、探索・比較・整理・変換・監査をAIへ移す。

標準ループ：

AIが大量に処理する → 池田には少量だけ返す → 必要なところだけ池田が判断する → 実行する → 現実の結果を次の一次情報へ戻す

Human Intervention Point、AI停止条件、標準返却形式、AI生産性監査の詳細は `docs/AI_GOVERNANCE_V0.1.md` を正本とする。

## 130万円プロジェクト

最上位目標は、9:00〜18:00の勤務と家族との時間を守りながら、月間技術売上130万円を持続的・安定的に達成すること。

長時間労働、予約の詰め込み、値引き中心、大量新規集客、不要な追加提案、家族時間の犠牲は採用しない。

## Source of Truth

Decisionの正本はAirtable。Supabaseは当面認証用途に限定する。旧Salon Growth OSの店舗・スタッフ・週次KPI等のテーブルは新規機能から参照しない。
