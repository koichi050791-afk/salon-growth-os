# IKEDA OFFICE Industry note Asset Inventory v1

更新: 2026-08-25

## 目的

業界向けnote既存30本を、上位テーマ **「美容師の経験を、働く資産に変える」** の下で再分類する。

分類:
- KEEP
- UPDATE
- MERGE
- PERIPHERAL
- PRODUCT PART

## 集計

- KEEP: 4
- UPDATE: 7
- MERGE: 11
- PERIPHERAL: 4
- PRODUCT PART: 4
- 合計: 30

30本を30テーマとして運用しない。少数のCanonical資産へ統合する。
PRODUCT PARTは即商品化を意味せず、Product Validation Gate通過後に使う将来部品。

## 全30本 最終分類

| IP | 分類 | 役割 |
|---|---|---|
| IP-001 | KEEP | REALなAI検索一次事例。現場Evidence |
| IP-002 | PRODUCT PART | 判断過程を発信資産へ変える部品 |
| IP-003 | KEEP | AIを経験再利用の増幅器として説明する中核 |
| IP-004 | KEEP | 現場経験→記録→検証→再利用のCore |
| IP-005 | UPDATE | AI検索論のAccuracy修正 |
| IP-006 | UPDATE | Manifesto / Hub |
| IP-007 | PERIPHERAL | 一般仕事論 |
| IP-008 | PERIPHERAL | 旧組織・提案論 |
| IP-009 | PERIPHERAL | 一般生産性論 |
| IP-010 | PRODUCT PART | 現場言語化の商品部品 |
| IP-011 | MERGE | IP-029へ吸収 |
| IP-012 | MERGE | IP-030 / IP-015へ吸収 |
| IP-013 | PRODUCT PART | Personal OS / 体系商品のOrigin部品 |
| IP-014 | MERGE | IP-015 / IP-026へ吸収 |
| IP-015 | PRODUCT PART | 時間・価値・売上の商品部品 |
| IP-016 | UPDATE | 選択・メニュー設計Canonical |
| IP-017 | PERIPHERAL | 旧HPB / 事業推進資産 |
| IP-018 | MERGE | IP-016へ吸収 |
| IP-019 | MERGE | IP-016 / IP-015へ吸収 |
| IP-020 | MERGE | IP-016へ吸収 |
| IP-021 | UPDATE | 信頼・継続理解のCanonical |
| IP-022 | MERGE | IP-015へ吸収 |
| IP-023 | MERGE | IP-026へ吸収 |
| IP-024 | MERGE | IP-015 / IP-013へ吸収、Evidence Hold |
| IP-025 | MERGE | IP-015 / IP-021へ吸収、Accuracy Hold |
| IP-026 | UPDATE | 数字を観察材料として扱うCanonical |
| IP-027 | UPDATE | 関係性・再来Canonical |
| IP-028 | MERGE | IP-021 / IP-027へ吸収 |
| IP-029 | UPDATE | Problem / Thesis |
| IP-030 | KEEP | 現場R&Dの実験記事 |

## 公開導線

```text
IP-029 Problem
↓
IP-006 Manifesto / Hub
↓
IP-004 Core
↓
IP-003 AI Amplifier
↓
IP-002 Asset Conversion
↓
IP-010 / IP-013 Product Parts
```

IP-001 / IP-030はREALな現場Evidenceを供給するHop記事。

## Canonical統合

### 選択・メニュー設計
Canonical: IP-016
吸収: IP-018 / IP-019 / IP-020

### 時間・価値・売上
Canonical: IP-015 + IP-030
吸収: IP-012 / IP-014 / IP-022 / IP-024 / IP-025
補助: IP-026

### 関係性・再来
Canonical: IP-021 / IP-027
吸収: IP-028

### 業界構造・消耗
Canonical: IP-029
吸収: IP-011

### 数字・マーケティング
Canonical: IP-026
吸収: IP-023
IP-017はPeripheral。

## 需要検証3テーマ

販売・価値設計は `IKEDA_OFFICE_SELLING_VALUE_FRAMEWORK_V1.md` を適用する。
ProblemだけでなくDesire / Valueまで確認する。

### Theme A｜経験をどう残せば、次に使えるのか
主資産: IP-004 / IP-010 / IP-006
Core Value: **働くほど、自分の専門性と知的資産が増えていく。**

### Theme B｜AIをどう使えば、経験を再利用できるのか
主資産: IP-003 / IP-013 / IP-001
Core Value: **AIによって仕事を増やすのではなく、人にしかできない判断へ時間を戻す。**

### Theme C｜現場の判断を、どう発信・商品へ変えるのか
主資産: IP-002 / IP-029 / IP-004
Core Value: **美容師として働くこと自体が、次の収益資産を生む。**

優先順位: A → B → C。

## 優先実行順

### P0｜公開Identity
表示名・プロフィールは完了済み。
残り:
1. IP-006を新Manifestoへ公開反映
2. IP-029を新Problem正本へ公開反映

### P1｜幹を揃える
- IP-004 KEEP
- IP-003 KEEP
- IP-002を自然な日本語へ修正
- IP-005 Accuracy Update

### P2｜重複を減らす
Canonicalへ統合する。

### P3｜需要と価値を観測
Theme A / B / Cの順で次を記録する。

- Feature
- Surface Problem
- Desired Outcome
- Avoided Loss
- Core Value
- 具体的な質問・相談
- 購入理由 / 非購入理由
- 利用結果

新しい有料商品は、Gate 0.5 Desire / Valueを通過するまで作らない。

## 商品化停止条件

- 「面白い」「参考になった」だけで具体質問がない
- 欲しい未来 / 避けたい損失が不明
- 購入Evidenceが弱い
- 池田の個別説明なしでは使えない
- Real Case / Outcome / 反証が不足
- 売れるほど池田の労働時間が増える
- 鮮度依存が強い

## 結論

最上位テーマは一つ。

**美容師の経験を、働く資産に変える。**

商品は記事量や情報量から作らない。

**Problem → Desire / Value → 購入 → 利用 → Outcome**

が確認されたものだけ次の段階へ進める。
